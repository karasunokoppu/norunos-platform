use chrono::{DateTime, Local};
use serde::{Deserialize, Serialize};
use serde_json;
use sqlx::{query, Row, SqlitePool};
use uuid::Uuid;

pub async fn init_rela_task_task_group_table(pool: &SqlitePool) -> Result<(), sqlx::Error> {
    sqlx::query(
        "CREATE TABLE IF NOT EXISTS rela_task_task_group (
            task_group_id TEXT NOT NULL,
            task_id TEXT NOT NULL,
        )",
    )
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn save_rela_task_task_group(
    pool: &SqlitePool,
    task_group_id: String,
    task_id: String,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        "
        INSERT OR REPLACE INTO rela_task_task_group (task_group_id, task_id)
        VALUES(?, ?)
    ",
    )
    .bind(task_group_id)
    .bind(task_id)
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn get_task_id_from_task_group_id(
    pool: &SqlitePool,
    task_group_id: &String,
) -> Result<Vec<Uuid>, sqlx::Error> {
    let tasks = sqlx::query(
        "
        SELECT task_id FROM rela_task_task_group WHERE task_group_id = ?
    ",
    )
    .bind(task_group_id)
    .fetch_all(pool)
    .await?;
    let mut task_ids = Vec::new();

    for task_id in tasks {
        let task: String = task_id.try_get("task_id")?;
        task_ids.push(task.as_str().parse().unwrap());
    }
    Ok(task_ids)
}
