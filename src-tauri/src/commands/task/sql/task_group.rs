use chrono::{DateTime, Local};
use serde::{Deserialize, Serialize};
use serde_json;
use sqlx::{query, Row, SqlitePool};
use uuid::Uuid;

use crate::commands::task::{
    sql::task_task_group::get_task_id_from_task_group_id, task_group::TaskGroup,
};

pub async fn init_task_group_table(pool: &SqlitePool) -> Result<(), sqlx::Error> {
    sqlx::query(
        "CREATE TABLE IF NOT EXISTS task_groups (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT,
            deleted_at TEXT
        )",
    )
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn save_task_group(
    pool: &SqlitePool,
    task_group: &mut TaskGroup,
) -> Result<(), sqlx::Error> {
    init_task_group_table(pool).await?;
    task_group.update_updated_at();
    let updated_at = task_group.updated_at.map(|dt| dt.to_rfc3339());
    let deleted_at = task_group.deleted_at.map(|dt| dt.to_rfc3339());

    sqlx::query(
        "
        INSERT OR REPLACE INTO task_groups (id, name, created_at, updated_at, deleted_at)
        VALUES (?, ?, ?, ?, ?)
    ",
    )
    .bind(&task_group.id.to_string())
    .bind(&task_group.name)
    .bind(&task_group.created_at.to_rfc3339())
    .bind(&updated_at)
    .bind(&deleted_at)
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn update_task_group_name(
    pool: &SqlitePool,
    task_group: &mut TaskGroup,
) -> Result<(), sqlx::Error> {
    task_group.update_updated_at();
    let updated_at = task_group.updated_at.map(|dt| dt.to_rfc3339());

    sqlx::query(
        "
        INSERT OR REPLACE INTO task_groups (id, name, updated_at)
        VALUES (?, ?, ?)
    ",
    )
    .bind(&task_group.id.to_string())
    .bind(&task_group.name)
    .bind(&updated_at)
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn load_all(pool: &SqlitePool) -> Result<Vec<TaskGroup>, sqlx::Error> {
    let rows = sqlx::query("SELECT * FROM task_groups WHERE deleted_at IS NULL")
        .fetch_all(pool)
        .await?;

    let mut task_groups = Vec::new();
    for row in rows {
        let task_group_id: String = row.try_get("id")?;
        let id = Uuid::parse_str(&task_group_id).unwrap_or(Uuid::new_v4());
        let name: String = row.try_get("name")?;
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

        let tasks: Vec<Uuid> = get_task_id_from_task_group_id(&pool, &task_group_id)
            .await
            .unwrap();

        task_groups.push(TaskGroup {
            id,
            name,
            tasks,
            created_at,
            updated_at,
            deleted_at,
        });
    }
    Ok(task_groups)
}
