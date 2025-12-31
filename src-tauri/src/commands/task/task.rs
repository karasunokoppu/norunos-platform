use chrono::{DateTime, Local};
use serde_json;
use uuid::Uuid;

pub struct Task {
    pub id: Uuid,
    pub completed: bool,
    pub description: String,
    pub details: Option<String>,
    pub subtasks: Vec<Uuid>,
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
            subtasks: Vec::new(),
            start_datetime: None,
            end_datetime: None,
            progress: 0,
            created_at: Local::now(),
            updated_at: None,
            deleted_at: None,
        }
    }

    pub fn add_subtask(&mut self, subtask_id: Uuid) {
        self.subtasks.push(subtask_id);
    }

    pub fn remove_subtask(&mut self, subtask_id: Uuid) {
        self.subtasks.retain(|&id| id != subtask_id);
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

    // データベース操作
    pub fn save(&mut self) -> Result<(), rusqlite::Error> {
        if self.updated_at.is_none() {
            self.updated_at = Some(Local::now());
        }
        let conn = rusqlite::Connection::open("norunos.db")?;
        let subtasks_json = serde_json::to_string(&self.subtasks).unwrap();
        let start_dt = self.start_datetime.map(|dt| dt.to_rfc3339());
        let end_dt = self.end_datetime.map(|dt| dt.to_rfc3339());
        conn.execute(//データベースにデータがあれば置き換え、なければ新規作成fd
            "INSERT OR REPLACE INTO tasks (id, completed, description, details, subtasks, start_datetime, end_datetime, progress, created_at, updated_at, deleted_at)
            VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)",
            rusqlite::params![
                self.id.to_string(),
                self.completed as i32,
                self.description,
                self.details,
                subtasks_json,
                start_dt,
                end_dt,
                self.progress as i32,
                self.created_at.to_rfc3339(),
                self.updated_at.map(|dt| dt.to_rfc3339()),
                self.deleted_at.map(|dt| dt.to_rfc3339()),
            ],
        )?;
        Ok(())
    }

    pub fn load_all() -> Result<Vec<Self>, rusqlite::Error> {
        let conn = rusqlite::Connection::open("norunos.db")?;
        let mut stmt = conn.prepare("SELECT id, completed, description, details, subtasks, start_datetime, end_datetime, progress, created_at, updated_at, deleted_at FROM tasks")?;
        let tasks = stmt.query_map([], |row| {
            let id: String = row.get(0)?;
            let completed: i32 = row.get(1)?;
            let description: String = row.get(2)?;
            let details: Option<String> = row.get(3)?;
            let subtasks_json: String = row.get(4)?;
            let start_datetime: Option<String> = row.get(5)?;
            let end_datetime: Option<String> = row.get(6)?;
            let progress: i32 = row.get(7)?;
            let created_at: String = row.get(8)?;
            let updated_at: Option<String> = row.get(9)?;
            let deleted_at: Option<String> = row.get(10)?;

            let subtasks: Vec<Uuid> = serde_json::from_str(&subtasks_json).unwrap_or_default();
            let start_dt = start_datetime.map(|s| {
                chrono::DateTime::parse_from_rfc3339(&s)
                    .unwrap()
                    .with_timezone(&Local)
            });
            let end_dt = end_datetime.map(|s| {
                chrono::DateTime::parse_from_rfc3339(&s)
                    .unwrap()
                    .with_timezone(&Local)
            });

            Ok(Task {
                id: Uuid::parse_str(&id).unwrap(),
                completed: completed != 0,
                description,
                details,
                subtasks,
                start_datetime: start_dt,
                end_datetime: end_dt,
                progress: progress as u32,
                created_at: chrono::DateTime::parse_from_rfc3339(&created_at)
                    .unwrap()
                    .with_timezone(&Local),
                updated_at: updated_at.map(|s| {
                    chrono::DateTime::parse_from_rfc3339(&s)
                        .unwrap()
                        .with_timezone(&Local)
                }),
                deleted_at: deleted_at.map(|s| {
                    chrono::DateTime::parse_from_rfc3339(&s)
                        .unwrap()
                        .with_timezone(&Local)
                }),
            })
        })?;
        tasks.collect()
    }

    pub fn init_table() -> Result<(), rusqlite::Error> {
        let conn = rusqlite::Connection::open("norunos.db")?;
        conn.execute(
            "CREATE TABLE IF NOT EXISTS tasks (
                id TEXT PRIMARY KEY,
                completed INTEGER NOT NULL,
                description TEXT NOT NULL,
                details TEXT,
                subtasks TEXT NOT NULL,
                start_datetime TEXT,
                end_datetime TEXT,
                progress INTEGER NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                deleted_at TEXT
            )",
            [],
        )?;
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_task_new() {
        let task = Task::new();
        assert_eq!(task.completed, false);
        assert_eq!(task.description, "No description.");
        assert_eq!(task.details, None);
        assert!(task.subtasks.is_empty());
        assert_eq!(task.progress, 0);
        assert_ne!(task.id, Uuid::nil());
        // タイムスタンプが初期化されていることを確認
        assert!(task.created_at <= Local::now());
        assert!(task.updated_at.is_none());
        assert!(task.deleted_at.is_none());
    }

    #[test]
    fn test_task_save_and_load() {
        // Init table
        Task::init_table().unwrap();

        let mut task = Task::new();
        task.description = "Test Task".to_string();
        task.completed = true;
        task.progress = 50;
        task.subtasks = vec![Uuid::new_v4()];

        // Save
        task.save().unwrap();

        // Load all
        let loaded_tasks = Task::load_all().unwrap();
        assert!(loaded_tasks.len() >= 1);
        let loaded = loaded_tasks.iter().find(|t| t.id == task.id).unwrap();
        assert_eq!(loaded.description, "Test Task");
        assert_eq!(loaded.completed, true);
        assert_eq!(loaded.progress, 50);
        assert_eq!(loaded.subtasks.len(), 1);
    }
}
