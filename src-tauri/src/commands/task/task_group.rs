use chrono::{DateTime, Local};
use serde::{Serialize, Deserialize};
use serde_json;
use uuid::Uuid;
use sqlx::{SqlitePool, query, Row};

#[derive(Serialize, Deserialize, Clone)]
pub struct TaskGroup {
    pub id: String,
    pub name: String,
    pub tasks: Vec<String>,
    pub created_at: DateTime<Local>,
    pub updated_at: Option<DateTime<Local>>,
    pub deleted_at: Option<DateTime<Local>>,
}

impl TaskGroup {
    pub fn new() -> Self {
        TaskGroup {
            id: Uuid::new_v4().to_string(),
            name: "".to_string(),
            tasks: Vec::new(),
            created_at: Local::now(),
            updated_at: None,
            deleted_at: None,
        }
    }

    pub fn add_task(&mut self, task_id: String) {
        self.tasks.push(task_id);
    }

    pub fn remove_task(&mut self, task_id: String) {
        self.tasks.retain(|id| id != &task_id);
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
        let tasks_json = serde_json::to_string(&self.tasks).unwrap_or_default();
        let updated_at = self.updated_at.map(|dt| dt.to_rfc3339());
        let deleted_at = self.deleted_at.map(|dt| dt.to_rfc3339());

        sqlx::query(
            "INSERT OR REPLACE INTO task_groups (id, name, tasks, created_at, updated_at, deleted_at)
             VALUES (?, ?, ?, ?, ?, ?)"
        )
        .bind(self.id.to_string())
        .bind(&self.name)
        .bind(&tasks_json)
        .bind(self.created_at.to_rfc3339())
        .bind(&updated_at)
        .bind(&deleted_at)
        .execute(pool)
        .await?;
        Ok(())
    }

    pub async fn load_all(pool: &SqlitePool) -> Result<Vec<Self>, sqlx::Error> {
        let rows = sqlx::query("SELECT * FROM task_groups WHERE deleted_at IS NULL")
            .fetch_all(pool)
            .await?;

        let mut task_groups = Vec::new();
        for row in rows {
            let id: String = row.try_get("id")?;
            let id = Uuid::parse_str(&id).unwrap_or(Uuid::new_v4());
            let name: String = row.try_get("name")?;
            let tasks_json: String = row.try_get("tasks")?;
            let tasks: Vec<Uuid> = serde_json::from_str(&tasks_json).unwrap_or_default();
            let created_at_str: String = row.try_get("created_at")?;
            let created_at = DateTime::parse_from_rfc3339(&created_at_str).unwrap_or_else(|_| Local::now().into()).with_timezone(&Local);
            let updated_at: Option<String> = row.try_get("updated_at")?;
            let updated_at = updated_at.and_then(|s| DateTime::parse_from_rfc3339(&s).ok()).map(|dt| dt.with_timezone(&Local));
            let deleted_at: Option<String> = row.try_get("deleted_at")?;
            let deleted_at = deleted_at.and_then(|s| DateTime::parse_from_rfc3339(&s).ok()).map(|dt| dt.with_timezone(&Local));

            task_groups.push(TaskGroup {
                id,
                name,
                tasks,
                created_at,
                updated_at,
                deleted_at,
            });
        }
        Ok(task_groups)
    }

    pub async fn init_table(pool: &SqlitePool) -> Result<(), sqlx::Error> {
        sqlx::query(
            "CREATE TABLE IF NOT EXISTS task_groups (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                tasks TEXT NOT NULL,
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
        
        TaskGroup::init_table(&pool).await.expect("Failed to init table");
        pool
    }

    #[tokio::test]
    async fn test_task_group_new() {
        let task_group = TaskGroup::new();
        assert_eq!(task_group.name, "");
        assert!(task_group.tasks.is_empty());
    }

    #[tokio::test]
    async fn test_task_group_save_and_load() {
        let pool = setup_test_db().await;
        let mut task_group = TaskGroup::new();
        task_group.name = "Test Group".to_string();

        task_group.save(&pool).await.expect("Failed to save task group");
        let task_groups = TaskGroup::load_all(&pool).await.expect("Failed to load task groups");

        assert_eq!(task_groups.len(), 1);
        assert_eq!(task_groups[0].name, "Test Group");
    }
}