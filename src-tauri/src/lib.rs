mod commands;

use crate::commands::task::sql::task_commands::*;
use crate::commands::task::sql::task_group_commands::*;
use sqlx::sqlite::SqliteConnectOptions;
use sqlx::SqlitePool;
use tauri::Manager;

struct AppState {
    pool: SqlitePool,
}

async fn setup_pool(
    app_handle: &tauri::AppHandle,
) -> Result<SqlitePool, Box<dyn std::error::Error>> {
    let app_data_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data directory: {:?}", e))?;
    let db_path = app_data_dir.join("norunos.db");
    println!("Database path: {}", db_path.display());
    if let Some(parent) = db_path.parent() {
        std::fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create database directory: {:?}", e))?;
    }
    let options = SqliteConnectOptions::new()
        .filename(&db_path)
        .create_if_missing(true);
    let pool = SqlitePool::connect_with(options)
        .await
        .map_err(|e| format!("Failed to connect to database: {:?}", e))?;
    Ok(pool)
}

pub async fn init_db(pool: &SqlitePool) -> Result<(), Box<dyn std::error::Error>> {
    commands::books::db::init_books_table(pool)
        .await
        .map_err(|e| format!("Failed to init books table: {:?}", e))?;

    commands::mindmap::db::init_mind_map_table(pool)
        .await
        .map_err(|e| format!("Failed to init mind_maps table: {:?}", e))?;
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_notification::init())
        .setup(move |app| {
            let pool = tauri::async_runtime::block_on(setup_pool(&app.handle()))
                .map_err(|e| format!("Database setup failed: {}", e))?;
            tauri::async_runtime::block_on(init_db(&pool))
                .map_err(|e| format!("Database init failed: {}", e))?;
            tauri::async_runtime::block_on(
                commands::notification::scheduler::init_notification_log_table(&pool),
            )
            .map_err(|e| format!("Notification log init failed: {:?}", e))?;
            tauri::async_runtime::spawn(commands::notification::scheduler::run_scheduler(
                app.handle().clone(),
                pool.clone(),
            ));

            app.manage(AppState { pool });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            create_task,
            get_tasks,
            update_task,
            delete_task,
            get_task_groups,
            create_task_group,
            update_task_group,
            delete_task_group,
            move_task_to_group,
            commands::calendar::memo::get_memos,
            commands::calendar::memo::save_memo,
            commands::calendar::memo::delete_memo,
            commands::notes::fs::get_notes_tree,
            commands::notes::fs::read_note,
            commands::notes::fs::save_note,
            commands::notes::fs::create_note,
            commands::notes::fs::create_folder,
            commands::notes::fs::delete_item,
            commands::notes::fs::rename_item,
            commands::notes::fs::get_backlinks,
            commands::notes::fs::get_graph_data,
            commands::books::commands::get_books,
            commands::books::commands::create_book,
            commands::books::commands::update_book,
            commands::books::commands::delete_book,
            commands::books::commands::get_book_memos,
            commands::books::commands::create_book_memo,
            commands::books::commands::update_book_memo,
            commands::books::commands::delete_book_memo,
            commands::books::commands::read_book_memo_file,
            commands::books::commands::get_reading_activities,
            commands::books::commands::get_reading_sessions,
            commands::books::commands::create_reading_session,
            commands::books::commands::delete_reading_session,
            commands::mindmap::commands::get_mind_maps,
            commands::mindmap::commands::create_mind_map,
            commands::mindmap::commands::update_mind_map,
            commands::mindmap::commands::delete_mind_map,
            commands::notification::send_notification,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
