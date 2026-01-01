use crate::AppState;
use serde::{Deserialize, Serialize};
use sqlx::{Row, SqlitePool};

#[derive(Debug, Serialize, Deserialize)]
pub struct CalendarMemo {
    pub date: String, // YYYY-MM-DD
    pub content: String,
}

pub async fn init_memo_table(pool: &SqlitePool) -> Result<(), sqlx::Error> {
    sqlx::query(
        "CREATE TABLE IF NOT EXISTS calendar_memos (
            date TEXT PRIMARY KEY,
            content TEXT NOT NULL
        )",
    )
    .execute(pool)
    .await?;
    Ok(())
}

#[tauri::command]
pub async fn get_memos(
    state: tauri::State<'_, AppState>,
    start_date: String,
    end_date: String,
) -> Result<Vec<CalendarMemo>, String> {
    init_memo_table(&state.pool)
        .await
        .map_err(|e| e.to_string())?;

    let rows = sqlx::query("SELECT * FROM calendar_memos WHERE date >= ? AND date <= ?")
        .bind(start_date)
        .bind(end_date)
        .fetch_all(&state.pool)
        .await
        .map_err(|e| e.to_string())?;

    let memos = rows
        .into_iter()
        .map(|row| CalendarMemo {
            date: row.get("date"),
            content: row.get("content"),
        })
        .collect();

    Ok(memos)
}

#[tauri::command]
pub async fn save_memo(
    state: tauri::State<'_, AppState>,
    date: String,
    content: String,
) -> Result<(), String> {
    init_memo_table(&state.pool)
        .await
        .map_err(|e| e.to_string())?;

    if content.trim().is_empty() {
        // Option: Delete if empty? Or just save empty string.
        // User might want to clear memo.
        // If empty, let's delete it to keep DB clean.
        return delete_memo(state, date).await;
    }

    sqlx::query("INSERT OR REPLACE INTO calendar_memos (date, content) VALUES (?, ?)")
        .bind(date)
        .bind(content)
        .execute(&state.pool)
        .await
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn delete_memo(state: tauri::State<'_, AppState>, date: String) -> Result<(), String> {
    init_memo_table(&state.pool)
        .await
        .map_err(|e| e.to_string())?;

    sqlx::query("DELETE FROM calendar_memos WHERE date = ?")
        .bind(date)
        .execute(&state.pool)
        .await
        .map_err(|e| e.to_string())?;

    Ok(())
}
