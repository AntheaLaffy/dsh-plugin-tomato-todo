//! Layer surfaces stay out of the compositor's window list. Unmapping the editor
//! returns keyboard focus to the original application, including in whitelist mode.
use crate::Shared;
use gtk::{
    gdk,
    glib::{self, translate::ToGlibPtr},
    prelude::*,
};
use std::{cell::RefCell, io::Write, path::PathBuf, process::Command};
use tauri::{AppHandle, Manager};
use tomato_core::{now, Action, AppResult, Mode};

#[link(name = "gtk-layer-shell")]
extern "C" {
    fn gtk_layer_is_supported() -> i32;
    fn gtk_layer_init_for_window(w: *mut gtk::ffi::GtkWindow);
    fn gtk_layer_set_namespace(w: *mut gtk::ffi::GtkWindow, name: *const std::ffi::c_char);
    fn gtk_layer_set_layer(w: *mut gtk::ffi::GtkWindow, layer: i32);
    fn gtk_layer_set_anchor(w: *mut gtk::ffi::GtkWindow, edge: i32, anchor: i32);
    fn gtk_layer_set_keyboard_mode(w: *mut gtk::ffi::GtkWindow, mode: i32);
}

fn surface(name: &std::ffi::CStr, pen: bool) -> gtk::Window {
    let w = gtk::Window::new(gtk::WindowType::Toplevel);
    // GTK is owned by the Tauri main thread. Configure layer-shell before realization.
    unsafe {
        let ptr = w.to_glib_none().0;
        gtk_layer_init_for_window(ptr);
        gtk_layer_set_namespace(ptr, name.as_ptr());
        gtk_layer_set_layer(ptr, 3); // overlay
        gtk_layer_set_anchor(ptr, 1, pen.into()); // right edge, otherwise centered
        gtk_layer_set_keyboard_mode(ptr, if pen { 0 } else { 1 });
    }
    w.set_decorated(false);
    w.set_resizable(false);
    w
}

thread_local! { static OVERLAY: RefCell<Option<Overlay>> = const { RefCell::new(None) }; }
struct Overlay {
    pen: gtk::Window,
    editor: gtk::Window,
    text: gtk::TextView,
    focus_running: bool,
    capture_allowed: bool,
}

pub fn setup(app: &AppHandle) -> bool {
    if std::env::var_os("NIRI_SOCKET").is_none() || unsafe { gtk_layer_is_supported() } == 0 {
        return false;
    }
    let pen = surface(c"tomato-btw-pen", true);
    let pencil = gtk::Button::from_icon_name(Some("document-edit-symbolic"), gtk::IconSize::Button);
    pencil.set_tooltip_text(Some("记个 BTW"));
    pen.add(&pencil);
    pencil.connect_clicked(|_| {
        open();
    });

    let editor = surface(c"tomato-btw-editor", false);
    let content = gtk::Box::new(gtk::Orientation::Vertical, 8);
    content.set_border_width(16);
    editor.add(&content);
    let title = gtk::Label::new(Some("记个 BTW"));
    title.set_xalign(0.0);
    content.add(&title);
    let scroll = gtk::ScrolledWindow::new(None::<&gtk::Adjustment>, None::<&gtk::Adjustment>);
    scroll.set_size_request(360, 76);
    content.add(&scroll);
    let text = gtk::TextView::new();
    text.set_wrap_mode(gtk::WrapMode::WordChar);
    scroll.add(&text);
    let row = gtk::Box::new(gtk::Orientation::Horizontal, 8);
    content.add(&row);
    let hint = gtk::Label::new(Some("Enter 保存 · Shift+Enter 换行"));
    row.pack_start(&hint, false, false, 0);
    let save = gtk::Button::with_label("保存");
    let cancel = gtk::Button::with_label("收起");
    row.pack_end(&save, false, false, 0);
    row.pack_end(&cancel, false, false, 0);
    cancel.connect_clicked(|_| close());
    let buffer = text.buffer().expect("GTK text buffer");
    let handle = app.clone();
    save.connect_clicked(move |_| {
        let body = buffer
            .text(&buffer.start_iter(), &buffer.end_iter(), false)
            .unwrap_or_default();
        let engine = handle.state::<Shared>();
        let result = engine
            .lock()
            .map_err(|e| e.to_string())
            .and_then(|mut engine| {
                engine.dispatch(Action::AddBtwNote { text: body.into() }, now())
            });
        match result {
            Ok(_) => {
                buffer.set_text("");
                hint.set_text("Enter 保存 · Shift+Enter 换行");
                close();
            }
            Err(error) => hint.set_text(&error),
        }
    });
    text.connect_key_press_event(move |view, event| {
        let key = event.keyval();
        if key == gdk::keys::constants::Escape
            || ((key == gdk::keys::constants::Return || key == gdk::keys::constants::KP_Enter)
                && !event.state().contains(gdk::ModifierType::SHIFT_MASK))
        {
            if !view.im_context_filter_keypress(event) {
                if key == gdk::keys::constants::Escape {
                    close();
                } else {
                    save.emit_clicked();
                }
            }
            return glib::Propagation::Stop;
        }
        glib::Propagation::Proceed
    });
    OVERLAY.with(|slot| {
        *slot.borrow_mut() = Some(Overlay {
            pen,
            editor,
            text,
            focus_running: false,
            capture_allowed: true,
        })
    });
    true
}

