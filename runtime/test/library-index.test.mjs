// 资料库索引：扫描 → 单独索引文件 → 浏览/搜索/流式读取。
//
// 为什么单独测这一层：索引不是计划、不是备份、也不是 education.resources；
// 它只描述授权目录里有什么。这里固定三件事——扫描跳过规则、索引文件权限与
// 原子写、以及 HTTP 端点只服务「当前授权根 + 索引里确实存在」的路径。
// 全部使用临时目录，不读写真实学习资料，也不启动 guard。
import test from "node:test";
import assert from "node:assert/strict";
import {
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  statSync,
  symlinkSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { request as httpRequest } from "node:http";
import { Engine } from "../src/engine.ts";
import { LibraryError, ProjectLibrary } from "../src/project-library.mjs";
import {
  DEFAULT_MAX_ENTRIES,
  INDEX_DIR,
  indexFile,
  groupForExtension,
  readIndex,
  scanLibrary,
  searchIndex,
  summarize,
  writeIndex,
} from "../src/library-index.mjs";
import { startServer } from "../src/server.mjs";

function rejects(fn, status, pattern) {
  assert.throws(fn, (error) => {
    assert.ok(
      error instanceof LibraryError,
      `应为 LibraryError，实际 ${error}`,
    );
    assert.equal(error.status, status);
    if (pattern) assert.match(error.message, pattern);
    return true;
  });
}

function buildTree() {
  const root = mkdtempSync(join(tmpdir(), "tomato-index-"));
  const libraryRoot = join(root, "library");
  const outside = join(root, "outside");
  mkdirSync(join(libraryRoot, "math", "algebra"), { recursive: true });
  mkdirSync(join(libraryRoot, "eng"), { recursive: true });
  mkdirSync(join(libraryRoot, "408"), { recursive: true });
  mkdirSync(join(libraryRoot, "politics"), { recursive: true });
  mkdirSync(join(libraryRoot, "教学安排"), { recursive: true });
  mkdirSync(join(libraryRoot, ".hidden"), { recursive: true });
  mkdirSync(join(libraryRoot, "node_modules", "pkg"), { recursive: true });
  mkdirSync(join(libraryRoot, ".git"), { recursive: true });
  mkdirSync(join(libraryRoot, "deep", "a", "b", "c", "d", "e"), {
    recursive: true,
  });
  mkdirSync(outside, { recursive: true });
  writeFileSync(join(outside, "secret.txt"), "outside");
  writeFileSync(join(libraryRoot, "math", "algebra", "lecture1.pdf"), "pdf");
  writeFileSync(join(libraryRoot, "math", "notes.md"), "# notes");
  writeFileSync(join(libraryRoot, "eng", "listening.mp3"), "mp3");
  writeFileSync(join(libraryRoot, "408", "2020真题.pdf"), "paper");
  writeFileSync(join(libraryRoot, "politics", "outline.docx"), "docx");
  writeFileSync(join(libraryRoot, "教学安排", "week1.md"), "week");
  writeFileSync(join(libraryRoot, ".hidden", "secret.pdf"), "hidden");
  writeFileSync(join(libraryRoot, ".hidden-root.txt"), "hidden");
  writeFileSync(join(libraryRoot, "node_modules", "pkg", "index.js"), "js");
  writeFileSync(join(libraryRoot, ".git", "config"), "git");
  writeFileSync(
    join(libraryRoot, "deep", "a", "b", "c", "d", "e", "f.txt"),
    "f",
  );
  symlinkSync(join(outside, "secret.txt"), join(libraryRoot, "link.pdf"));
  symlinkSync(outside, join(libraryRoot, "linkdir"));
  return { root, libraryRoot, outside };
}

const expectedPaths = [
  "408/2020真题.pdf",
  "deep/a/b/c/d/e/f.txt",
  "eng/listening.mp3",
  "math/algebra/lecture1.pdf",
  "math/notes.md",
  "politics/outline.docx",
  "教学安排/week1.md",
].sort();

test("扫描：递归、POSIX 相对路径、排序、跳过隐藏/符号链接/node_modules", async () => {
  const { libraryRoot } = buildTree();
  const index = await scanLibrary(libraryRoot);
  assert.equal(index.root, libraryRoot);
  assert.equal(index.truncated, false);
  assert.equal(index.count, expectedPaths.length);
  assert.deepEqual(
    index.items.map((item) => item.path),
    expectedPaths,
  );
  assert.equal(
    index.items.every((item) => !item.path.includes("\\")),
    true,
  );
  const pdf = index.items.find(
    (item) => item.path === "math/algebra/lecture1.pdf",
  );
  assert.deepEqual(
    { name: pdf.name, ext: pdf.ext, sizeBytes: pdf.sizeBytes },
    { name: "lecture1.pdf", ext: "pdf", sizeBytes: 3 },
  );
  assert.equal(Number.isInteger(pdf.mtime) && pdf.mtime > 0, true);
  assert.equal(
    index.items.some((item) => item.path.startsWith(".")),
    false,
  );
  assert.equal(
    index.items.some((item) => item.path.includes("node_modules")),
    false,
  );
  assert.equal(
    index.items.some((item) => item.path.includes(".git")),
    false,
  );
  assert.equal(
    index.items.some((item) => item.path === "link.pdf"),
    false,
  );
  assert.equal(
    index.items.some((item) => item.path.startsWith("linkdir")),
    false,
  );
});

test("扫描：条目上限与耗时上限都会标记 truncated", async () => {
  const { libraryRoot } = buildTree();
  const limited = await scanLibrary(libraryRoot, { maxEntries: 2 });
  assert.equal(limited.count, 2);
  assert.equal(limited.truncated, true);
  assert.equal(
    limited.items.every((item) => expectedPaths.includes(item.path)),
    true,
  );
  assert.deepEqual(
    limited.items.map((item) => item.path),
    limited.items.map((item) => item.path).sort(),
  );

  const timed = await scanLibrary(libraryRoot, { maxMs: -1 });
  assert.equal(timed.count, 0);
  assert.equal(timed.truncated, true);
  assert.deepEqual(timed.items, []);
  assert.ok(DEFAULT_MAX_ENTRIES >= 50000);
});

test("扫描：相对路径、符号链接根、文件根都被拒", async () => {
  const { libraryRoot, outside } = buildTree();
  await assert.rejects(
    () => scanLibrary("relative/path"),
    (error) => {
      assert.equal(error.status, 400);
      return true;
    },
  );
  symlinkSync(libraryRoot, join(outside, "link-root"));
  await assert.rejects(
    () => scanLibrary(join(outside, "link-root")),
    (error) => error.status === 400,
  );
  await assert.rejects(
    () => scanLibrary(join(libraryRoot, "math", "notes.md")),
    (error) => error.status === 400,
  );
});

test("索引文件：0600、原子写、可重写、损坏时拒绝读取", async () => {
  const { root, libraryRoot } = buildTree();
  const dataDir = join(root, "data");
  const index = await scanLibrary(libraryRoot);
  const written = writeIndex(dataDir, "math-id", index);
  assert.equal(written.count, expectedPaths.length);
  const file = indexFile(dataDir, "math-id");
  assert.equal(statSync(file).mode & 0o777, 0o600);
  assert.equal(
    readdirSync(join(dataDir, INDEX_DIR)).some((name) =>
      name.includes(".tmp-"),
    ),
    false,
  );
  const loaded = readIndex(dataDir, "math-id");
  assert.deepEqual(loaded, {
    root: index.root,
    scannedAt: index.scannedAt,
    count: index.count,
    items: index.items,
  });
  const raw = JSON.parse(readFileSync(file, "utf8"));
  assert.deepEqual(Object.keys(raw).sort(), [
    "count",
    "items",
    "root",
    "scannedAt",
  ]);

  const second = await scanLibrary(libraryRoot, { maxEntries: 3 });
  writeIndex(dataDir, "math-id", second);
  assert.equal(readIndex(dataDir, "math-id").count, 3);
  assert.equal(statSync(file).mode & 0o777, 0o600);
  assert.equal(
    readdirSync(join(dataDir, INDEX_DIR)).some((name) =>
      name.includes(".tmp-"),
    ),
    false,
  );

  writeFileSync(file, "{ not json");
  rejects(() => readIndex(dataDir, "math-id"), 500, /损坏|格式/);
  assert.equal(readIndex(join(root, "empty"), "math-id"), null);
  rejects(
    () =>
      writeIndex(dataDir, "math-id", {
        root: libraryRoot,
        scannedAt: 1,
        items: [{}],
      }),
    400,
  );
});

function memoryIndex() {
  const items = [
    ["math/algebra/lecture1.pdf", "lecture1.pdf", "pdf", 10],
    ["math/notes.md", "notes.md", "md", 20],
    ["eng/listening.mp3", "listening.mp3", "mp3", 30],
    ["politics/outline.docx", "outline.docx", "docx", 40],
    ["408/2020真题.pdf", "2020真题.pdf", "pdf", 50],
    ["教学安排/cover.png", "cover.png", "png", 60],
    ["other/tool.swf", "tool.swf", "swf", 70],
  ].map(([path, name, ext, sizeBytes]) => ({
    path,
    name,
    ext,
    sizeBytes,
    mtime: 1_700_000_000,
  }));
  const sorted = items.sort((a, b) => (a.path < b.path ? -1 : 1));
  return {
    root: "/tmp/library",
    scannedAt: 1_700_000_000,
    count: sorted.length,
    items: sorted,
  };
}

test("搜索：关键词、类型组、扩展名、分页与空索引", () => {
  const index = memoryIndex();
  assert.deepEqual(
    searchIndex(index, { q: "408" }).items.map((item) => item.path),
    ["408/2020真题.pdf"],
  );
  assert.equal(searchIndex(index, { q: "MATH" }).total, 2);
  assert.equal(searchIndex(index, { kind: "pdf" }).total, 2);
  assert.equal(searchIndex(index, { kind: "image" }).total, 1);
  assert.equal(searchIndex(index, { kind: "audio" }).total, 1);
  assert.equal(searchIndex(index, { kind: "doc" }).total, 2);
  assert.equal(searchIndex(index, { kind: "docx" }).total, 1);
  assert.equal(searchIndex(index, { kind: "other" }).total, 1);
  assert.equal(searchIndex(index, { kind: "swf" }).total, 1);
  assert.equal(searchIndex(index, { kind: "missing" }).total, 0);
  const page = searchIndex(index, { offset: 1, limit: 2 });
  assert.equal(page.total, index.count);
  assert.deepEqual(
    page.items.map((item) => item.path),
    ["eng/listening.mp3", "math/algebra/lecture1.pdf"],
  );
  assert.equal(searchIndex(index, { q: "nothing" }).total, 0);
  assert.equal(searchIndex(null, { q: "math" }).total, 0);
  rejects(() => searchIndex(index, { offset: -1 }), 400, /分页/);
  rejects(() => searchIndex(index, { limit: 101 }), 400, /分页/);
});

test("摘要：按扩展名、浏览分组与顶层目录计数", () => {
  const summary = summarize(memoryIndex());
  assert.equal(summary.count, 7);
  assert.equal(summary.byExt.pdf, 2);
  assert.equal(summary.byExt.swf, 1);
  assert.equal(summary.byKind.pdf, 2);
  assert.equal(summary.byKind.doc, 2);
  assert.equal(summary.byTop.math, 2);
  assert.equal(summary.byTop["教学安排"], 1);
  const empty = summarize(null);
  assert.deepEqual(empty, {
    root: null,
    scannedAt: null,
    count: 0,
    byExt: {},
    byKind: {},
    byTop: {},
  });
  assert.equal(groupForExtension("PNG"), "image");
});

function serverFixture() {
  const root = mkdtempSync(join(tmpdir(), "tomato-index-http-"));
  const dataDir = join(root, "data");
  const math = join(root, "math");
  const english = join(root, "english");
  const outside = join(root, "outside");
  mkdirSync(join(math, "algebra"), { recursive: true });
  mkdirSync(english);
  mkdirSync(outside);
  writeFileSync(join(math, "algebra", "lecture.pdf"), "pdf");
  writeFileSync(join(math, "notes.md"), "# notes");
  writeFileSync(join(math, "swap.txt"), "real");
  writeFileSync(join(english, "words.pdf"), "words");
  writeFileSync(join(outside, "secret.txt"), "secret");
  const engine = Engine.open(dataDir);
  const library = new ProjectLibrary(engine, dataDir);
  const mathId = library.create({
    name: "数学",
    color: "#b8503f",
    directory: math,
  }).projectId;
  const englishId = library.create({
    name: "英语",
    color: "#5f7b50",
    directory: english,
  }).projectId;
  return { root, dataDir, math, english, outside, engine, mathId, englishId };
}

function postScan(port, projectId) {
  return new Promise((resolve, reject) => {
    const req = httpRequest(
      {
        host: "127.0.0.1",
        port,
        path:
          "/api/projects/" + encodeURIComponent(projectId) + "/library/scan",
        method: "POST",
        headers: { "Content-Length": 0 },
      },
      (res) => {
        const chunks = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => {
          try {
            resolve({
              status: res.statusCode,
              body: JSON.parse(Buffer.concat(chunks).toString("utf8")),
            });
          } catch (error) {
            reject(error);
          }
        });
      },
    );
    req.on("error", reject);
    req.end();
  });
}

