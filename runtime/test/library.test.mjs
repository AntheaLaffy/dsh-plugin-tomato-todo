// 项目资料授权、上传与登记均以项目自己的目录为边界。
import test from "node:test";
import assert from "node:assert/strict";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  renameSync,
  statSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { homedir, tmpdir } from "node:os";
import { join } from "node:path";
import { Engine } from "../src/engine.ts";
import { LibraryError, ProjectLibrary } from "../src/project-library.mjs";
import { startServer, UI_ORIGIN } from "../src/server.mjs";

function fixture() {
  const root = mkdtempSync(join(tmpdir(), "tomato-library-"));
  const dataDir = join(root, "data");
  const math = join(root, "math");
  const english = join(root, "english");
  mkdirSync(join(math, "algebra"), { recursive: true });
  mkdirSync(english);
  const engine = Engine.open(dataDir);
  return {
    root,
    dataDir,
    math,
    english,
    engine,
    library: new ProjectLibrary(engine, dataDir),
  };
}

function rejects(fn, status, pattern) {
  assert.throws(fn, (error) => {
    assert.ok(error instanceof LibraryError, String(error));
    assert.equal(error.status, status);
    if (pattern) assert.match(error.message, pattern);
    return true;
  });
}

test("每个项目单独授权，授权记录私有，目录不能重叠", () => {
  const f = fixture();
  const math = f.library.create({
    name: "数学",
    color: "#b8503f",
    directory: f.math,
  });
  const english = f.library.create({
    name: "英语",
    color: "#5f7b50",
    directory: f.english,
  });
  assert.equal(f.library.mount(math.projectId), f.math);
  assert.equal(f.library.mount(english.projectId), f.english);
  assert.equal(f.library.grantStatus(math.projectId).authorized, true);
  const grantFile = join(f.dataDir, "project-grants.json");
  assert.equal(statSync(grantFile).mode & 0o777, 0o600);
  assert.deepEqual(
    JSON.parse(readFileSync(grantFile, "utf8"))
      .map((g) => g.directory)
      .sort(),
    [f.math, f.english].sort(),
  );
  rejects(
    () => f.library.bind(english.projectId, join(f.math, "algebra")),
    400,
    /重叠/,
  );
  f.library.putGrant(math.projectId, null);
  rejects(() => f.library.mount(math.projectId), 403, /授权/);
  assert.equal(f.library.grantStatus(math.projectId).authorized, false);
  assert.equal(f.library.mount(english.projectId), f.english);
  f.engine.flushNow();
});

test("项目授权拒绝不安全目录，文件与上传路径不得越界或经过符号链接", () => {
  const f = fixture();
  const link = join(f.root, "math-link");
  symlinkSync(f.math, link);
  for (const path of [
    "/",
    homedir(),
    f.dataDir,
    link,
    "relative",
    join(f.root, "missing"),
  ])
    rejects(
      () =>
        f.library.create({ name: "坏目录", color: "#b8503f", directory: path }),
      400,
    );
  const project = f.library.create({
    name: "数学",
    color: "#b8503f",
    directory: f.math,
  });
  writeFileSync(join(f.math, "algebra", "book.pdf"), "book");
  symlinkSync(join(f.english, "secret.txt"), join(f.math, "link.txt"));
  assert.equal(
    f.library.resolveFile(project.projectId, "algebra/book.pdf").sizeBytes,
    4,
  );
  for (const path of [
    "../english/secret.txt",
    "/etc/passwd",
    "a\\b",
    ".hidden/x",
    "node_modules/x",
  ])
    rejects(() => f.library.uploadPath(project.projectId, path), 400);
  rejects(
    () => f.library.resolveFile(project.projectId, "link.txt"),
    400,
    /符号链接/,
  );
  rejects(
    () => f.library.uploadPath(project.projectId, "link.txt"),
    400,
    /符号链接/,
  );
  assert.equal(
    f.library.uploadPath(project.projectId, "new/sub/file.pdf"),
    join(f.math, "new", "sub", "file.pdf"),
  );
  f.engine.flushNow();
});

test("重新授权到原目录的子目录时保留资源 ID 并重定位已有路径", () => {
  const f = fixture();
  const project = f.library.create({
    name: "数学",
    color: "#b8503f",
    directory: f.math,
  });
  writeFileSync(join(f.math, "algebra", "book.pdf"), "book");
  const resource = f.library.register(project.projectId, {
    title: "教材",
    kind: "book",
    path: "algebra/book.pdf",
    source: "教材",
    edition: "1",
  });
  // 旧数据可能只保留绑定元数据，而共享库授权已经退役。
  f.library.putGrant(project.projectId, null);
  const result = f.library.bind(project.projectId, join(f.math, "algebra"));
  assert.equal(result.rebased, 1);
  assert.equal(result.missing, 0);
  const current = f.library.resource(resource.id);
  assert.equal(current.path, "book.pdf");
  assert.equal(current.id, resource.id);
  f.engine.flushNow();
});

