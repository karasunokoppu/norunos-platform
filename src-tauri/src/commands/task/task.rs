use chrono::{DateTime, Local};
use serde::{Serialize, Deserialize};
use serde_json;
use uuid::Uuid;
use sqlx::{SqlitePool, query, Row};

#[derive(Serialize, Deserialize, Clone)]
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
    pub async fn save(&mut self, pool: &SqlitePool) -> Result<(), sqlx::Error> {
        self.update_updated_at();
        let subtasks_json = serde_json::to_string(&self.subtasks).unwrap_or_default();
        let start_dt = self.start_datetime.map(|dt| dt.to_rfc3339());
        let end_dt = self.end_datetime.map(|dt| dt.to_rfc3339());
        let updated_at = self.updated_at.map(|dt| dt.to_rfc3339());
        let deleted_at = self.deleted_at.map(|dt| dt.to_rfc3339());

        sqlx::query(
            "INSERT OR REPLACE INTO tasks (id, completed, description, details, subtasks, start_datetime, end_datetime, progress, created_at, updated_at, deleted_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
        )
        .bind(self.id.to_string())
        .bind(self.completed)
        .bind(&self.description)
        .bind(&self.details)
        .bind(&subtasks_json)
        .bind(&start_dt)
        .bind(&end_dt)
        .bind(self.progress)
        .bind(self.created_at.to_rfc3339())
        .bind(&updated_at)
        .bind(&deleted_at)
        .execute(pool)
        .await?;
        Ok(())
    }

    pub async fn load_all(pool: &SqlitePool) -> Result<Vec<Self>, sqlx::Error> {
        let rows = sqlx::query("SELECT * FROM tasks WHERE deleted_at IS NULL")
            .fetch_all(pool)
            .await?;

        let mut tasks = Vec::new();
        for row in rows {
            let id: String = row.try_get("id")?;
            let id = Uuid::parse_str(&id).unwrap_or(Uuid::new_v4());
            let completed: bool = row.try_get("completed")?;
            let description: String = row.try_get("description")?;
            let details: Option<String> = row.try_get("details")?;
            let subtasks_json: String = row.try_get("subtasks")?;
            let subtasks: Vec<Uuid> = serde_json::from_str(&subtasks_json).unwrap_or_default();
            let start_datetime: Option<String> = row.try_get("start_datetime")?;
            let start_datetime = start_datetime.and_then(|s| DateTime::parse_from_rfc3339(&s).ok()).map(|dt| dt.with_timezone(&Local));
            let end_datetime: Option<String> = row.try_get("end_datetime")?;
            let end_datetime = end_datetime.and_then(|s| DateTime::parse_from_rfc3339(&s).ok()).map(|dt| dt.with_timezone(&Local));
            let progress: u32 = row.try_get("progress")?;
            let created_at_str: String = row.try_get("created_at")?;
            let created_at = DateTime::parse_from_rfc3339(&created_at_str).unwrap_or_else(|_| Local::now().into()).with_timezone(&Local);
            let updated_at: Option<String> = row.try_get("updated_at")?;
            let updated_at = updated_at.and_then(|s| DateTime::parse_from_rfc3339(&s).ok()).map(|dt| dt.with_timezone(&Local));
            let deleted_at: Option<String> = row.try_get("deleted_at")?;
            let deleted_at = deleted_at.and_then(|s| DateTime::parse_from_rfc3339(&s).ok()).map(|dt| dt.with_timezone(&Local));

            tasks.push(Task {
                id,
                completed,
                description,
                details,
                subtasks,
                start_datetime,
                end_datetime,
                progress,
                created_at,
                updated_at,
                deleted_at,
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
                subtasks TEXT NOT NULL,
                start_datetime TEXT,
                end_datetime TEXT,
                progress INTEGER NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT,
                deleted_at TEXT
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
        assert_eq!(task.progress, 0);
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