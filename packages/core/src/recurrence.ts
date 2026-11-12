//! 任务直接拥有循环规则；只有完成当前这次才安排下一次。
import { ensure } from "./errors";
import { id } from "./ids";
import type { AppData, Action } from "./lib";
import type { Task } from "./model";
import { addDays, dateAt, formatDate, parseDate, weekdayMonday } from "./time";

export function taskIsVoid(task: Task): boolean {
  return !task.completed && task.repeat === "none" && task.reminderExpired;
}

export function validateRepeat(task: Task): void {
  ensure(
    ["none", "daily", "weekdays", "weekly"].includes(task.repeat),
    "无效的循环规则",
  );
  ensure(
    task.repeatDays.length <= 7 &&
      new Set(task.repeatDays).size === task.repeatDays.length &&
      task.repeatDays.every((d) => Number.isInteger(d) && d >= 1 && d <= 7),
    "无效的循环星期",
  );
  ensure(
    task.repeat === "weekly" || task.repeatDays.length === 0,
    "只有每周循环可以指定星期",
  );
  ensure(task.repeat === "none" || task.recurring, "循环任务必须保留重复来源");
  ensure(
    task.dueDate !== null ||
      (task.reminderTime === null && task.repeat === "daily"),
    "无日期任务必须是无提醒的每日循环任务",
  );
  ensure(
    task.nextTaskId === null ||
      (task.nextTaskId.trim().length > 0 && task.nextTaskId !== task.id),
    "无效的下一次任务 ID",
  );
}

export function nextDate(
  task: Pick<Task, "dueDate" | "repeat" | "repeatDays">,
  at: number,
): string {
  const today = dateAt(at);
  const anchor = parseDate(task.dueDate ?? today)!;
  let day = parseDate(
    task.dueDate !== null && task.dueDate > today ? task.dueDate : today,
  )!;
  const days =
    task.repeatDays.length > 0 ? task.repeatDays : [weekdayMonday(anchor)];
  do {
    day = addDays(day, 1);
  } while (
    (task.repeat === "weekdays" && weekdayMonday(day) > 5) ||
    (task.repeat === "weekly" && !days.includes(weekdayMonday(day)))
  );
  return formatDate(day);
}

export function createNextTask(data: AppData, task: Task, at: number): void {
  if (task.repeat === "none" || task.nextTaskId !== null) return;
  const next: Task = {
    ...task,
    id: id(),
    dueDate: nextDate(task, at),
    nextTaskId: null,
    createdAt: at,
    completed: false,
    completedAt: null,
    reminderFired: false,
    reminderPending: false,
    reminderExpired: false,
    tags: [...task.tags],
    subtasks: task.subtasks.map((s) => ({ ...s, done: false })),
  };
  // 标记在原任务上，撤销完成、删除下一次或重启后都不会再次生成。
  task.nextTaskId = next.id;
  data.tasks.push(next);
}

export function saveHabitTasks(
  data: AppData,
  habitId: string,
  action: Extract<Action, { type: "saveHabit" }>,
  at: number,
): void {
  ensure(action.slots.length <= 49, "习惯最多 49 个时段");
  const requested = action.slots.length
    ? action.slots
    : [{ days: [1, 2, 3, 4, 5, 6, 7], time: null }];
  const seen = new Set<string>();
  for (const slot of requested) {
    ensure(
      slot.days.length > 0 &&
        slot.days.every((d) => Number.isInteger(d) && d >= 1 && d <= 7),
      "习惯时段需要有效星期",
    );
    for (const day of slot.days) {
      const key = `${day}|${slot.time}`;
      ensure(!seen.has(key), "习惯时段重复");
      seen.add(key);
    }
  }
  const leaves = data.tasks.filter(
    (t) => t.habitId === habitId && !t.completed && t.nextTaskId === null,
  );
  const kept = new Set<string>();
  for (const slot of requested) {
    const existing =
      leaves.find((t) => !kept.has(t.id) && t.reminderTime === slot.time) ??
      leaves.find((t) => !kept.has(t.id));
    const date = parseDate(dateAt(at))!;
    let first = date;
    while (!slot.days.includes(weekdayMonday(first))) first = addDays(first, 1);
    const task: Task = existing ?? {
      id: id(),
      title: action.name.trim(),
      notes: "",
      projectId: action.projectId,
      habitId,
      dueDate: formatDate(first),
      reminderTime: slot.time,
      focusMinutes: action.focusMinutes,
      scrapMinutes: 0,
      expiryDays: 0,
      priority: 0,
      estimate: 1,
      recurring: true,
      repeat: "weekly",
      repeatDays: [...slot.days],
      nextTaskId: null,
      reminderFired: false,
      reminderPending: false,
      reminderExpired: false,
      completed: false,
      completedAt: null,
      createdAt: at,
      tags: [],
      subtasks: [],
    };
    task.title = action.name.trim();
    task.projectId = action.projectId;
    task.focusMinutes = action.focusMinutes;
    task.repeat = "weekly";
    task.repeatDays = action.slots.length ? [...slot.days] : [];
    task.repeat = action.slots.length ? "weekly" : "daily";
    task.recurring = true;
    if (task.reminderTime !== slot.time) {
      task.reminderTime = slot.time;
      task.reminderFired = false;
      task.reminderPending = false;
      task.reminderExpired = false;
    }
    if (!action.slots.length) task.dueDate = null;
    else if (
      task.dueDate === null ||
      !slot.days.includes(weekdayMonday(parseDate(task.dueDate)!))
    ) {
      task.dueDate = formatDate(first);
      task.reminderFired = false;
      task.reminderPending = false;
      task.reminderExpired = false;
    }
    if (!existing) data.tasks.push(task);
    kept.add(task.id);
  }
  // 移除时段只停止后续循环，已有待办与历史仍保留。
  for (const task of leaves)
    if (!kept.has(task.id)) {
      task.repeat = "none";
      task.repeatDays = [];
      task.recurring = false;
      if (task.dueDate === null) task.dueDate = dateAt(at);
    }
}

export function replaceAppData(target: AppData, source: AppData): void {
  Object.assign(target, source);
}
