use crate::commands::books::db::{Book, ReadingMemo, ReadingSession};
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
    // current_page is already initialized to 0 in Book::new

    sqlx::query(
        "INSERT INTO books (id, title, author, status, total_pages, current_page, cover_image_path, created_at, updated_at, deleted_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    )
    .bind(&book.id)
    .bind(&book.title)
    .bind(&book.author)
    .bind(&book.status)
    .bind(book.total_pages)
    .bind(book.current_page)
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
    current_page: i32,
    cover_image_path: Option<String>,
) -> Result<Book, String> {
    let updated_at = Local::now().to_rfc3339();

    sqlx::query(
        "UPDATE books SET title = ?, author = ?, status = ?, total_pages = ?, current_page = ?, cover_image_path = ?, updated_at = ? WHERE id = ?",
    )
    .bind(&title)
    .bind(&author)
    .bind(&status)
    .bind(total_pages)
    .bind(current_page)
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
    pub pages_read: i32,
    pub session_id: String,
}

#[tauri::command]
pub async fn get_reading_activities(
    state: State<'_, AppState>,
    start_date: String,
    end_date: String,
) -> Result<Vec<ReadingActivity>, String> {
    // reading_sessionsテーブルから読書活動を取得
    let sql = "
        SELECT 
            rs.session_date as date,
            b.title as book_title,
            rs.start_page,
            rs.end_page,
            rs.pages_read,
            rs.id as session_id
        FROM reading_sessions rs
        JOIN books b ON rs.book_id = b.id
        WHERE rs.session_date >= ? AND rs.session_date <= ?
        ORDER BY rs.session_date ASC, rs.created_at ASC
    ";

    sqlx::query_as::<_, ReadingActivity>(sql)
        .bind(start_date)
        .bind(end_date)
        .fetch_all(&state.pool)
        .await
        .map_err(|e| e.to_string())
}

// Reading Sessions Commands（読書セッション進捗履歴）

/// 特定の本の読書セッション一覧を取得
#[tauri::command]
pub async fn get_reading_sessions(
    state: State<'_, AppState>,
    book_id: String,
) -> Result<Vec<ReadingSession>, String> {
    sqlx::query_as::<_, ReadingSession>(
        "SELECT * FROM reading_sessions WHERE book_id = ? ORDER BY session_date DESC, created_at DESC",
    )
    .bind(book_id)
    .fetch_all(&state.pool)
    .await
    .map_err(|e| e.to_string())
}

/// 新規読書セッションを作成し、本のcurrent_pageを自動更新
#[tauri::command]
pub async fn create_reading_session(
    state: State<'_, AppState>,
    book_id: String,
    session_date: String,
    start_page: i32,
    end_page: i32,
    note: Option<String>,
) -> Result<ReadingSession, String> {
    let id = uuid::Uuid::new_v4().to_string();
    let created_at = Local::now().to_rfc3339();
    let pages_read = end_page - start_page;

    // セッションを挿入
    sqlx::query(
        "INSERT INTO reading_sessions (id, book_id, session_date, start_page, end_page, pages_read, note, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    )
    .bind(&id)
    .bind(&book_id)
    .bind(&session_date)
    .bind(start_page)
    .bind(end_page)
    .bind(pages_read)
    .bind(&note)
    .bind(&created_at)
    .execute(&state.pool)
    .await
    .map_err(|e| e.to_string())?;

    // 本のcurrent_pageを更新
    let updated_at = Local::now().to_rfc3339();
    sqlx::query("UPDATE books SET current_page = ?, updated_at = ? WHERE id = ?")
        .bind(end_page)
        .bind(&updated_at)
        .bind(&book_id)
        .execute(&state.pool)
        .await
        .map_err(|e| e.to_string())?;

    Ok(ReadingSession {
        id,
        book_id,
        session_date,
        start_page,
        end_page,
        pages_read,
        note,
        created_at,
    })
}

/// 読書セッションを削除
#[tauri::command]
pub async fn delete_reading_session(state: State<'_, AppState>, id: String) -> Result<(), String> {
    sqlx::query("DELETE FROM reading_sessions WHERE id = ?")
        .bind(id)
        .execute(&state.pool)
        .await
        .map_err(|e| e.to_string())?;
    Ok(())
}
