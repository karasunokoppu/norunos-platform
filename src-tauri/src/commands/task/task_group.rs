use chrono::{DateTime, Local};
use serde::{Deserialize, Serialize};
use serde_json;
use sqlx::{query, Row, SqlitePool};
use uuid::Uuid;

#[derive(Serialize, Deserialize, Clone)]
pub struct TaskGroup {
    pub id: Uuid,
    pub name: String,
    pub tasks: Vec<Uuid>,
    pub created_at: DateTime<Local>,
    pub updated_at: Option<DateTime<Local>>,
    pub deleted_at: Option<DateTime<Local>>,
}

impl TaskGroup {
    pub fn new() -> Self {
        TaskGroup {
            id: Uuid::new_v4(),
            name: "".to_string(),
            tasks: Vec::new(),
            created_at: Local::now(),
            updated_at: None,
            deleted_at: None,
        }
    }

    pub fn add_task(&mut self, task_id: Uuid) {
        self.tasks.push(task_id);
    }

    pub fn remove_task(&mut self, task_id: Uuid) {
        self.tasks.retain(|&id| id != task_id);
    }

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
