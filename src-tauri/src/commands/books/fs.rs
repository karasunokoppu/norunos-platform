use std::fs;
use std::path::PathBuf;
use tauri::AppHandle;
use tauri::Manager;

pub fn get_books_dir(app_handle: &AppHandle) -> PathBuf {
    let app_dir = app_handle
        .path()
        .app_data_dir()
        .expect("failed to get app data dir");
    let books_dir = app_dir.join("books");
    if !books_dir.exists() {
        fs::create_dir_all(&books_dir).expect("failed to create books dir");
    }
    books_dir
}

pub fn get_memos_dir(app_handle: &AppHandle) -> PathBuf {
    let books_dir = get_books_dir(app_handle);
    let memos_dir = books_dir.join("memos");
    if !memos_dir.exists() {
        fs::create_dir_all(&memos_dir).expect("failed to create memos dir");
    }
    memos_dir
}

pub fn save_memo_content(
    app_handle: &AppHandle,
    filename: &str,
    content: &str,
) -> Result<String, String> {
    let dir = get_memos_dir(app_handle);
    let path = dir.join(filename);
    fs::write(&path, content).map_err(|e| e.to_string())?;
    Ok(path.to_string_lossy().to_string())
}

pub fn read_memo_content(path_str: &str) -> Result<String, String> {
    let path = PathBuf::from(path_str);
    if !path.exists() {
        return Ok("".to_string());
    }
    fs::read_to_string(path).map_err(|e| e.to_string())
}

pub fn delete_file(path_str: &str) -> Result<(), String> {
    let path = PathBuf::from(path_str);
    if path.exists() {
        fs::remove_file(path).map_err(|e| e.to_string())?;
    }
    Ok(())
}
