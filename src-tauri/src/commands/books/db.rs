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
    pub current_page: i32,
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

/// 読書セッション（進捗履歴）
#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct ReadingSession {
    pub id: String,
    pub book_id: String,
    pub session_date: String, // 読書日 (YYYY-MM-DD)
    pub start_page: i32,      // 開始ページ
    pub end_page: i32,        // 終了ページ
    pub pages_read: i32,      // 読んだページ数
    pub note: Option<String>, // メモ（任意）
    pub created_at: String,
}

impl Book {
    pub fn new(title: String, author: String, total_pages: i32) -> Self {
        Self {
            id: Uuid::new_v4().to_string(),
            title,
            author,
            status: "To Read".to_string(),
            total_pages,
            current_page: 0,
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
            current_page INTEGER DEFAULT 0,
            cover_image_path TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT,
            deleted_at TEXT
        )",
    )
    .execute(pool)
    .await?;

    // Migration: Add current_page column if it doesn't exist
    // We ignore excess errors here for simplicity (e.g. if column exists)
    let _ = sqlx::query("ALTER TABLE books ADD COLUMN current_page INTEGER DEFAULT 0")
        .execute(pool)
        .await;

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

    // reading_sessions テーブルの作成（読書セッション進捗履歴用）
    sqlx::query(
        "CREATE TABLE IF NOT EXISTS reading_sessions (
            id TEXT PRIMARY KEY,
            book_id TEXT NOT NULL,
            session_date TEXT NOT NULL,
            start_page INTEGER NOT NULL,
            end_page INTEGER NOT NULL,
            pages_read INTEGER NOT NULL,
            note TEXT,
            created_at TEXT NOT NULL,
            FOREIGN KEY(book_id) REFERENCES books(id)
        )",
    )
    .execute(pool)
    .await?;

    Ok(())
}
