// shell.overlay 宿主：HUD、沉浸层、toast 都挂在同一帧上（order 900，位于
// DSH 自带浮层之下、普通内容之上）。overlay 层本身 click-through，各组件
// 自己开启 pointer-events。
import { h, Fragment, useEffect } from "../runtime.js";
import { useLocale } from "../shared/copy.js";
import { ToastHost } from "../shared/ui.js";
import { restore } from "./navigation.js";
import { Hud } from "./hud.js";
import { Immersive } from "./immersive.js";

// 每次 overlay 挂载时按会话记录恢复；DSH 重载插件会卸载并重挂这个 slot。
// restore 本身幂等：用户已切回对话时不会再次拉开番茄面板。
// 放在 effect 里而不是 apply 里，避免静态渲染改变输出。

function useStartupNavigation() {
  useEffect(() => {
    restore();
  }, []);
}

export function AppOverlay({ openPanel }) {
  useLocale();
  useStartupNavigation();
  return h(
    Fragment,
    null,
    h(Hud, { openPanel }),
    h(Immersive, null),
    h(ToastHost, null),
  );
}
