use chrono::Local;
use serde::{Deserialize, Serialize};
use sqlx::SqlitePool;
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct MindMap {
    pub id: String,
    pub title: String,
    pub content: String, // JSON blob
    pub created_at: String,
    pub updated_at: Option<String>,
    pub deleted_at: Option<String>,
}

impl MindMap {
    pub fn new(title: String, content: String) -> Self {
        Self {
            id: Uuid::new_v4().to_string(),
            title,
            content,
            created_at: Local::now().to_rfc3339(),
            updated_at: None,
            deleted_at: None,
        }
    }
}

pub async fn init_mind_map_table(pool: &SqlitePool) -> Result<(), sqlx::Error> {
    sqlx::query(
        "CREATE TABLE IF NOT EXISTS mind_maps (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT,
            deleted_at TEXT
        )",
    )
    .execute(pool)
    .await?;

    Ok(())
}
