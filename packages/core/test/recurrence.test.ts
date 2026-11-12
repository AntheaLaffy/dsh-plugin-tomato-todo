import { describe, expect, it } from "vitest";
import {
  AppData,
  Engine,
  atLocal,
  parseAction,
  parseAppData,
  parsePlanFile,
  serializeAppData,
  serializePlanFile,
  readLocalData,
} from "../src/index";

const at = (day: number, hour = 10) => atLocal(2026, 11, day, hour, 0);
const create = (
  engine: Engine,
  input: Record<string, unknown>,
  time = at(12),
) =>
  engine
    .dispatch(
      parseAction({ type: "saveTask", task: { title: "阅读", ...input } }),
      time,
    )
    .data.tasks.at(-1)!;

describe("任务直接循环", () => {
  it("无日期、无提醒默认每日循环，跨日不作废、不自动堆积", () => {
    const e = Engine.open(":memory:");
    const task = create(e, {});
    expect(task.dueDate).toBeNull();
    expect(task.repeat).toBe("daily");
    const later = e.snapshot(at(20));
    expect(later.data.tasks).toHaveLength(1);
    expect(later.data.taskIsVoid(later.data.tasks[0]!)).toBe(false);
    const done = e.dispatch({ type: "toggleTask", id: task.id }, at(20));
    expect(done.data.tasks[1]!.dueDate).toBe("2026-11-21");
    expect(done.data.tasks[1]!.repeat).toBe("daily");
    expect(done.stats.todayCompleted).toBe(1);
  });

  it("有发生日期但无精确提醒时间的非循环任务，默认当天结束作废，可延长报废天数", () => {
    const e = Engine.open(":memory:");
    const first = create(e, { dueDate: "2026-11-12" });
    const extended = create(e, { dueDate: "2026-11-12", expiryDays: 2 });
    expect(e.snapshot(at(12, 23)).data.taskIsVoid(e.data.tasks[0]!)).toBe(
      false,
    );
    const tomorrow = e.snapshot(at(13)).data;
    expect(
      tomorrow.taskIsVoid(tomorrow.tasks.find((t) => t.id === first.id)!),
    ).toBe(true);
    expect(
      tomorrow.taskIsVoid(tomorrow.tasks.find((t) => t.id === extended.id)!),
    ).toBe(false);
    expect(
      e
        .snapshot(at(15))
        .data.taskIsVoid(e.data.tasks.find((t) => t.id === extended.id)!),
    ).toBe(true);
    expect(() =>
      e.dispatch({ type: "toggleTask", id: first.id }, at(15)),
    ).toThrow(/作废/);
  });

  it("定时循环跨日保留，完成后只生成未来下一次，保留原提醒与步骤文本", () => {
    const e = Engine.open(":memory:");
    const task = create(e, {
      dueDate: "2026-11-12",
      reminderTime: "09:00",
      repeat: "daily",
      subtasks: [{ id: "read", title: "读一章", done: true }],
    });
    const later = e.snapshot(at(20));
    expect(later.data.tasks).toHaveLength(1);
    expect(later.data.tasks[0]!.reminderExpired).toBe(false);
    expect(later.stats.days.reduce((n, d) => n + d.missed, 0)).toBe(0);
    const done = e.dispatch({ type: "toggleTask", id: task.id }, at(20));
    expect(done.data.tasks[1]).toMatchObject({
      dueDate: "2026-11-21",
      reminderTime: "09:00",
      completed: false,
      reminderFired: false,
    });
    expect(done.data.tasks[1]!.subtasks[0]).toMatchObject({
      title: "读一章",
      done: false,
    });
  });

  it("每周自选星期，提前完成仍从本次计划日期之后安排", () => {
    const e = Engine.open(":memory:");
    const task = create(e, {
      dueDate: "2026-11-16",
      repeat: "weekly",
      repeatDays: [1, 3, 5],
    });
    e.dispatch({ type: "toggleTask", id: task.id }, at(12));
    expect(e.data.tasks[1]!.dueDate).toBe("2026-11-18");
  });

  it("撤销重做、备份重启和删除下一次均不会重复生成", () => {
    let e = Engine.open(":memory:");
    const task = create(e, { dueDate: "2026-11-12", repeat: "daily" });
    e.dispatch({ type: "toggleTask", id: task.id }, at(12));
    const nextId = e.data.tasks[1]!.id;
    const data = parseAppData(
      JSON.parse(JSON.stringify(serializeAppData(e.data))),
    );
    e = Engine.fromData(data, () => {});
    e.dispatch({ type: "toggleTask", id: task.id }, at(12));
    e.dispatch({ type: "toggleTask", id: task.id }, at(12));
    expect(e.data.tasks).toHaveLength(2);
    e.dispatch({ type: "deleteTask", id: nextId }, at(12));
    e.dispatch({ type: "toggleTask", id: task.id }, at(12));
    e.dispatch({ type: "toggleTask", id: task.id }, at(12));
    expect(e.data.tasks).toHaveLength(1);
  });

  it("习惯可省略全部时段，也可设置只有星期而无精确提醒的时段", () => {
    const e = Engine.open(":memory:");
    e.dispatch(parseAction({ type: "saveHabit", name: "每日阅读" }), at(12));
    expect(e.data.tasks[0]).toMatchObject({
      repeat: "daily",
      reminderTime: null,
      dueDate: null,
    });
    const habit = e.data.habits[0]!;
    e.dispatch(
      parseAction({
        type: "saveHabit",
        id: habit.id,
        name: "每日阅读",
        slots: [{ days: [1, 3, 5] }],
      }),
      at(12),
    );
    expect(e.data.tasks).toHaveLength(1);
    expect(e.data.tasks[0]).toMatchObject({
      repeat: "weekly",
      repeatDays: [1, 3, 5],
      reminderTime: null,
    });
    e.dispatch(
      parseAction({
        type: "saveHabit",
        id: habit.id,
        name: "每日阅读",
        slots: [],
      }),
      at(12),
    );
    expect(e.data.tasks[0]).toMatchObject({ repeat: "daily", dueDate: null });
    e.dispatch({ type: "deleteHabit", id: habit.id }, at(12));
    expect(e.data.tasks[0]).toMatchObject({
      repeat: "none",
      dueDate: "2026-11-12",
      habitId: null,
    });
  });

  it("计划交换保存循环规则并拒绝模板动作与旧计划", () => {
    const e = Engine.open(":memory:");
    create(e, { dueDate: "2026-11-12", repeat: "weekly", repeatDays: [2, 4] });
    const plan = parsePlanFile(serializePlanFile(e.data.exportPlan()));
    const restored = Engine.open(":memory:");
    restored.dispatch({ type: "importPlan", plan }, at(12));
    expect(restored.data.tasks[0]).toMatchObject({
      repeat: "weekly",
      repeatDays: [2, 4],
    });
    expect(serializeAppData(restored.data)).not.toHaveProperty("templates");
    expect(() =>
      parseAction({ type: "printTemplate", id: "old", dates: [] }),
    ).toThrow();
    expect(() =>
      restored.dispatch(
        { type: "importPlan", plan: { ...plan, version: 6 } },
        at(12),
      ),
    ).toThrow(/v7/);
  });

  it("本机 v4 转换保留历史与已印任务，循环规则移到最后一条对应任务上", () => {
    const e = Engine.open(":memory:");
    create(e, { dueDate: "2026-11-12", reminderTime: "09:00" });
    const raw = serializeAppData(e.data) as any;
    raw.version = 4;
    raw.tasks[0].templateId = "old";
    raw.tasks[0].recurring = true;
    raw.tasks[0].reminderExpired = true;
    delete raw.tasks[0].repeat;
    delete raw.tasks[0].repeatDays;
    delete raw.tasks[0].nextTaskId;
    raw.templates = [
      {
        id: "old",
        shape: {},
        printing: { kind: "weekly", slots: [{ days: [4], time: "09:00" }] },
      },
    ];
    raw.prints = [{ templateId: "old", date: "2026-11-12" }];
    const upgraded = readLocalData(JSON.stringify(raw));
    upgraded.validate();
    expect(upgraded.version).toBe(5);
    expect(upgraded.tasks).toHaveLength(1);
    expect(upgraded.tasks[0]).toMatchObject({
      repeat: "weekly",
      repeatDays: [4],
      reminderExpired: false,
    });
  });
});
