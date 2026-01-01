use crate::commands::books::db::{self, Book, ReadingMemo};
use crate::commands::books::fs;
use crate::AppState;
use chrono::Local;
use tauri::{AppHandle, State};

// Books Commands

#[tauri::command]
pub async fn get_books(state: State<'_, AppState>) -> Result<Vec<Book>, String> {
    sqlx::query_as::<_, Book>(
        "SELECT * FROM books WHERE deleted_at IS NULL ORDER BY updated_at DESC",
    )
    .fetch_all(&state.pool)
    .await
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn create_book(
    state: State<'_, AppState>,
    title: String,
    author: String,
    total_pages: i32,
    cover_image_path: Option<String>,
) -> Result<Book, String> {
    let mut book = Book::new(title, author, total_pages);
    book.cover_image_path = cover_image_path;

    sqlx::query(
        "INSERT INTO books (id, title, author, status, total_pages, cover_image_path, created_at, updated_at, deleted_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    )
    .bind(&book.id)
    .bind(&book.title)
    .bind(&book.author)
    .bind(&book.status)
    .bind(book.total_pages)
    .bind(&book.cover_image_path)
    .bind(&book.created_at)
    .bind(&book.updated_at)
    .bind(&book.deleted_at)
    .execute(&state.pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(book)
}

#[tauri::command]
pub async fn update_book(
    state: State<'_, AppState>,
    id: String,
    title: String,
    author: String,
    status: String,
    total_pages: i32,
    cover_image_path: Option<String>,
) -> Result<Book, String> {
    let updated_at = Local::now().to_rfc3339();

    // We fetch the book first to construct the return object easily or strict updated fields.
    // For simplicity, we just update and return the constructed object.

    sqlx::query(
        "UPDATE books SET title = ?, author = ?, status = ?, total_pages = ?, cover_image_path = ?, updated_at = ? WHERE id = ?",
    )
    .bind(&title)
    .bind(&author)
    .bind(&status)
    .bind(total_pages)
    .bind(&cover_image_path)
    .bind(&updated_at)
    .bind(&id)
    .execute(&state.pool)
    .await
    .map_err(|e| e.to_string())?;

    // Fetch updated book
    let book = sqlx::query_as::<_, Book>("SELECT * FROM books WHERE id = ?")
        .bind(&id)
        .fetch_one(&state.pool)
        .await
        .map_err(|e| e.to_string())?;

    Ok(book)
}

#[tauri::command]
pub async fn delete_book(state: State<'_, AppState>, id: String) -> Result<(), String> {
    let deleted_at = Local::now().to_rfc3339();
    sqlx::query("UPDATE books SET deleted_at = ? WHERE id = ?")
        .bind(deleted_at)
        .bind(id)
        .execute(&state.pool)
        .await
        .map_err(|e| e.to_string())?;
    Ok(())
}

// Reading Memos Commands

#[tauri::command]
pub async fn get_book_memos(
    state: State<'_, AppState>,
    book_id: String,
) -> Result<Vec<ReadingMemo>, String> {
    let memos = sqlx::query_as::<_, ReadingMemo>(
        "SELECT * FROM reading_memos WHERE book_id = ? AND deleted_at IS NULL ORDER BY created_at DESC",
    )
    .bind(book_id)
    .fetch_all(&state.pool)
    .await
    .map_err(|e| e.to_string())?;

    // Don't read content here to keep list loading fast?
    // Or do we want content?
    // Plan implied list. Let's populate content if needed, but `ReadingMemo` has `content_path`.
    // The previous plan said "content (Markdown file)".
    // If the frontend expects the content string, we should read it.
    // However, existing struct `ReadingMemo` has `content_path: String`.
    // We should probably return a DTO with content, or just let frontend fetch content separately?
    // User requirement: "reading_memosのメモ本体はmarkdownファイルで、メタ情報はSQLite"
    // Usually lists show snippets.
    // For now, let's keep it as is (returning path) and maybe add a `read_memo` command.

    Ok(memos)
}

#[tauri::command]
pub async fn create_book_memo(
    app_handle: AppHandle,
    state: State<'_, AppState>,
    book_id: String,
    page_number: i32,
    content: String,
) -> Result<ReadingMemo, String> {
    let id = uuid::Uuid::new_v4().to_string();
    let created_at = Local::now().to_rfc3339();
    let filename = format!("{}.md", id);

    // Save content to FS
    let content_path = fs::save_memo_content(&app_handle, &filename, &content)?;

    // Save metadata to DB
    sqlx::query(
        "INSERT INTO reading_memos (id, book_id, page_number, content_path, created_at, updated_at, deleted_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
    )
    .bind(&id)
    .bind(&book_id)
    .bind(page_number)
    .bind(&content_path)
    .bind(&created_at)
    .bind(Option::<String>::None)
    .bind(Option::<String>::None)
    .execute(&state.pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(ReadingMemo {
        id,
        book_id,
        page_number,
        content_path,
        created_at,
        updated_at: None,
        deleted_at: None,
    })
}

#[tauri::command]
pub async fn update_book_memo(
    app_handle: AppHandle,
    state: State<'_, AppState>,
    id: String,
    page_number: i32,
    content: String,
) -> Result<ReadingMemo, String> {
    // get existing memo to find path
    let memo = sqlx::query_as::<_, ReadingMemo>("SELECT * FROM reading_memos WHERE id = ?")
        .bind(&id)
        .fetch_one(&state.pool)
        .await
        .map_err(|e| e.to_string())?;

    // Update content
    let filename = std::path::Path::new(&memo.content_path)
        .file_name()
        .ok_or("Invalid path")?
        .to_str()
        .ok_or("Invalid path")?;

    fs::save_memo_content(&app_handle, filename, &content)?;

    let updated_at = Local::now().to_rfc3339();

    sqlx::query("UPDATE reading_memos SET page_number = ?, updated_at = ? WHERE id = ?")
        .bind(page_number)
        .bind(&updated_at)
        .bind(&id)
        .execute(&state.pool)
        .await
        .map_err(|e| e.to_string())?;

    let updated_memo = sqlx::query_as::<_, ReadingMemo>("SELECT * FROM reading_memos WHERE id = ?")
        .bind(&id)
        .fetch_one(&state.pool)
        .await
        .map_err(|e| e.to_string())?;

    Ok(updated_memo)
}

#[tauri::command]
pub async fn delete_book_memo(state: State<'_, AppState>, id: String) -> Result<(), String> {
    let deleted_at = Local::now().to_rfc3339();
    sqlx::query("UPDATE reading_memos SET deleted_at = ? WHERE id = ?")
        .bind(deleted_at)
        .bind(id)
        .execute(&state.pool)
        .await
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn read_book_memo_file(path: String) -> Result<String, String> {
    fs::read_memo_content(&path)
}

#[derive(serde::Serialize, sqlx::FromRow)]
pub struct ReadingActivity {
    pub date: String,
    pub book_title: String,
    pub start_page: i32,
    pub end_page: i32,
    pub memo_id: String,
}

#[tauri::command]
pub async fn get_reading_activities(
    state: State<'_, AppState>,
    start_date: String,
    end_date: String,
) -> Result<Vec<ReadingActivity>, String> {
    let sql = "
        WITH Activity AS (
            SELECT 
                strftime('%Y-%m-%d', rm.created_at) as date,
                b.title as book_title,
                LAG(rm.page_number, 1, 0) OVER (PARTITION BY rm.book_id ORDER BY rm.created_at) as start_page,
                rm.page_number as end_page,
                rm.id as memo_id
            FROM reading_memos rm
            JOIN books b ON rm.book_id = b.id
            WHERE rm.deleted_at IS NULL
        )
        SELECT * FROM Activity
        WHERE date >= ? AND date <= ?
        ORDER BY date ASC
    ";

    sqlx::query_as::<_, ReadingActivity>(sql)
        .bind(start_date)
        .bind(end_date)
        .fetch_all(&state.pool)
        .await
        .map_err(|e| e.to_string())
}
