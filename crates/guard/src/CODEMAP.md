---
mode: maintenance
generated_at: 2026-11-07
---

# Native Guard

| File | Responsibility |
| --- | --- |
| main.rs | CLI、监听本机 HTTP、装配真实 State |
| guard.rs | 桌面选择、DSH 窗口发现、激活与白名单纯决策 |
| state.rs | 保护线程、niri DSH 全屏/回焦与窗口消失后的锁窗接管/重开恢复、其他桌面锁窗生命周期、沉浸全屏请求、运行中应用枚举 |
| protocol.rs | lock/unlock/focus/fullscreen/notify 协议与状态 DTO |
| notify.rs | 桌面系统通知（notify-rust），由 HTTP 的 notify 命令调用 |
| http.rs | Bearer 鉴权、HTTP 解析、命令路由与只读运行中应用端点 |
| token.rs | 用户数据目录与 token 文件 |
| wayland.rs | niri/Sway/Hyprland 窗口 IPC 与激活确认 |
| toplevel.rs | Wayland foreign-toplevel 显式全屏/退出，避免 niri toggle 请求反转状态 |
| wayland_surface.rs | Wayland 自建全屏锁窗（含 niri 应急接管），使用 ARGB8888 |
| shell.rs | GNOME/KWin 桌面窗口桥接 |
| x11.rs | X11 EWMH 窗口发现、激活与锁窗 |
| win32.rs | Windows 窗口发现、激活与锁窗 |
| macos.rs | macOS 窗口发现与激活 |
