use chrono::Local;
use serde::{Deserialize, Serialize};
use sqlx::{FromRow, SqlitePool};
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Book {
    pub id: String,
    pub title: String,
    pub author: String,
    pub status: String,
    pub total_pages: i32,
    pub cover_image_path: Option<String>,
    pub created_at: String,
    pub updated_at: Option<String>,
    pub deleted_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct ReadingMemo {
    pub id: String,
    pub book_id: String,
    pub page_number: i32,
    pub content_path: String,
    pub created_at: String,
    pub updated_at: Option<String>,
    pub deleted_at: Option<String>,
}

impl Book {
    pub fn new(title: String, author: String, total_pages: i32) -> Self {
        Self {
            id: Uuid::new_v4().to_string(),
            title,
            author,
            status: "To Read".to_string(),
            total_pages,
            cover_image_path: None,
            created_at: Local::now().to_rfc3339(),
            updated_at: None,
            deleted_at: None,
        }
    }
}

pub async fn init_books_table(pool: &SqlitePool) -> Result<(), sqlx::Error> {
    sqlx::query(
        "CREATE TABLE IF NOT EXISTS books (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            author TEXT NOT NULL,
            status TEXT NOT NULL,
            total_pages INTEGER NOT NULL,
            cover_image_path TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT,
            deleted_at TEXT
        )",
    )
    .execute(pool)
    .await?;

    sqlx::query(
        "CREATE TABLE IF NOT EXISTS reading_memos (
            id TEXT PRIMARY KEY,
            book_id TEXT NOT NULL,
            page_number INTEGER NOT NULL,
            content_path TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT,
            deleted_at TEXT,
            FOREIGN KEY(book_id) REFERENCES books(id)
        )",
    )
    .execute(pool)
    .await?;

    Ok(())
}