async function server(fixture) {
  const started = await startServer({
    engine: fixture.engine,
    dataDir: fixture.dataDir,
    host: "127.0.0.1",
    port: 0,
    token: "index-token",
    version: "test",
  });
  const base = "http://127.0.0.1:" + started.port;
  const json = async (path, init = {}) => {
    const response = await fetch(base + path, init);
    return { status: response.status, body: await response.json() };
  };
  return { started, base, json };
}

test("HTTP：项目索引只含本项目目录，扫描不登记资源", async () => {
  const f = serverFixture();
  const { started, json } = await server(f);
  try {
    const mathBase =
      "/api/projects/" + encodeURIComponent(f.mathId) + "/library/";
    const englishBase =
      "/api/projects/" + encodeURIComponent(f.englishId) + "/library/";
    assert.equal((await json(mathBase + "stats")).body.hasIndex, false);
    const mathScan = await json(mathBase + "scan", { method: "POST" });
    const englishScan = await json(englishBase + "scan", { method: "POST" });
    assert.equal(mathScan.body.count, 3);
    assert.equal(englishScan.body.count, 1);
    assert.equal((await json(mathBase + "items?kind=pdf")).body.total, 1);
    assert.equal((await json(mathBase + "items?q=words")).body.total, 0);
    assert.equal((await json(englishBase + "items?q=words")).body.total, 1);
    assert.equal(
      (await json(mathBase + "items?offset=1&limit=1")).body.items.length,
      1,
    );
    assert.equal((await json(mathBase + "items?limit=101")).status, 400);
    assert.equal(f.engine.data.education.resources.length, 0);
    const plan = JSON.stringify(
      f.engine.exportPlan(Math.floor(Date.now() / 1000)),
    );
    const backup = JSON.stringify(
      f.engine.exportBackup(Math.floor(Date.now() / 1000)),
    );
    assert.equal(plan.includes("library-index"), false);
    assert.equal(backup.includes("library-index"), false);
    assert.equal(statSync(indexFile(f.dataDir, f.mathId)).mode & 0o777, 0o600);
    assert.notEqual(
      indexFile(f.dataDir, f.mathId),
      indexFile(f.dataDir, f.englishId),
    );
    assert.equal(readIndex(f.dataDir, f.mathId).root, f.math);
  } finally {
    await started.close();
    f.engine.flushNow();
  }
});

