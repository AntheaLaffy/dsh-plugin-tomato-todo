// 项目目录的文件索引：只回答「授权目录里有什么」，不回答「教学记录引用了什么」。
//
// 为什么需要独立一层：真实资料库有近五千个文件，逐个 education.saveResource
// 登记会让 plan.json 每次写盘都重写整份、每份快照都序列化；而 Resource.kind
// 是固定枚举，靠扩展名自动猜类型必然猜错。索引放在数据目录的独立 JSON 里，
// 不进计划、不进备份；批量登记时先用中性的 reference 类型，之后按用途整理。
import { createHash, randomUUID } from "node:crypto";
import {
  existsSync,
  lstatSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { isAbsolute, join } from "node:path";
import { LibraryError } from "./project-library.mjs";

export const INDEX_DIR = "project-library-indexes";
export const DEFAULT_MAX_ENTRIES = 50_000;
export const DEFAULT_MAX_MS = 30_000;
export const INDEX_KINDS = ["pdf", "image", "audio", "video", "doc", "other"];

const SKIP_DIRS = new Set(["node_modules", ".git"]);
const BYTES_PER_YIELD = 256;

const EXT_GROUPS = {
  image: [
    "png",
    "jpg",
    "jpeg",
    "webp",
    "gif",
    "bmp",
    "svg",
    "heic",
    "tif",
    "tiff",
  ],
  audio: ["mp3", "wav", "flac", "m4a", "aac", "ogg", "wma", "opus"],
  video: ["mp4", "mkv", "mov", "avi", "webm", "flv", "wmv"],
  doc: [
    "doc",
    "docx",
    "ppt",
    "pptx",
    "xls",
    "xlsx",
    "txt",
    "md",
    "markdown",
    "csv",
    "json",
    "html",
    "htm",
    "rtf",
    "odt",
    "ods",
    "odp",
  ],
};

const yieldToLoop = () => new Promise((resolve) => setImmediate(resolve));

function extensionOf(name) {
  const dot = name.lastIndexOf(".");
  return dot > 0 && dot < name.length - 1
    ? name.slice(dot + 1).toLocaleLowerCase()
    : "";
}

/** 顶层目录：`math/a/b.pdf` → `math`；库根文件用 `.`。 */
export function topLevelOf(path) {
  const value = String(path ?? "");
  const slash = value.indexOf("/");
  return slash < 0 ? "." : value.slice(0, slash);
}

/** 扩展名 → 浏览分组（pdf/image/audio/video/doc/other）。 */
export function groupForExtension(ext) {
  const value = String(ext ?? "").toLocaleLowerCase();
  if (value === "pdf") return "pdf";
  for (const [group, extensions] of Object.entries(EXT_GROUPS)) {
    if (extensions.includes(value)) return group;
  }
  return "other";
}

function isSafeRelative(value) {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    !value.includes("\\") &&
    !value.includes("\0") &&
    !isAbsolute(value) &&
    value.split("/").every((part) => part && part !== "." && part !== "..")
  );
}

function validItem(item) {
  return (
    item &&
    typeof item === "object" &&
    isSafeRelative(item.path) &&
    typeof item.name === "string" &&
    item.name.length > 0 &&
    typeof item.ext === "string" &&
    Number.isSafeInteger(item.sizeBytes) &&
    item.sizeBytes >= 0 &&
    Number.isInteger(item.mtime)
  );
}

/**
 * 递归遍历资料库根，返回 `{root, scannedAt, count, items, truncated}`。
 *
 * 只读元数据：不打开文件内容。跳过隐藏项、node_modules/.git 与所有符号
 * 链接；限制条目数与总耗时，超限时返回已收集的前缀并标记 truncated。
 * 扫描是异步的（每 256 条让出一次事件循环），HTTP 服务不会因为大目录卡死。
 */
