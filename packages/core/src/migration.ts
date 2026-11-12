//! 仅本地 v3/v4→v5 转换：交换文件按当前版本严格校验，不走迁移路径。
//! 对应 crates/core/src/migration.rs（仅文件格式语义）。

import { id } from "./ids";
import { AppError } from "./errors";
import {
  addDays,
  formatDate,
  parseDate,
  weekdayMonday,
  dateAt,
  now,
} from "./time";
import { parseAppData, parseTask, serializeTask } from "./lib";

function upgradeTaskValue(task: Record<string, unknown>, today: string): void {
  const date =
    typeof task["createdAt"] === "number"
      ? dateAt(task["createdAt"] as number)
      : today;
  delete task["goalId"];
  delete task["nodeId"];
  if (task["dueDate"] === undefined || task["dueDate"] === null) {
    task["dueDate"] = date;
  }
}

/**
 * 读取本地存储：v3 一次性转换（移除目标主线、补齐日期），v4 直接严格解析。
 * 转换失败原文件保留（由调用方保证不写回）。
 */
export function readLocalData(raw: string): import("./lib").AppData {
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch (e) {
    throw new AppError(`数据读取失败，原文件已保留：${String(e)}`);
  }
  if (!isObject(value)) {
    throw new AppError("数据读取失败，原文件已保留：无效的本地数据");
  }
  if (value["version"] === 3) {
    const today = dateAt(now());
    value["version"] = 4;
    delete value["goals"];
    delete value["nodeBindings"];
    delete value["signalEvents"];
    const tasks = value["tasks"];
    if (Array.isArray(tasks)) {
      for (const task of tasks) {
        if (isObject(task)) upgradeTaskValue(task, today);
      }
    }
    const templates = value["templates"];
    if (Array.isArray(templates)) {
      for (const template of templates) {
        if (!isObject(template)) continue;
        const shape = template["shape"];
        if (isObject(shape)) delete shape["goalId"];
        const printing = template["printing"];
        if (
          isObject(printing) &&
          printing["kind"] === "once" &&
          (printing["date"] === null || printing["date"] === undefined)
        ) {
          printing["date"] = today;
        }
      }
    }
    const prints = value["prints"];
    if (Array.isArray(prints)) {
      value["prints"] = prints.filter((p) => isObject(p) && p["date"] !== null);
    }
    const visions = value["visions"];
    if (Array.isArray(visions)) {
      for (const vision of visions) {
        if (isObject(vision)) delete vision["goalId"];
      }
    }
    const ids = value["identities"];
    if (Array.isArray(ids)) {
      value["identities"] = ids.filter(
        (r) =>
          isObject(r) &&
          !["goal", "node", "signal"].includes(r["kind"] as string),
      );
      for (const record of value["identities"] as Record<string, unknown>[]) {
        if (typeof record["restoreTask"] === "string") {
          let task: unknown;
          try {
            task = JSON.parse(record["restoreTask"] as string);
          } catch (e) {
            throw new AppError(`数据读取失败，原文件已保留：${String(e)}`);
          }
          if (!isObject(task)) {
            throw new AppError(
              "数据读取失败，原文件已保留：无效的任务恢复记录",
            );
          }
          upgradeTaskValue(task, today);
          // 撤销恢复比较登记 DTO 的序列化（含键序）。
          record["restoreTask"] = JSON.stringify(task);
        }
      }
    }
  }
  if (value["version"] === 4) upgradeRecurringTasks(value);
  try {
    return parseAppData(value);
  } catch (e) {
    throw new AppError(
      `数据读取失败，原文件已保留：${e instanceof Error ? e.message : String(e)}`,
    );
  }
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** 只转换本机旧模型；交换文件仍严格拒绝旧版本。已印任务与历史全部保留。 */
function upgradeRecurringTasks(value: Record<string, unknown>): void {
  const tasks = Array.isArray(value["tasks"])
    ? (value["tasks"] as Record<string, unknown>[])
    : [];
  const today = dateAt(now());
  const upgrade = (task: Record<string, unknown>): void => {
    delete task["templateId"];
    task["repeat"] = task["repeat"] ?? "none";
    task["repeatDays"] = task["repeatDays"] ?? [];
    task["nextTaskId"] = task["nextTaskId"] ?? null;
    if (task["dueDate"] == null && task["repeat"] === "none")
      task["repeat"] = "daily";
    task["recurring"] = task["recurring"] === true || task["repeat"] !== "none";
    if (task["recurring"] || task["reminderTime"] == null)
      task["reminderExpired"] = false;
  };
  const templates = Array.isArray(value["templates"]) ? value["templates"] : [];
  const prints = Array.isArray(value["prints"]) ? value["prints"] : [];
  const makeTask = (
    shape: Record<string, unknown>,
    date: string,
    time: unknown,
  ): Record<string, unknown> => ({
    id: id(),
    title: shape["title"],
    notes: shape["notes"] ?? "",
    projectId: shape["projectId"] ?? null,
    habitId: shape["habitId"] ?? null,
    focusMinutes: shape["focusMinutes"] ?? null,
    scrapMinutes: shape["scrapMinutes"] ?? 0,
    expiryDays: 0,
    priority: shape["priority"] ?? 0,
    estimate: shape["estimate"] ?? 1,
    tags: shape["tags"] ?? [],
    dueDate: date,
    reminderTime: time ?? null,
    recurring: false,
    completed: false,
    completedAt: null,
    createdAt: now(),
    reminderFired: false,
    reminderPending: false,
    reminderExpired: false,
    subtasks: Array.isArray(shape["subtasks"])
      ? shape["subtasks"].map((sub) => ({ ...sub, done: false }))
      : [],
  });
  for (const template of templates) {
    if (
      !isObject(template) ||
      !isObject(template["printing"]) ||
      !isObject(template["shape"])
    )
      throw new AppError("旧模板格式无效，原文件已保留");
    const printing = template["printing"];
    const shape = template["shape"];
    if (printing["kind"] !== "weekly") {
      const slots =
        printing["kind"] === "once"
          ? [{ dates: [printing["date"]], time: printing["time"] }]
          : printing["slots"];
      if (!Array.isArray(slots))
        throw new AppError("旧日程格式无效，原文件已保留");
      for (const slot of slots) {
        if (!isObject(slot) || !Array.isArray(slot["dates"]))
          throw new AppError("旧日程格式无效，原文件已保留");
        for (const date of slot["dates"]) {
          if (typeof date !== "string" || parseDate(date) === null)
            throw new AppError("旧日程日期无效，原文件已保留");
          const printed = prints.some(
            (p) =>
              isObject(p) &&
              p["templateId"] === template["id"] &&
              p["date"] === date,
          );
          const exists = tasks.some(
            (t) => t["templateId"] === template["id"] && t["dueDate"] === date,
          );
          if (!printed && !exists)
            tasks.push(makeTask(shape, date, slot["time"]));
        }
      }
      continue;
    }
    const slots = Array.isArray(printing["slots"]) ? printing["slots"] : [];
    for (const slot of slots) {
      if (
        !isObject(slot) ||
        !Array.isArray(slot["days"]) ||
        slot["days"].length === 0
      )
        throw new AppError("旧模板包含空星期，原文件已保留");
      const days = slot["days"] as number[];
      if (!days.every((d) => Number.isInteger(d) && d >= 1 && d <= 7))
        throw new AppError("旧模板包含无效星期，原文件已保留");
      // 既有预印任务不删；最后一条未完成任务接管后续循环。
      const matches = tasks
        .filter(
          (t) =>
            t["templateId"] === template["id"] &&
            t["reminderTime"] === (slot["time"] ?? null) &&
            t["completed"] !== true &&
            typeof t["dueDate"] === "string" &&
            parseDate(t["dueDate"] as string) !== null &&
            days.includes(weekdayMonday(parseDate(t["dueDate"] as string)!)),
        )
        .sort((a, b) =>
          String(a["dueDate"]).localeCompare(String(b["dueDate"])),
        );
      let task = matches.at(-1);
      if (!task) {
        let date = parseDate(today)!;
        while (!days.includes(weekdayMonday(date))) date = addDays(date, 1);
        task = makeTask(shape, formatDate(date), slot["time"]);
        tasks.push(task);
      }
      task["repeat"] = "weekly";
      task["repeatDays"] = [...days];
    }
  }
  for (const task of tasks) upgrade(task);
  value["tasks"] = tasks;
  delete value["templates"];
  delete value["prints"];
  const identities = value["identities"];
  if (Array.isArray(identities))
    for (const entry of identities) {
      if (!isObject(entry)) continue;
      if (entry["kind"] === "template") entry["retired"] = true;
      if (typeof entry["restoreTask"] === "string") {
        const task = JSON.parse(entry["restoreTask"]);
        if (!isObject(task)) throw new AppError("无效的任务恢复记录");
        upgrade(task);
        entry["restoreTask"] = JSON.stringify(serializeTask(parseTask(task)));
      }
    }
  value["version"] = 5;
}
