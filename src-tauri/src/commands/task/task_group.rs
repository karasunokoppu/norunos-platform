use chrono::{DateTime, Local};
use serde_json;
use uuid::Uuid;

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

    // データベース操作
    pub fn save(&mut self) -> Result<(), rusqlite::Error> {
        if self.updated_at.is_none() {
            self.updated_at = Some(Local::now());
        }
        let conn = rusqlite::Connection::open("norunos.db")?;
        let tasks_json = serde_json::to_string(&self.tasks).unwrap();
        conn.execute(
            "INSERT OR REPLACE INTO task_groups (id, name, tasks, created_at, updated_at, deleted_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            rusqlite::params![
                self.id.to_string(),
                self.name,
                tasks_json,
                self.created_at.to_rfc3339(),
                self.updated_at.map(|dt| dt.to_rfc3339()),
                self.deleted_at.map(|dt| dt.to_rfc3339()),
            ],
        )?;
        Ok(())
    }

    pub fn load_all() -> Result<Vec<Self>, rusqlite::Error> {
        let conn = rusqlite::Connection::open("norunos.db")?;
        let mut stmt = conn.prepare(
            "SELECT id, name, tasks, created_at, updated_at, deleted_at FROM task_groups",
        )?;
        let task_groups = stmt.query_map([], |row| {
            let id: String = row.get(0)?;
            let name: String = row.get(1)?;
            let tasks_json: String = row.get(2)?;
            let created_at: String = row.get(3)?;
            let updated_at: Option<String> = row.get(4)?;
            let deleted_at: Option<String> = row.get(5)?;

            let tasks: Vec<Uuid> = serde_json::from_str(&tasks_json).unwrap_or_default();

            Ok(TaskGroup {
                id: Uuid::parse_str(&id).unwrap(),
                name,
                tasks,
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
        task_groups.collect()
    }

    pub fn init_table() -> Result<(), rusqlite::Error> {
        let conn = rusqlite::Connection::open("norunos.db")?;
        conn.execute(
            "CREATE TABLE IF NOT EXISTS task_groups (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                tasks TEXT NOT NULL,
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
    fn test_task_group_new() {
        let task_group = TaskGroup::new();
        assert_eq!(task_group.name, "");
        assert!(task_group.tasks.is_empty());
        assert_ne!(task_group.id, Uuid::nil());
        // タイムスタンプが初期化されていることを確認
        assert!(task_group.created_at <= Local::now());
        assert!(task_group.updated_at.is_none());
        assert!(task_group.deleted_at.is_none());
    }

    #[test]
    fn test_task_group_save_and_load() {
        // Remove existing db
        std::fs::remove_file("norunos.db").ok();

        // Init table
        TaskGroup::init_table().unwrap();

        let mut task_group = TaskGroup::new();
        task_group.name = "Test Group".to_string();
        task_group.tasks = vec![Uuid::new_v4(), Uuid::new_v4()];

        // Save
        task_group.save().unwrap();

        // Load all
        let loaded_groups = TaskGroup::load_all().unwrap();
        assert!(loaded_groups.len() >= 1);
        let loaded = loaded_groups
            .iter()
            .find(|g| g.id == task_group.id)
            .unwrap();
        assert_eq!(loaded.name, "Test Group");
        assert_eq!(loaded.tasks.len(), 2);
    }
}
