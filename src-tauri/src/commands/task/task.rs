use chrono::{DateTime, Local};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::commands::task::sub_task::Subtask;

#[derive(Serialize, Deserialize, Clone)]
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
    pub updated_at: Option<DateTime<Local>>,
    pub deleted_at: Option<DateTime<Local>>,
    #[serde(default)]
    pub dependencies: Vec<String>,
}

impl Task {
    pub fn new() -> Self {
        Task {
            id: Uuid::new_v4(),
            completed: false,
            description: "No description.".to_string(),
            details: None,
            subtasks: Vec::new(),
            start_datetime: None,
            end_datetime: None,
            progress: 0,
            created_at: Local::now(),
            updated_at: None,
            deleted_at: None,
            dependencies: Vec::new(),
        }
    }

    // pub fn add_subtask(&mut self, subtask_id: Uuid) {
    //     self.subtasks.push(subtask_id);
    // }

    // pub fn remove_subtask(&mut self, subtask_id: Uuid) {
    //     self.subtasks.retain(|&id| id != subtask_id);
    // }

    // メタ情報更新
    #[allow(dead_code)]
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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_task_new() {
        let task = Task::new();
        assert!(!task.completed);
        assert_eq!(task.description, "No description.");
        assert!(task.details.is_none());
        assert!(task.subtasks.is_empty());
        assert!(task.start_datetime.is_none());
        assert!(task.end_datetime.is_none());
        assert_eq!(task.progress, 0);
        assert!(task.updated_at.is_none());
        assert!(task.deleted_at.is_none());
        assert!(task.dependencies.is_empty());
    }

    #[test]
    fn test_task_set_deleted() {
        let mut task = Task::new();
        assert!(task.deleted_at.is_none());

        task.set_deleted();

        assert!(task.deleted_at.is_some());
    }

    #[test]
    fn test_task_update_updated_at() {
        let mut task = Task::new();
        assert!(task.updated_at.is_none());

        task.update_updated_at();

        assert!(task.updated_at.is_some());
    }

    #[test]
    fn test_task_set_created_at() {
        let mut task = Task::new();
        let original_created_at = task.created_at;

        // Sleep briefly to ensure time difference
        std::thread::sleep(std::time::Duration::from_millis(10));
        task.set_created_at();

        // created_at should be updated to a new time
        assert!(task.created_at >= original_created_at);
    }
}
