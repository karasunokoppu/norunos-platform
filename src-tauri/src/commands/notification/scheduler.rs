use chrono::{Duration, Local};
use sqlx::SqlitePool;
use std::sync::Arc;
use tokio::time::{self, interval};

use super::send_notification;
use crate::commands::task::sql::task::load_all;

// Initialize the log table
pub async fn init_notification_log_table(pool: &SqlitePool) -> Result<(), sqlx::Error> {
    sqlx::query(
        "CREATE TABLE IF NOT EXISTS notification_log (
            task_id TEXT NOT NULL,
            notif_type TEXT NOT NULL,
            sent_at TEXT NOT NULL,
            PRIMARY KEY (task_id, notif_type)
        )",
    )
    .execute(pool)
    .await?;
    Ok(())
}

async fn is_notified(pool: &SqlitePool, task_id: &str, notif_type: &str) -> bool {
    let result = sqlx::query("SELECT 1 FROM notification_log WHERE task_id = ? AND notif_type = ?")
        .bind(task_id)
        .bind(notif_type)
        .fetch_optional(pool)
        .await
        .unwrap_or(None);
    result.is_some()
}

async fn log_notification(pool: &SqlitePool, task_id: &str, notif_type: &str) {
    let now = Local::now().to_rfc3339();
    let _ =
        sqlx::query("INSERT INTO notification_log (task_id, notif_type, sent_at) VALUES (?, ?, ?)")
            .bind(task_id)
            .bind(notif_type)
            .bind(now)
            .execute(pool)
            .await;
}

pub async fn run_scheduler(app: tauri::AppHandle, pool: SqlitePool) {
    let pool = Arc::new(pool);
    let mut interval = interval(time::Duration::from_secs(60)); // Check every minute
    loop {
        interval.tick().await;
        check_and_notify(&app, &pool).await;
    }
}

async fn check_and_notify(app: &tauri::AppHandle, pool: &SqlitePool) {
    let tasks = load_all(pool).await.unwrap_or_default();
    let now = Local::now();

    for task in tasks {
        if task.completed {
            continue;
        }

        let task_id = task.id.to_string();

        // 1. Start Time
        if let Some(start) = task.start_datetime {
            // Exact Start
            let diff = now.signed_duration_since(start);
            if diff.num_minutes() >= 0 && diff.num_hours() < 24 {
                let notif_type = "start_exact";
                if !is_notified(pool, &task_id, notif_type).await {
                    let _ = send_notification(
                        app.clone(),
                        format!("Task Start Reminder: {}", task.description),
                        "It's time to start your task.".to_string(),
                    );
                    log_notification(pool, &task_id, notif_type).await;
                }
            }

            // 1 Hour Before Start
            let one_hour_before = start - Duration::hours(1);
            let diff_pre = now.signed_duration_since(one_hour_before);
            if diff_pre.num_minutes() >= 0 && diff_pre.num_hours() < 24 {
                let notif_type = "start_1h_pre";
                if !is_notified(pool, &task_id, notif_type).await {
                    let remaining = start.signed_duration_since(now);
                    let minutes = remaining.num_minutes();
                    let message = format!("Task starts in {} minutes.", minutes);
                    let _ = send_notification(
                        app.clone(),
                        format!("Upcoming Task: {}", task.description),
                        message,
                    );
                    log_notification(pool, &task_id, notif_type).await;
                }
            }
        }

        // 2. End Time
        if let Some(end) = task.end_datetime {
            // Exact End
            let diff = now.signed_duration_since(end);
            if diff.num_minutes() >= 0 && diff.num_hours() < 24 {
                let notif_type = "end_exact";
                if !is_notified(pool, &task_id, notif_type).await {
                    let _ = send_notification(
                        app.clone(),
                        format!("Task Deadline Reminder: {}", task.description),
                        "The task deadline has been reached.".to_string(),
                    );
                    log_notification(pool, &task_id, notif_type).await;
                }
            }

            // 1 Hour Before End
            let one_hour_before = end - Duration::hours(1);
            let diff_pre = now.signed_duration_since(one_hour_before);
            if diff_pre.num_minutes() >= 0 && diff_pre.num_hours() < 24 {
                let notif_type = "end_1h_pre";
                if !is_notified(pool, &task_id, notif_type).await {
                    let remaining = end.signed_duration_since(now);
                    let minutes = remaining.num_minutes();
                    let message = format!("Task is due in {} minutes.", minutes);
                    let _ = send_notification(
                        app.clone(),
                        format!("Task Due Soon: {}", task.description),
                        message,
                    );
                    log_notification(pool, &task_id, notif_type).await;
                }
            }
        }
    }
}
