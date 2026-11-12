// 侧栏「我的项目」→ 全部任务的项目筛选：信号必须被消费且只消费一次，
// 切页动作和筛选值分开（已经在本页时 setActivePageId 不会重挂，靠订阅生效）。
//
// 这里直接测 navigation.js 的模块级契约，不渲染页面：筛选消费、订阅广播、
// 未知/清空值（null = 全部项目）都走一遍。
import test from "node:test";
import assert from "node:assert/strict";

const nav = await import("../plugin/src/client/app/navigation.js");

test("项目筛选：订阅者收到值，切页到 tasks，取走后清空", () => {
  const seen = [];
  const off = nav.subscribeTasksFilter((value) => seen.push(value));

  nav.openTasksForProject("p-1");
  assert.deepEqual(seen, ["p-1"]);
  assert.equal(nav.getActivePageId(), "tasks");
  assert.equal(nav.takeTasksFilter(), "p-1");
  assert.equal(nav.takeTasksFilter(), null);

  off();
  nav.openTasksForProject(null);
  assert.deepEqual(seen, ["p-1"]);
  assert.equal(nav.takeTasksFilter(), null);
});

test("navigate(user)：切页并调用绑定的面板打开器", () => {
  let opened = 0;
  nav.bindPanelOpener((panelId) => {
    assert.equal(panelId, "tomato");
    opened += 1;
  });
  assert.equal(nav.navigate({ page: "focus", reason: "user" }), true);
  assert.equal(opened, 1);
  assert.equal(nav.getActivePageId(), "focus");

  nav.bindPanelOpener(null);
  assert.equal(nav.navigate({ page: "stats", reason: "user" }), true);
  assert.equal(opened, 1);
  assert.equal(nav.getActivePageId(), "stats");
});

test("项目筛选：取消订阅后不再收到广播", () => {
  const seen = [];
  const off = nav.subscribeTasksFilter((value) => seen.push(value));
  off();
  nav.openTasksForProject("p-2");
  assert.deepEqual(seen, []);
  assert.equal(nav.takeTasksFilter(), "p-2");
});

const { isCatchUp, todayTasks } =
  await import("../plugin/src/client/shared/derive.js");
const clockAt = (day, hour, minute = 0) =>
  new Date(2026, 10, day, hour, minute).getTime() / 1000;
const scheduledTask = (changes = {}) => ({
  id: "task",
  completed: false,
  dueDate: "2026-11-12",
  reminderTime: "09:00",
  focusMinutes: 25,
  estimate: 2,
  scrapMinutes: 60,
  recurring: false,
  repeat: "none",
  reminderExpired: false,
  ...changes,
});
const viewAt = (time, task) => ({
  serverTime: time,
  data: {
    tasks: [task],
    settings: {
      focusMinutes: 25,
      shortBreakMinutes: 5,
      longBreakMinutes: 15,
      longBreakEvery: 4,
    },
  },
});

test("待补边界：提醒时间加专注和段间休息，未作废时才进入", () => {
  const task = scheduledTask();
  assert.equal(
    isCatchUp(viewAt(clockAt(12, 9, 54), task), task, "2026-11-12"),
    false,
  );
  assert.equal(
    isCatchUp(viewAt(clockAt(12, 9, 55), task), task, "2026-11-12"),
    true,
  );
  assert.equal(
    isCatchUp(
      viewAt(clockAt(12, 10), task),
      { ...task, reminderExpired: true },
      "2026-11-12",
    ),
    false,
  );
});

test("循环任务跨日不报废：有精确提醒进入待补，无精确提醒不进入", () => {
  const task = scheduledTask({ repeat: "daily", recurring: true });
  assert.equal(
    isCatchUp(viewAt(clockAt(15, 10), task), task, "2026-11-15"),
    true,
  );
  assert.equal(
    isCatchUp(
      viewAt(clockAt(15, 10), task),
      { ...task, reminderTime: null },
      "2026-11-15",
    ),
    false,
  );
  assert.equal(
    isCatchUp(
      viewAt(clockAt(15, 10), task),
      { ...task, dueDate: null, reminderTime: null },
      "2026-11-15",
    ),
    false,
  );
  assert.equal(todayTasks({ tasks: [task] }, "2026-11-15").length, 1);
});

const { teachingMaterialIds } =
  await import("../plugin/src/client/pages/assignment-dialog.js");
test("教学资料：本任务引用优先，未指定时回退项目资料，隔离其他项目", () => {
  const resources = [
    { id: "paper", projectId: "p" },
    { id: "book", projectId: "p" },
    { id: "other", projectId: "q" },
  ];
  assert.deepEqual(
    teachingMaterialIds(
      {
        projectId: "p",
        resourceIds: ["paper"],
        questions: [{ sourceIds: ["book"] }],
      },
      resources,
    ),
    ["paper"],
  );
  assert.deepEqual(
    teachingMaterialIds({ projectId: "p", resourceIds: ["book"] }, resources),
    ["book"],
  );
  assert.deepEqual(
    teachingMaterialIds({ projectId: "p", resourceIds: [] }, resources),
    ["paper", "book"],
  );
});

const { listedTasks } = await import("../plugin/src/client/shared/derive.js");
test("报废任务退出任务清单和计数，原始历史仍保留", () => {
  const expired = scheduledTask({ reminderExpired: true });
  const done = scheduledTask({ id: "done", completed: true });
  const recurring = scheduledTask({
    id: "repeating",
    recurring: true,
    repeat: "daily",
    reminderExpired: false,
  });
  const data = { tasks: [expired, done, recurring] };
  assert.deepEqual(
    listedTasks(data).map((task) => task.id),
    ["done", "repeating"],
  );
  assert.equal(data.tasks.length, 3);
});

const { habitSchedule } = await import("../plugin/src/client/pages/habits.js");
test("新建习惯从空时段开始，不读取未分组任务；编辑只读本习惯的循环任务", () => {
  const tasks = [
    { id: "ordinary", habitId: null, reminderTime: "08:50", completed: false },
    {
      id: "another",
      habitId: "other",
      reminderTime: "09:40",
      completed: false,
      repeat: "weekly",
      repeatDays: [1],
    },
    {
      id: "mine",
      habitId: "habit",
      reminderTime: null,
      completed: false,
      repeat: "daily",
      repeatDays: [],
    },
  ];
  assert.equal(habitSchedule(tasks, null), null);
  assert.equal(habitSchedule(tasks, undefined), null);
  assert.deepEqual(habitSchedule(tasks, "habit").slots, []);
  assert.equal(habitSchedule(tasks, "habit").task.id, "mine");
  assert.deepEqual(habitSchedule(tasks, "other").slots, [
    { days: [1], time: "09:40" },
  ]);
});
