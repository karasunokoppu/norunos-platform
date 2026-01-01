use chrono::{DateTime, Local};
use serde::{Deserialize, Serialize};
use serde_json;
use sqlx::{query, Row, SqlitePool};
use uuid::Uuid;

use crate::commands::task::sql::task_subtask;
use crate::commands::task::sub_task::Subtask;
use crate::commands::task::task::Task;

pub async fn init_task_table(pool: &SqlitePool) -> Result<(), sqlx::Error> {
    sqlx::query(
        "CREATE TABLE IF NOT EXISTS tasks (
            id TEXT PRIMARY KEY,
            description TEXT NOT NULL,
            details TEXT,
            completed BOOLEAN NOT NULL,
            start_date TEXT,
            end_date TEXT,
            progress INTEGER NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT,
            deleted_at TEXT
        )",
    )
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn save_task(pool: &SqlitePool, task: &mut Task) -> Result<(), sqlx::Error> {
    init_task_table(pool).await?;
    task_subtask::init_rela_task_subtask_table(pool).await?;

    task.update_updated_at();
    let start_dt = task.start_datetime.map(|dt| dt.to_rfc3339());
    let end_dt = task.end_datetime.map(|dt| dt.to_rfc3339());
    let updated_at = task.updated_at.map(|dt| dt.to_rfc3339());
    let deleted_at = task.deleted_at.map(|dt| dt.to_rfc3339());

    sqlx::query("
            INSERT OR REPLACE INTO tasks (id, completed, description, details, start_date, end_date, progress, created_at, updated_at, deleted_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
        )
        .bind(task.id.to_string())
        .bind(task.completed)
        .bind(&task.description)
        .bind(&task.details)
        .bind(&start_dt)
        .bind(&end_dt)
        .bind(task.progress)
        .bind(task.created_at.to_rfc3339())
        .bind(&updated_at)
        .bind(&deleted_at)
        .execute(pool)
        .await?;

    // Check if subtasks initialization is needed (e.g. Subtask::init_table where needed, or assume initialized by other means)
    // Be safe and call init
    crate::commands::task::sub_task::Subtask::init_table(pool).await?;

    for subtask in &mut task.subtasks {
        subtask.save(pool).await?;
        task_subtask::save_rela_task_subtask(pool, task.id.to_string(), subtask.id.to_string())
            .await?;
    }

    Ok(())
}

pub async fn load_all(pool: &SqlitePool) -> Result<Vec<Task>, sqlx::Error> {
    init_task_table(pool).await?;
    let rows = sqlx::query("SELECT * FROM tasks WHERE deleted_at IS NULL")
        .fetch_all(pool)
        .await?;

    let mut tasks = Vec::new();
    for row in rows {
        let id: String = row.try_get("id")?;
        let id = Uuid::parse_str(&id).unwrap_or(Uuid::new_v4());
        let completed: bool = row.try_get("completed")?;
        let description: String = row.try_get("description")?;
        let details: Option<String> = row.try_get("details")?;
        let start_datetime: Option<String> = row.try_get("start_date")?; // Changed from start_datetime to start_date
        let start_datetime = start_datetime
            .and_then(|s| DateTime::parse_from_rfc3339(&s).ok())
            .map(|dt| dt.with_timezone(&Local));
        let end_datetime: Option<String> = row.try_get("end_date")?; // Changed from end_datetime to end_date
        let end_datetime = end_datetime
            .and_then(|s| DateTime::parse_from_rfc3339(&s).ok())
            .map(|dt| dt.with_timezone(&Local));
        let progress: u32 = row.try_get("progress")?;
        let created_at_str: String = row.try_get("created_at")?;
        let created_at = DateTime::parse_from_rfc3339(&created_at_str)
            .unwrap_or_else(|_| Local::now().into())
            .with_timezone(&Local);
        let updated_at: Option<String> = row.try_get("updated_at")?;
        let updated_at = updated_at
            .and_then(|s| DateTime::parse_from_rfc3339(&s).ok())
            .map(|dt| dt.with_timezone(&Local));
        let deleted_at: Option<String> = row.try_get("deleted_at")?;
        let deleted_at = deleted_at
            .and_then(|s| DateTime::parse_from_rfc3339(&s).ok())
            .map(|dt| dt.with_timezone(&Local));

        tasks.push(Task {
            id,
            completed,
            description,
            details,
            start_datetime,
            end_datetime,
            progress,
            created_at,
            updated_at,
            deleted_at,
            subtasks: Subtask::load_for_task(id, pool).await.unwrap_or_default(),
        });
    }
    Ok(tasks)
}
