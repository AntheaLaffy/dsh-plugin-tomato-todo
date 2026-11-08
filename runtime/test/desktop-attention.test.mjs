import assert from "node:assert/strict";
import { test } from "node:test";
import { focusForDesktopEvents } from "../src/main.mjs";

const settle = () => new Promise((resolve) => setImmediate(resolve));

test("启动时已有提醒和完成记录不补聚焦；每拍的新事件只聚焦一次", async () => {
  let calls = 0;
  const guard = {
    focus: async () => {
      calls++;
      return { ok: true, status: 200, data: { focused: true } };
    },
  };
  const baseline = { serial: 2, reminderIds: ["existing"] };
  assert.deepEqual(focusForDesktopEvents(guard, baseline, baseline), []);
  await settle();
  assert.equal(calls, 0);

  const due = { serial: 2, reminderIds: ["existing", "a", "b"] };
  assert.deepEqual(focusForDesktopEvents(guard, baseline, due), ["a", "b"]);
  await settle();
  assert.equal(calls, 1);
  assert.deepEqual(focusForDesktopEvents(guard, due, due), []);
  await settle();
  assert.equal(calls, 1);

  const complete = { serial: 3, reminderIds: ["existing", "a", "b"] };
  assert.deepEqual(focusForDesktopEvents(guard, due, complete), []);
  await settle();
  assert.equal(calls, 2);

  const both = { serial: 4, reminderIds: ["existing", "a", "b", "c"] };
  assert.deepEqual(focusForDesktopEvents(guard, complete, both), ["c"]);
  await settle();
  assert.equal(calls, 3);
});

test("guard 聚焦失败不打断新提醒处理", async () => {
  const errors = [];
  const previous = { serial: 0, reminderIds: [] };
  const next = { serial: 0, reminderIds: ["due"] };
  const guard = { focus: () => Promise.reject(new Error("桌面不可达")) };
  assert.deepEqual(
    focusForDesktopEvents(guard, previous, next, (message) =>
      errors.push(message),
    ),
    ["due"],
  );
  await settle();
  assert.deepEqual(errors, ["guard focus 失败：桌面不可达"]);

  const unavailable = {
    focus: async () => ({ ok: false, status: 503, error: "守卫不可达" }),
  };
  assert.deepEqual(
    focusForDesktopEvents(unavailable, previous, next, (message) =>
      errors.push(message),
    ),
    ["due"],
  );
  await settle();
  assert.equal(errors.at(-1), "guard focus 失败：守卫不可达");
});
