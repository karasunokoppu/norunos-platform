use chrono::{DateTime, Local};
use uuid::Uuid;

#[derive(PartialEq)]
pub struct Subtask {
    pub id: Uuid,
    pub order: i32,
    pub description: String,
    pub completed: bool,
    pub created_at: DateTime<Local>,
    pub updated_at: Option<DateTime<Local>>,
    pub deleted_at: Option<DateTime<Local>>,
}

impl Subtask {
    pub fn new() -> Self {
        Subtask {
            id: Uuid::new_v4(),
            order: 0,
            description: "".to_string(),
            completed: false,
            created_at: Local::now(),
            updated_at: None,
            deleted_at: None,
        }
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
    pub fn save(&self, task_id: Uuid) -> Result<(), rusqlite::Error> {
        let conn = rusqlite::Connection::open("norunos.db")?;
        conn.execute(
            "INSERT OR REPLACE INTO subtasks (id, order_index, description, completed, created_at, updated_at, deleted_at, task_id)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
            rusqlite::params![
                self.id.to_string(),
                self.order,
                self.description,
                self.completed as i32,
                self.created_at.to_rfc3339(),
                self.updated_at.unwrap().to_rfc3339(),
                self.deleted_at.unwrap().to_rfc3339(),
                task_id.to_string(),
            ],
        )?;
        Ok(())
    }

    pub fn load_for_task(task_id: Uuid) -> Result<Vec<Self>, rusqlite::Error> {
        let conn = rusqlite::Connection::open("norunos.db")?;
        let mut stmt = conn.prepare("SELECT id, order_index, description, completed, created_at, updated_at, deleted_at FROM subtasks WHERE task_id = ?1")?;
        let subtasks = stmt.query_map(rusqlite::params![task_id.to_string()], |row| {
            let id: String = row.get(0)?;
            let order: i32 = row.get(1)?;
            let description: String = row.get(2)?;
            let completed: i32 = row.get(3)?;
            let created_at: String = row.get(4)?;
            let updated_at: String = row.get(5)?;
            let deleted_at: String = row.get(6)?;

            Ok(Subtask {
                id: Uuid::parse_str(&id).unwrap(),
                order,
                description,
                completed: completed != 0,
                created_at: chrono::DateTime::parse_from_rfc3339(&created_at)
                    .unwrap()
                    .with_timezone(&Local),
                updated_at: Some(
                    chrono::DateTime::parse_from_rfc3339(&updated_at)
                        .unwrap()
                        .with_timezone(&Local),
                ),
                deleted_at: Some(
                    chrono::DateTime::parse_from_rfc3339(&deleted_at)
                        .unwrap()
                        .with_timezone(&Local),
                ),
            })
        })?;
        subtasks.collect()
    }

    pub fn init_table() -> Result<(), rusqlite::Error> {
        let conn = rusqlite::Connection::open("norunos.db")?;
        conn.execute(
            "CREATE TABLE IF NOT EXISTS subtasks (
                id TEXT PRIMARY KEY,
                order_index INTEGER NOT NULL,
                description TEXT NOT NULL,
                completed INTEGER NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                deleted_at TEXT NOT NULL,
                task_id TEXT NOT NULL,
                FOREIGN KEY (task_id) REFERENCES tasks (id)
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
    fn test_subtask_new() {
        let subtask = Subtask::new();
        assert_eq!(subtask.order, 0);
        assert_eq!(subtask.description, "");
        assert_eq!(subtask.completed, false);
        assert_ne!(subtask.id, Uuid::nil());
        // タイムスタンプが初期化されていることを確認
        assert!(subtask.created_at <= Local::now());
        // assert!(subtask.updated_at <= Local::now());
        // assert!(subtask.deleted_at <= Local::now());
    }

    #[test]
    fn test_subtask_save_and_load() {
        // Init tables
        use super::super::task::Task;
        Task::init_table().unwrap();
        Subtask::init_table().unwrap();

        let task = Task::new();
        task.save().unwrap();

        let mut subtask = Subtask::new();
        subtask.description = "Test Subtask".to_string();
        subtask.completed = true;
        subtask.order = 1;

        // Save
        subtask.save(task.id).unwrap();

        // Load for task
        let loaded_subtasks = Subtask::load_for_task(task.id).unwrap();
        assert!(loaded_subtasks.len() >= 1);
        let loaded = loaded_subtasks.iter().find(|s| s.id == subtask.id).unwrap();
        assert_eq!(loaded.description, "Test Subtask");
        assert_eq!(loaded.completed, true);
        assert_eq!(loaded.order, 1);
    }
}
