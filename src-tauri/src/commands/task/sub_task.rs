<<<<<<< HEAD
use chrono::{DateTime, Local};
use serde::{Deserialize, Serialize};
use sqlx::{Row, SqlitePool};
=======
use serde::{Serialize, Deserialize};
use sqlx::{SqlitePool, Row};
>>>>>>> 050c4bf92ad55825b52c8128619d1e1e296e04d2
use uuid::Uuid;

#[derive(Serialize, Deserialize, Clone)]
pub struct Subtask {
    pub id: String,
    pub description: String,
    pub completed: bool,
}

impl Subtask {
    #[allow(dead_code)]
    pub fn new() -> Self {
        Subtask {
            id: Uuid::new_v4().to_string(),
            description: "".to_string(),
            completed: false,
        }
    }

<<<<<<< HEAD
    // メタ情報更新
    #[allow(dead_code)]
    pub fn set_created_at(&mut self) {
        self.created_at = Local::now();
    }

    pub fn update_updated_at(&mut self) {
        self.updated_at = Some(Local::now());
    }

    #[allow(dead_code)]
    pub fn set_deleted(&mut self) {
        self.deleted_at = Some(Local::now());
    }

    // データベース操作
    pub async fn save(&mut self, pool: &SqlitePool) -> Result<(), sqlx::Error> {
        self.update_updated_at();
        let updated_at = self.updated_at.map(|dt| dt.to_rfc3339());
        let deleted_at = self.deleted_at.map(|dt| dt.to_rfc3339());

        sqlx::query(
            "INSERT OR REPLACE INTO subtasks (id, order_num, description, completed, created_at, updated_at, deleted_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)"
        )
        .bind(self.id.to_string())
        .bind(self.order)
=======
    // データベース操作
    pub async fn save(&mut self, task_id: String, pool: &SqlitePool) -> Result<(), sqlx::Error> {
        sqlx::query(
            "INSERT OR REPLACE INTO subtasks (id, task_id, description, completed) VALUES (?, ?, ?, ?)"
        )
        .bind(&self.id)
        .bind(&task_id)
>>>>>>> 050c4bf92ad55825b52c8128619d1e1e296e04d2
        .bind(&self.description)
        .bind(self.completed)
        .execute(pool)
        .await?;
        Ok(())
    }

    // 指定したタスクIDに関連するサブタスクを取得
<<<<<<< HEAD
    pub async fn load_for_task(task_id: Uuid, pool: &SqlitePool) -> Result<Vec<Self>, sqlx::Error> {
        let rows = sqlx::query(
            "SELECT s.* FROM subtasks s
             INNER JOIN rela_task_subtask r ON s.id = r.subtask_id
             WHERE r.task_id = ? AND s.deleted_at IS NULL
             ORDER BY s.order_num",
        )
        .bind(task_id.to_string())
        .fetch_all(pool)
        .await?;
=======
    pub async fn load_for_task(task_id: String, pool: &SqlitePool) -> Result<Vec<Self>, sqlx::Error> {
        let rows = sqlx::query("SELECT * FROM subtasks WHERE task_id = ?")
            .bind(&task_id)
            .fetch_all(pool)
            .await?;
>>>>>>> 050c4bf92ad55825b52c8128619d1e1e296e04d2

        let mut subtasks = Vec::new();
        for row in rows {
            let id: String = row.try_get("id")?;
            let description: String = row.try_get("description")?;
            let completed: bool = row.try_get("completed")?;
<<<<<<< HEAD
            let created_at_str: String = row.try_get("created_at")?;
            let created_at = DateTime::parse_from_rfc3339(&created_at_str)
                .unwrap_or_else(|_| Local::now().into())
                .with_timezone(&Local);
            let updated_at: Option<String> = row.try_get("updated_at")?;
            let updated_at = updated_at
                .and_then(|s| DateTime::parse_from_rfc3339(&s).ok())
                .map(|dt| dt.with_timezone(&Local));
            let deleted_at: Option<String> = row.try_get("deleted_at")?;
            let deleted_at = deleted_at
                .and_then(|s| DateTime::parse_from_rfc3339(&s).ok())
                .map(|dt| dt.with_timezone(&Local));
=======
>>>>>>> 050c4bf92ad55825b52c8128619d1e1e296e04d2

            subtasks.push(Subtask {
                id,
                description,
                completed,
            });
        }
        Ok(subtasks)
    }

    pub async fn init_table(pool: &SqlitePool) -> Result<(), sqlx::Error> {
        sqlx::query(
            "CREATE TABLE IF NOT EXISTS subtasks (
                id TEXT PRIMARY KEY,
<<<<<<< HEAD
                order_num INTEGER NOT NULL,
                description TEXT NOT NULL,
                completed BOOLEAN NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT,
                deleted_at TEXT
            )",
=======
                task_id TEXT NOT NULL,
                description TEXT NOT NULL,
                completed BOOLEAN NOT NULL
            )"
>>>>>>> 050c4bf92ad55825b52c8128619d1e1e296e04d2
        )
        .execute(pool)
        .await?;
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use sqlx::sqlite::SqlitePoolOptions;

    async fn setup_test_db() -> SqlitePool {
        let pool = SqlitePoolOptions::new()
            .connect("sqlite::memory:")
            .await
            .expect("Failed to connect to test database");

        Subtask::init_table(&pool)
            .await
            .expect("Failed to init table");
        pool
    }

    #[tokio::test]
    async fn test_subtask_new() {
        let subtask = Subtask::new();
        assert_eq!(subtask.description, "");
        assert!(!subtask.completed);
    }

    #[tokio::test]
    async fn test_subtask_save_and_load() {
        let pool = setup_test_db().await;
        let task_id = Uuid::new_v4();
        let mut subtask = Subtask::new();
        subtask.description = "Test subtask".to_string();
        subtask.completed = true;

        subtask.save(&pool).await.expect("Failed to save subtask");
        // We need to manually save the relation in test since we updated save() to not do it
        // But load_for_task relies on it.
        // For unit test of Subtask solely, we might need to mock relation or test simply load/save without relation?
        // Actually load_for_task NOW depends on rela_task_subtask table.
        // So we must init that table too and insert relation.

        // This test will fail if we don't init rela_task_subtask.
        // Since I can't easily import task_subtask here (it is in another module),
        // I will comment out this test or update it to be comprehensive if I could.
        // For now, let's update the test to be correct conceptually, assuming we could execute SQL directly.

        sqlx::query("CREATE TABLE IF NOT EXISTS rela_task_subtask (task_id TEXT, subtask_id TEXT)")
            .execute(&pool)
            .await
            .unwrap();
        sqlx::query("INSERT INTO rela_task_subtask VALUES (?, ?)")
            .bind(task_id.to_string())
            .bind(subtask.id.to_string())
            .execute(&pool)
            .await
            .unwrap();

        let subtasks = Subtask::load_for_task(task_id, &pool)
            .await
            .expect("Failed to load subtasks");

        assert_eq!(subtasks.len(), 1);
        assert_eq!(subtasks[0].description, "Test subtask");
        assert!(subtasks[0].completed);
    }
}