test("HTTP：文件选择器上传保留目录层级、多文件可登记；同名不覆盖", async () => {
  const f = fixture();
  const project = f.library.create({
    name: "数学",
    color: "#b8503f",
    directory: f.math,
  });
  const id = encodeURIComponent(project.projectId);
  const started = await startServer({
    engine: f.engine,
    dataDir: f.dataDir,
    host: "127.0.0.1",
    port: 0,
    token: "library-test",
    version: "test",
  });
  const base = "http://127.0.0.1:" + started.port;
  const json = async (path, init = {}) => {
    const response = await fetch(base + path, init);
    return { status: response.status, body: await response.json() };
  };
  const postJson = (path, body, headers = {}) =>
    json(path, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(body),
    });
  const upload = (path, body, headers = {}) =>
    json("/api/projects/" + id + "/files?path=" + encodeURIComponent(path), {
      method: "POST",
      headers,
      body,
    });
  try {
    const paths = ["数学/代数/讲义.pdf", "数学/真题.pdf", "notes.md"];
    for (const path of paths) {
      const result = await upload(path, "hello", { Origin: UI_ORIGIN });
      assert.equal(result.status, 201);
      assert.equal(result.body.path, path);
      assert.equal(
        readFileSync(join(f.math, ...path.split("/")), "utf8"),
        "hello",
      );
    }
    assert.equal((await upload(paths[0], "overwrite")).status, 409);
    assert.equal(
      readFileSync(join(f.math, ...paths[0].split("/")), "utf8"),
      "hello",
    );
    for (const path of [
      "../bad.pdf",
      "/etc/passwd",
      ".private/x",
      "node_modules/x",
    ])
      assert.equal((await upload(path, "bad")).status, 400);
    assert.equal(
      (await upload("evil.txt", "bad", { Origin: "http://evil.example" }))
        .status,
      403,
    );
    const scan = await json("/api/projects/" + id + "/library/scan", {
      method: "POST",
    });
    assert.equal(scan.body.count, 3);
    const items = await json("/api/projects/" + id + "/library/items");
    assert.equal(items.body.total, 3);
    const registered = await postJson(
      "/api/projects/" + id + "/resources/import",
      { paths },
    );
    assert.equal(registered.body.registered, 3);
    assert.ok(
      f.engine.data.education.resources.every(
        (resource) => resource.kind === "reference",
      ),
    );
    const again = await postJson("/api/projects/" + id + "/resources/import", {
      paths,
    });
    assert.equal(again.body.skipped, 3);
    const state = await json("/api/state");
    assert.equal(
      state.body.data.education.resourceCounts[project.projectId],
      3,
    );
    assert.deepEqual(state.body.data.education.resources, []);
    const token = (await json("/api/file-token")).body.access;
    const file = await fetch(
      base +
        "/api/projects/" +
        id +
        "/library/file?path=" +
        encodeURIComponent(paths[0]) +
        "&access=" +
        token,
    );
    assert.equal(file.status, 200);
    assert.equal(await file.text(), "hello");
  } finally {
    await started.close();
    f.engine.flushNow();
  }
});

test("项目目录失联后不再提供原文件", () => {
  const f = fixture();
  const project = f.library.create({
    name: "数学",
    color: "#b8503f",
    directory: f.math,
  });
  renameSync(f.math, join(f.root, "moved"));
  rejects(() => f.library.mount(project.projectId), 403, /失联/);
  assert.equal(f.library.grantStatus(project.projectId).authorized, false);
  f.engine.flushNow();
});

test("启动时清理退役共享授权与索引，不影响项目授权", async () => {
  const f = fixture();
  const project = f.library.create({
    name: "数学",
    color: "#b8503f",
    directory: f.math,
  });
  for (const name of ["library-grant.json", "library-index.json"])
    writeFileSync(join(f.dataDir, name), "legacy");
  const started = await startServer({
    engine: f.engine,
    dataDir: f.dataDir,
    host: "127.0.0.1",
    port: 0,
    token: "library-test",
    version: "test",
  });
  try {
    for (const name of ["library-grant.json", "library-index.json"])
      assert.throws(() => statSync(join(f.dataDir, name)), /ENOENT/);
    assert.equal(f.library.mount(project.projectId), f.math);
  } finally {
    await started.close();
    f.engine.flushNow();
  }
});