pub fn open() -> bool {
    OVERLAY.with(|slot| {
        let binding = slot.borrow();
        let Some(o) = binding.as_ref() else {
            return false;
        };
        if o.capture_allowed {
            o.pen.hide();
            o.editor.show_all();
            o.text.grab_focus();
        }
        true
    })
}

fn close() {
    OVERLAY.with(|slot| {
        if let Some(o) = slot.borrow().as_ref() {
            o.editor.hide();
            if o.focus_running {
                o.pen.show_all();
            }
        }
    });
}

pub fn sync(running: bool, allowed: bool) {
    OVERLAY.with(|slot| {
        if let Some(o) = slot.borrow_mut().as_mut() {
            o.focus_running = running;
            o.capture_allowed = allowed;
            if !allowed {
                o.editor.hide();
            }
            if running && !o.editor.is_visible() {
                o.pen.show_all();
            } else {
                o.pen.hide();
            }
        }
    });
}

pub fn visibility(data: &tomato_core::AppData) -> (bool, bool) {
    let allowed = data.lock.active.is_none() && !data.break_protected();
    (
        allowed && data.timer.running && data.timer.mode == Mode::Focus,
        allowed,
    )
}

pub fn enable_shortcut() -> AppResult<()> {
    if std::env::var_os("NIRI_SOCKET").is_none() {
        return Err("当前桌面不是 niri".into());
    }
    let config = match std::env::var_os("NIRI_CONFIG") {
        Some(path) => PathBuf::from(path),
        None => glib::user_config_dir().join("niri/config.kdl"),
    }
    .canonicalize()
    .map_err(|e| format!("无法读取 niri 配置：{e}"))?;
    let original = std::fs::read_to_string(&config).map_err(|e| e.to_string())?;
    let exe = std::env::current_exe().map_err(|e| e.to_string())?;
    let command = serde_json::to_string(exe.to_str().ok_or("程序路径不是 UTF-8")?)
        .map_err(|e| e.to_string())?;
    let binding = format!("binds {{\n    Ctrl+Alt+B hotkey-overlay-title=\"BTW 随手记\" {{ spawn {command} \"--btw\"; }}\n}}");
    if original.contains(&binding) {
        return Ok(());
    }
    let mut candidate =
        tempfile::NamedTempFile::new_in(config.parent().unwrap()).map_err(|e| e.to_string())?;
    writeln!(candidate, "{original}\n{binding}").map_err(|e| e.to_string())?;
    let check = Command::new("niri")
        .args(["validate", "-c"])
        .arg(candidate.path())
        .output()
        .map_err(|e| e.to_string())?;
    if !check.status.success() {
        return Err(format!(
            "快捷键冲突或配置无效：{}",
            String::from_utf8_lossy(&check.stderr)
        ));
    }
    candidate
        .as_file()
        .set_permissions(
            std::fs::metadata(&config)
                .map_err(|e| e.to_string())?
                .permissions(),
        )
        .map_err(|e| e.to_string())?;
    if std::fs::read_to_string(&config).map_err(|e| e.to_string())? != original {
        return Err("配置已变化，请重试".into());
    }
    candidate.persist(config).map_err(|e| e.to_string())?;
    Ok(())
}