export async function scanLibrary(root, opts = {}) {
  if (typeof root !== "string" || !isAbsolute(root)) {
    throw new LibraryError(400, "资料库根必须是绝对路径");
  }
  const maxEntries = opts.maxEntries ?? DEFAULT_MAX_ENTRIES;
  const maxMs = opts.maxMs ?? DEFAULT_MAX_MS;
  const now = typeof opts.now === "function" ? opts.now : Date.now;

  let info;
  try {
    info = lstatSync(root);
  } catch {
    throw new LibraryError(400, "资料库根不存在或不可访问");
  }
  if (info.isSymbolicLink())
    throw new LibraryError(400, "资料库根不能是符号链接");
  if (!info.isDirectory()) throw new LibraryError(400, "资料库根不是目录");

  const startedAt = now();
  const items = [];
  const pending = [""];
  let truncated = false;
  let sinceYield = 0;

  // 先让出一拍：并发扫描的第二个请求能在第一次扫描结束前看到「正在扫描」。
  await yieldToLoop();
  if (maxEntries <= 0 || now() - startedAt > maxMs) {
    return {
      root,
      scannedAt: Math.floor(Date.now() / 1000),
      count: 0,
      items,
      truncated: true,
    };
  }

  scan: while (pending.length > 0) {
    if (now() - startedAt > maxMs) {
      truncated = true;
      break;
    }
    const relativeDir = pending.pop();
    const absoluteDir =
      relativeDir === "" ? root : join(root, ...relativeDir.split("/"));
    let entries;
    try {
      entries = readdirSync(absoluteDir, { withFileTypes: true });
    } catch (error) {
      if (relativeDir === "") throw error;
      continue;
    }
    entries.sort((a, b) => a.name.localeCompare(b.name));
    for (const entry of entries) {
      if (items.length >= maxEntries) {
        truncated = true;
        break scan;
      }
      const name = entry.name;
      if (!name || name.startsWith(".")) continue;
      if (entry.isSymbolicLink()) continue;
      const relative = relativeDir === "" ? name : relativeDir + "/" + name;
      if (entry.isDirectory()) {
        if (SKIP_DIRS.has(name)) continue;
        pending.push(relative);
        continue;
      }
      if (!entry.isFile()) continue;
      let stats;
      try {
        stats = lstatSync(join(absoluteDir, name));
      } catch {
        continue;
      }
      // dirent 与 lstat 之间文件可能被换成符号链接：以 lstat 为准。
      if (!stats.isFile()) continue;
      items.push({
        path: relative,
        name,
        ext: extensionOf(name),
        sizeBytes: stats.size,
        mtime: Math.floor(stats.mtimeMs / 1000),
      });
      if (++sinceYield >= BYTES_PER_YIELD) {
        sinceYield = 0;
        await yieldToLoop();
        if (now() - startedAt > maxMs) {
          truncated = true;
          break scan;
        }
      }
    }
  }

  items.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
  return {
    root,
    scannedAt: Math.floor(Date.now() / 1000),
    count: items.length,
    items,
    truncated,
  };
}

/** 项目 ID 只用于哈希文件名，不能拼进用户目录路径。 */
export function indexFile(dataDir, projectId) {
  if (
    typeof projectId !== "string" ||
    projectId.length === 0 ||
    projectId.length > 200
  )
    throw new LibraryError(400, "项目 ID 无效");
  const name = createHash("sha256").update(projectId).digest("hex") + ".json";
  return join(dataDir, INDEX_DIR, name);
}

/** 读索引；不存在返回 null，损坏或形状不对按 500 拒绝（让用户重新扫描）。 */
export function readIndex(dataDir, projectId) {
  const file = indexFile(dataDir, projectId);
  let raw;
  try {
    raw = readFileSync(file, "utf8");
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw new LibraryError(500, "资料库索引读取失败");
  }
  let value;
  try {
    value = JSON.parse(raw);
  } catch {
    throw new LibraryError(500, "资料库索引文件损坏，请重新扫描");
  }
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    typeof value.root !== "string" ||
    !isAbsolute(value.root) ||
    !Number.isInteger(value.scannedAt) ||
    !Number.isInteger(value.count) ||
    !Array.isArray(value.items) ||
    value.count !== value.items.length ||
    !value.items.every(validItem)
  ) {
    throw new LibraryError(500, "资料库索引文件格式无效，请重新扫描");
  }
  return value;
}

