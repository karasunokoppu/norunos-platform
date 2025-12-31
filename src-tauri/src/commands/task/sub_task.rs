use serde::{Serialize, Deserialize};
use sqlx::{SqlitePool, Row};
use uuid::Uuid;

#[derive(Serialize, Deserialize, Clone)]
pub struct Subtask {
    pub id: String,
    pub description: String,
    pub completed: bool,
}

impl Subtask {
    pub fn new() -> Self {
        Subtask {
            id: Uuid::new_v4().to_string(),
            description: "".to_string(),
            completed: false,
        }
    }

    // データベース操作
    pub async fn save(&mut self, task_id: String, pool: &SqlitePool) -> Result<(), sqlx::Error> {
        sqlx::query(
            "INSERT OR REPLACE INTO subtasks (id, task_id, description, completed) VALUES (?, ?, ?, ?)"
        )
        .bind(&self.id)
        .bind(&task_id)
        .bind(&self.description)
        .bind(self.completed)
        .execute(pool)
        .await?;
        Ok(())
    }

    // 指定したタスクIDに関連するサブタスクを取得
    pub async fn load_for_task(task_id: String, pool: &SqlitePool) -> Result<Vec<Self>, sqlx::Error> {
        let rows = sqlx::query("SELECT * FROM subtasks WHERE task_id = ?")
            .bind(&task_id)
            .fetch_all(pool)
            .await?;

        let mut subtasks = Vec::new();
        for row in rows {
            let id: String = row.try_get("id")?;
            let description: String = row.try_get("description")?;
            let completed: bool = row.try_get("completed")?;

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
                task_id TEXT NOT NULL,
                description TEXT NOT NULL,
                completed BOOLEAN NOT NULL
            )"
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
        
        Subtask::init_table(&pool).await.expect("Failed to init table");
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

        subtask.save(task_id, &pool).await.expect("Failed to save subtask");
        let subtasks = Subtask::load_for_task(task_id, &pool).await.expect("Failed to load subtasks");

        assert_eq!(subtasks.len(), 1);
        assert_eq!(subtasks[0].description, "Test subtask");
        assert!(subtasks[0].completed);
    }
}