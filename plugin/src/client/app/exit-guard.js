// 浏览器/Electron 的页面关闭会触发 beforeunload；专注还在进行时取消卸载。
// GTK 桌面壳的原生关窗与托盘退出由壳自身检查 runtime；它还须在 WebKit
// script-dialog 中静默拒绝专注期间的 beforeunload，否则会出现原生离开按钮。
import { timerView } from "../shared/derive.js";
import { getSnapshot } from "../shared/store.js";

export function shouldBlockExit(state) {
  if (state?.data?.lock?.active) return true;
  const timer = timerView(state);
  return timer.mode === "focus" && (timer.running || timer.paused);
}

export function installExitGuard(target = window, readState = getSnapshot) {
  const onBeforeUnload = (event) => {
    if (!shouldBlockExit(readState())) return;
    event.preventDefault();
    // Electron 需要显式写 false 才会取消 BrowserWindow 的关闭。
    event.returnValue = false;
  };
  target.addEventListener("beforeunload", onBeforeUnload);
  return () => target.removeEventListener("beforeunload", onBeforeUnload);
}
