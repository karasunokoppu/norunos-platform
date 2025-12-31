use uuid::Uuid;
use serde::{Serialize, Deserialize};
use sqlx::{Row, SqlitePool};
use crate::commands::task::sub_task::Subtask;

#[derive(Serialize, Deserialize, Clone)]
pub struct Task {
    pub id: String,
    pub completed: bool,
    pub description: String,
    pub details: Option<String>,
    pub subtasks: Vec<Subtask>,
    pub start_date: Option<String>,
    pub end_date: Option<String>,
}

impl Task {
    pub fn new() -> Self {
        Task {
            id: Uuid::new_v4().to_string(),
            completed: false,
            description: "No description.".to_string(),
            details: None,
            subtasks: Vec::new(),
            start_date: None,
            end_date: None,
        }
    }

    pub fn add_subtask(&mut self, subtask: Subtask) {
        self.subtasks.push(subtask);
    }

    pub fn remove_subtask(&mut self, subtask_id: String) {
        self.subtasks.retain(|s| s.id != subtask_id);
    }

    // データベース操作
    pub async fn save(&mut self, pool: &SqlitePool) -> Result<(), sqlx::Error> {
        Task::init_table(pool).await?;
        Subtask::init_table(pool).await?;

        sqlx::query(
            "INSERT OR REPLACE INTO tasks (id, completed, description, details, start_date, end_date)
             VALUES (?, ?, ?, ?, ?, ?)"
        )
        .bind(&self.id)
        .bind(self.completed)
        .bind(&self.description)
        .bind(&self.details)
        .bind(&self.start_date)
        .bind(&self.end_date)
        .execute(pool)
        .await?;

        // Save subtasks
        for subtask in &mut self.subtasks {
            subtask.save(self.id.clone(), pool).await?;
        }

        Ok(())
    }

    pub async fn load_all(pool: &SqlitePool) -> Result<Vec<Self>, sqlx::Error> {
        Task::init_table(pool).await?;
        Subtask::init_table(pool).await?;

        let rows = sqlx::query("SELECT * FROM tasks")
            .fetch_all(pool)
            .await?;

        let mut tasks = Vec::new();
        for row in rows {
            let id: String = row.try_get("id")?;
            let completed: bool = row.try_get("completed")?;
            let description: String = row.try_get("description")?;
            let details: Option<String> = row.try_get("details")?;
            let start_date: Option<String> = row.try_get("start_date")?;
            let end_date: Option<String> = row.try_get("end_date")?;

            let subtasks = Subtask::load_for_task(id.clone(), pool).await?;

            tasks.push(Task {
                id,
                completed,
                description,
                details,
                subtasks,
                start_date,
                end_date,
            });
        }
        Ok(tasks)
    }

    pub async fn init_table(pool: &SqlitePool) -> Result<(), sqlx::Error> {
        sqlx::query(
            "CREATE TABLE IF NOT EXISTS tasks (
                id TEXT PRIMARY KEY,
                completed BOOLEAN NOT NULL,
                description TEXT NOT NULL,
                details TEXT,
                start_date TEXT,
                end_date TEXT
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

        Task::init_table(&pool).await.expect("Failed to init table");
        pool
    }

    #[tokio::test]
    async fn test_task_new() {
        let task = Task::new();
        assert!(!task.completed);
        assert_eq!(task.description, "No description.");
        assert!(task.subtasks.is_empty());
    }

    #[tokio::test]
    async fn test_task_save_and_load() {
        let pool = setup_test_db().await;
        let mut task = Task::new();
        task.description = "Test task".to_string();
        task.completed = true;

        task.save(&pool).await.expect("Failed to save task");
        let tasks = Task::load_all(&pool).await.expect("Failed to load tasks");

        assert_eq!(tasks.len(), 1);
        assert_eq!(tasks[0].description, "Test task");
        assert!(tasks[0].completed);
    }
}
