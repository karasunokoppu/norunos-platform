mod commands;

use crate::commands::task::sql::task_commands::*;
use crate::commands::task::sql::task_group_commands::*;
use sqlx::sqlite::SqliteConnectOptions;
use sqlx::SqlitePool;
use tauri::Manager;

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

pub async fn init_db(pool: &SqlitePool) {
    commands::books::db::init_books_table(pool)
        .await
        .expect("Failed to init books table");

    commands::mindmap::db::init_mind_map_table(pool)
        .await
        .expect("Failed to init mind_maps table");
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_notification::init())
        .setup(move |app| {
            let pool = tauri::async_runtime::block_on(setup_pool(&app.handle()));
            tauri::async_runtime::block_on(init_db(&pool));
            tauri::async_runtime::block_on(
                commands::notification::scheduler::init_notification_log_table(&pool),
            )
            .expect("Failed to init notification log");
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
            commands::mindmap::commands::get_mind_maps,
            commands::mindmap::commands::create_mind_map,
            commands::mindmap::commands::update_mind_map,
            commands::mindmap::commands::delete_mind_map,
            commands::notification::send_notification,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