/** 0600、同目录临时文件 + rename 原子替换；索引永不进计划/备份。 */
export function writeIndex(dataDir, projectId, index) {
  if (
    !index ||
    typeof index !== "object" ||
    typeof index.root !== "string" ||
    !isAbsolute(index.root) ||
    !Number.isInteger(index.scannedAt) ||
    !Array.isArray(index.items) ||
    !index.items.every(validItem)
  ) {
    throw new LibraryError(400, "资料库索引无效");
  }
  const value = {
    root: index.root,
    scannedAt: index.scannedAt,
    count: index.items.length,
    items: index.items,
  };
  const file = indexFile(dataDir, projectId);
  mkdirSync(join(dataDir, INDEX_DIR), { recursive: true });
  const temp = file + ".tmp-" + process.pid + "-" + randomUUID();
  try {
    writeFileSync(temp, JSON.stringify(value, null, 2), {
      mode: 0o600,
      flag: "wx",
    });
    renameSync(temp, file);
  } catch (error) {
    try {
      if (existsSync(temp)) unlinkSync(temp);
    } catch {}
    throw error;
  }
  return value;
}

function sortedCounts(counts) {
  return Object.fromEntries(
    Object.entries(counts).sort(
      (a, b) => b[1] - a[1] || a[0].localeCompare(b[0]),
    ),
  );
}

/** 摘要：按扩展名、浏览分组与顶层目录计数；空索引也返回零值形状。 */
export function summarize(index) {
  const byExt = {};
  const byKind = {};
  const byTop = {};
  for (const item of Array.isArray(index?.items) ? index.items : []) {
    byExt[item.ext || "(无扩展名)"] =
      (byExt[item.ext || "(无扩展名)"] ?? 0) + 1;
    const group = groupForExtension(item.ext);
    byKind[group] = (byKind[group] ?? 0) + 1;
    const top = topLevelOf(item.path);
    byTop[top] = (byTop[top] ?? 0) + 1;
  }
  return {
    root: typeof index?.root === "string" ? index.root : null,
    scannedAt: Number.isInteger(index?.scannedAt) ? index.scannedAt : null,
    count: Array.isArray(index?.items) ? index.items.length : 0,
    byExt: sortedCounts(byExt),
    byKind: sortedCounts(byKind),
    byTop: sortedCounts(byTop),
  };
}

/**
 * 索引内分页搜索。`kind` 既接受分组（pdf/image/audio/video/doc/other），
 * 也接受单个扩展名（如 docx）。
 */
export function searchIndex(
  index,
  { q = "", kind = "", offset = 0, limit = 40 } = {},
) {
  if (
    !Number.isInteger(offset) ||
    offset < 0 ||
    !Number.isInteger(limit) ||
    limit < 1 ||
    limit > 100
  ) {
    throw new LibraryError(400, "分页参数无效");
  }
  const needle = String(q).trim().toLocaleLowerCase();
  const wanted = String(kind).trim().toLocaleLowerCase();
  const matched = [];
  for (const item of Array.isArray(index?.items) ? index.items : []) {
    if (wanted !== "") {
      if (INDEX_KINDS.includes(wanted)) {
        if (groupForExtension(item.ext) !== wanted) continue;
      } else if (item.ext !== wanted) continue;
    }
    if (
      needle !== "" &&
      !item.path.toLocaleLowerCase().includes(needle) &&
      !item.name.toLocaleLowerCase().includes(needle)
    )
      continue;
    matched.push(item);
  }
  return {
    total: matched.length,
    offset,
    limit,
    items: matched.slice(offset, offset + limit),
  };
}

/** 目录是否仍在原处（供测试与诊断；不参与索引形状）。 */
export function indexRootExists(index) {
  if (typeof index?.root !== "string") return false;
  try {
    return statSync(index.root).isDirectory();
  } catch {
    return false;
  }
}