test("HTTP：同一项目并发扫描共用结果，不同项目互不混用", async () => {
  const f = serverFixture();
  for (let i = 0; i < 800; i += 1)
    writeFileSync(join(f.math, "algebra", "file-" + i + ".txt"), "x");
  const { started } = await server(f);
  try {
    const [a, b, c] = await Promise.all([
      postScan(started.port, f.mathId),
      postScan(started.port, f.mathId),
      postScan(started.port, f.englishId),
    ]);
    assert.equal(a.status, 200);
    assert.equal(b.status, 200);
    assert.equal(c.status, 200);
    assert.equal(a.body.count, 803);
    assert.equal(b.body.count, 803);
    assert.equal(c.body.count, 1);
    assert.equal(a.body.scannedAt, b.body.scannedAt);
    assert.equal(a.body.durationMs, b.body.durationMs);
  } finally {
    await started.close();
    f.engine.flushNow();
  }
});

test("HTTP：项目索引文件读取、Range、路径安全与旧索引失效", async () => {
  const f = serverFixture();
  const { started, base, json } = await server(f);
  const prefix = "/api/projects/" + encodeURIComponent(f.mathId) + "/library/";
  try {
    await json(prefix + "scan", { method: "POST" });
    const token = (await json("/api/file-token")).body.access;
    const url = (path, extra = "") =>
      base +
      prefix +
      "file?path=" +
      encodeURIComponent(path) +
      "&access=" +
      token +
      extra;
    let response = await fetch(url("notes.md"));
    assert.equal(response.status, 200);
    assert.equal(await response.text(), "# notes");
    response = await fetch(url("notes.md"), {
      headers: { Range: "bytes=0-1" },
    });
    assert.equal(response.status, 206);
    assert.equal(await response.text(), "# ");
    assert.equal((await fetch(url("../outside/secret.txt"))).status, 400);
    assert.equal((await fetch(url("/etc/passwd"))).status, 400);
    assert.equal((await fetch(url("not-indexed.txt"))).status, 404);
    unlinkSync(join(f.math, "swap.txt"));
    symlinkSync(join(f.outside, "secret.txt"), join(f.math, "swap.txt"));
    assert.equal((await fetch(url("swap.txt"))).status, 400);
    const newDir = join(f.root, "math-new");
    mkdirSync(newDir);
    const authorized = await json(
      "/api/projects/" + encodeURIComponent(f.mathId) + "/authorize",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ directory: newDir }),
      },
    );
    assert.equal(authorized.status, 200);
    const stats = await json(prefix + "stats");
    assert.equal(stats.body.stale, true);
    assert.equal(stats.body.hasIndex, false);
    assert.equal((await fetch(url("notes.md"))).status, 409);
  } finally {
    await started.close();
    f.engine.flushNow();
  }
});
