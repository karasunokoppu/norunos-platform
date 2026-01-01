mod commands;

use crate::commands::task_commands::*;
use sqlx::sqlite::SqliteConnectOptions;
use sqlx::SqlitePool;
use tauri::Manager;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

struct AppState {
    pool: SqlitePool,
}

async fn setup_pool(app_handle: &tauri::AppHandle) -> SqlitePool {
    let app_data_dir = app_handle.path().app_data_dir();
    if app_data_dir.is_err() {
        panic!("Failed to get app data directory: {:?}", app_data_dir.err());
    }
    let db_path = app_data_dir.unwrap().join("norunos.db");
    println!("Database path: {}", db_path.display());
    if let Some(parent) = db_path.parent() {
        std::fs::create_dir_all(parent).expect("Failed to create database directory");
    }
    let options = SqliteConnectOptions::new()
        .filename(&db_path)
        .create_if_missing(true);
    SqlitePool::connect_with(options)
        .await
        .expect("Failed to connect to database")
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let rt = tokio::runtime::Runtime::new().unwrap();

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(move |app| {
            let pool = rt.block_on(setup_pool(&app.handle()));
            app.manage(AppState { pool });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            greet,
            init_database,
            create_task,
            get_tasks,
            update_task,
            delete_task,
            create_task_group,
            get_task_groups,
            create_subtask,
            get_subtasks_for_task
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
