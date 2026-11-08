// 专注期间的 renderer 关闭拦截只读快照，不依赖真实桌面或启动保护。
import assert from "node:assert/strict";
import test from "node:test";
import {
  installExitGuard,
  shouldBlockExit,
} from "../plugin/src/client/app/exit-guard.js";

const state = (timer, lock = null) => ({
  data: { timer, lock: { active: lock }, settings: { focusMinutes: 45 } },
});

test("only an active or paused focus and an active lock block DSH exit", () => {
  assert.equal(shouldBlockExit(null), false);
  assert.equal(
    shouldBlockExit(
      state({ mode: "focus", running: true, durationSecs: 2700 }),
    ),
    true,
  );
  assert.equal(
    shouldBlockExit(
      state({
        mode: "focus",
        running: false,
        durationSecs: 2700,
        remainingSecs: 1200,
      }),
    ),
    true,
  );
  assert.equal(
    shouldBlockExit(
      state({
        mode: "focus",
        running: false,
        durationSecs: 2700,
        remainingSecs: 2700,
      }),
    ),
    false,
  );
  assert.equal(
    shouldBlockExit(state({ mode: "rest", running: true, durationSecs: 300 })),
    false,
  );
  assert.equal(shouldBlockExit(state({}, { endsAt: 123 })), true);
});

test("beforeunload follows live state and unregisters on disposal", () => {
  const target = new EventTarget();
  let current = state({ mode: "focus", running: true });
  const off = installExitGuard(target, () => current);
  const first = new Event("beforeunload", { cancelable: true });
  target.dispatchEvent(first);
  assert.equal(first.defaultPrevented, true);
  assert.equal(first.returnValue, false);

  current = state({ mode: "rest", running: true });
  const rest = new Event("beforeunload", { cancelable: true });
  target.dispatchEvent(rest);
  assert.equal(rest.defaultPrevented, false);

  current = state({ mode: "focus", running: true });
  off();
  const disposed = new Event("beforeunload", { cancelable: true });
  target.dispatchEvent(disposed);
  assert.equal(disposed.defaultPrevented, false);
});
