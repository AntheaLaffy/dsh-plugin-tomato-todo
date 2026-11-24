use crate::{id, Action, AppData, AppResult, Mode};
use serde::{Deserialize, Serialize};
use std::collections::HashSet;

#[derive(Clone, Copy, Debug, Eq, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum Status {
    Note,
    Later,
    Done,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct Note {
    pub id: String,
    pub text: String,
    pub created_at: i64,
    pub status: Status,
}

impl Note {
    pub(crate) fn new(text: String, at: i64) -> AppResult<Self> {
        let text = text.trim();
        if text.is_empty() {
            return Err("先写下想记的内容".into());
        }
        Ok(Self {
            id: id(),
            text: text.into(),
            created_at: at,
            status: Status::Note,
        })
    }
}

impl Action {
    pub(crate) fn allowed_during_btw_protection(&self, data: &AppData) -> bool {
        match self {
            Self::AddBtwNote { .. } => data.lock.active.is_none() && data.timer.mode == Mode::Focus,
            Self::SetBtwStatus { .. } => data.lock.active.is_some(),
            _ => false,
        }
    }
}

pub(crate) fn validate(notes: &[Note]) -> AppResult<()> {
    let mut ids = HashSet::new();
    for note in notes {
        if note.id.trim().is_empty()
            || !ids.insert(&note.id)
            || note.text.trim().is_empty()
            || chrono::DateTime::from_timestamp(note.created_at, 0).is_none()
        {
            return Err("BTW 笔记的内容、时间或 ID 无效".into());
        }
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{Engine, GuardMode, Settings};

    #[test]
    fn capture_and_night_review_preserve_notes_focus_and_lock() {
        let mut engine = Engine::open(":memory:").unwrap();
        let at = 1_800_000_000;
        let mut settings = Settings::default();
        settings.protection.mode = GuardMode::Lock;
        settings.protection.strict = true;
        engine
            .dispatch(Action::SaveSettings { settings }, at)
            .unwrap();
        let focus = engine.dispatch(Action::StartTimer, at).unwrap();
        let add = |text: &str| Action::AddBtwNote { text: text.into() };
        engine.dispatch(add("只是一个想法"), at + 1).unwrap();
        let s = engine.dispatch(add("晚点查书"), at + 2).unwrap();
        assert_eq!(s.data.timer.deadline, focus.data.timer.deadline);
        let id = s.data.btw_notes[1].id.clone();
        let change = |status| Action::SetBtwStatus {
            id: id.clone(),
            status,
        };
        assert!(engine.dispatch(change(Status::Later), at + 3).is_err());
        let evening = at + 86400;
        engine
            .dispatch(
                Action::StartQuickLock {
                    minutes: 30,
                    strict: true,
                },
                evening,
            )
            .unwrap();
        for status in [Status::Later, Status::Done, Status::Later] {
            let s = engine.dispatch(change(status), evening + 1).unwrap();
            assert!(s.data.strict_protected());
            assert_eq!(s.data.btw_notes[0].status, Status::Note);
            assert_eq!(s.data.btw_notes[1].status, status);
        }
        assert!(engine.dispatch(add("锁机中"), evening + 2).is_err());
        let backup: AppData = serde_json::from_str(&engine.export(evening + 2).unwrap()).unwrap();
        let mut restored = Engine::open(":memory:").unwrap();
        let data = restored
            .dispatch(
                Action::Import {
                    data: Box::new(backup),
                },
                evening + 3,
            )
            .unwrap()
            .data;
        assert_eq!(data.btw_notes[1].status, Status::Later);
        assert_eq!(data.btw_notes[0].created_at, at + 1);
        let mut old = serde_json::to_value(data).unwrap();
        old.as_object_mut().unwrap().remove("btwNotes");
        assert!(serde_json::from_value::<AppData>(old)
            .unwrap()
            .btw_notes
            .is_empty());
    }
}
