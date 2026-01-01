use chrono::{DateTime, Local};
use serde::{Deserialize, Serialize};
use serde_json;
use sqlx::{Row, SqlitePool};
use uuid::Uuid;

#[derive(Serialize, Deserialize, Clone)]
pub struct Task {
    pub id: Uuid,
    pub completed: bool,
    pub description: String,
    pub details: Option<String>,
    // pub subtasks: Vec<Uuid>,
    //ガントチャート
    pub start_datetime: Option<DateTime<Local>>,
    pub end_datetime: Option<DateTime<Local>>,
    pub progress: u32, //進捗率
    //メタ情報
    pub created_at: DateTime<Local>,
    pub updated_at: Option<DateTime<Local>>,
    pub deleted_at: Option<DateTime<Local>>,
}

impl Task {
    pub fn new() -> Self {
        Task {
            id: Uuid::new_v4(),
            completed: false,
            description: "No description.".to_string(),
            details: None,
            // subtasks: Vec::new(),
            start_datetime: None,
            end_datetime: None,
            progress: 0,
            created_at: Local::now(),
            updated_at: None,
            deleted_at: None,
        }
    }

    // pub fn add_subtask(&mut self, subtask_id: Uuid) {
    //     self.subtasks.push(subtask_id);
    // }

    // pub fn remove_subtask(&mut self, subtask_id: Uuid) {
    //     self.subtasks.retain(|&id| id != subtask_id);
    // }

    // メタ情報更新
    pub fn set_created_at(&mut self) {
        self.created_at = Local::now();
    }

    pub fn update_updated_at(&mut self) {
        self.updated_at = Some(Local::now());
    }

    pub fn set_deleted(&mut self) {
        self.deleted_at = Some(Local::now());
    }
}
