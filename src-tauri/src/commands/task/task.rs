use crate::commands::task::sub_task::Subtask;
use chrono::{DateTime, Local};
use uuid::Uuid;

pub struct Task {
    pub id: Uuid,
    pub completed: bool,
    pub description: String,
    pub details: Option<String>,
    pub subtasks: Vec<Subtask>,
    //ガントチャート
    pub start_datetime: Option<DateTime<Local>>,
    pub end_datetime: Option<DateTime<Local>>,
    pub progress: u32, //進捗率
    //メタ情報
    pub created_at: DateTime<Local>,
    pub updated_at: DateTime<Local>,
    pub deleted_at: DateTime<Local>,
}

impl Task {
    pub fn default() -> Self {
        Task {
            id: Uuid::new_v4(),
            completed: false,
            description: "No description.".to_string(),
            details: None,
            subtasks: Vec::new(),
            start_datetime: None,
            end_datetime: None,
            progress: 0,
            created_at: DateTime::default(),
            updated_at: DateTime::default(),
            deleted_at: DateTime::default(),
        }
    }
}
