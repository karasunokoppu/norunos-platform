use chrono::{DateTime, Local};
use sqlx::{Row, SqlitePool};
use uuid::Uuid;

use crate::commands::task::{
    sql::task_task_group::init_rela_task_task_group_table, task_group::TaskGroup,
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
    init_rela_task_task_group_table(pool).await?;
    task_group.update_updated_at();
    let updated_at = task_group.updated_at.map(|dt| dt.to_rfc3339());
    let deleted_at = task_group.deleted_at.map(|dt| dt.to_rfc3339());

    sqlx::query(
        "
        INSERT OR REPLACE INTO task_groups (id, name, created_at, updated_at, deleted_at)
        VALUES (?, ?, ?, ?, ?)
    ",
    )
    .bind(&task_group.id)
    .bind(&task_group.name)
    .bind(&task_group.created_at.to_rfc3339())
    .bind(&updated_at)
    .bind(&deleted_at)
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn load_all(pool: &SqlitePool) -> Result<Vec<TaskGroup>, sqlx::Error> {
    // Ensure tables exist before querying
    init_task_group_table(pool).await?;
    init_rela_task_task_group_table(pool).await?;

    // 1. Fetch all groups
    let group_rows = sqlx::query("SELECT * FROM task_groups WHERE deleted_at IS NULL")
        .fetch_all(pool)
        .await?;

    // 2. Fetch all relations (map task_group_id -> Vec<task_id>)
    let relation_rows = sqlx::query("SELECT task_group_id, task_id FROM rela_task_task_group")
        .fetch_all(pool)
        .await?;

    use std::collections::HashMap;
    let mut relations: HashMap<String, Vec<Uuid>> = HashMap::new();
    let mut all_assigned_tasks: Vec<Uuid> = Vec::new();

    for row in relation_rows {
        let gid: String = row.try_get("task_group_id")?;
        let tid_str: String = row.try_get("task_id")?;
        if let Ok(tid) = Uuid::parse_str(&tid_str) {
            relations.entry(gid).or_insert_with(Vec::new).push(tid);
            all_assigned_tasks.push(tid);
        }
    }

    let mut task_groups = Vec::new();

    // 3. Construct "Unassigned" group
    // Fetch tasks that are NOT in relations
    // efficient way: query tasks table where id not in assigned
    // But here we can just query all unassigned tasks directly from DB for simplicity and speed
    let unassigned_rows = sqlx::query(
        "SELECT id FROM tasks WHERE id NOT IN (SELECT task_id FROM rela_task_task_group) AND deleted_at IS NULL"
    )
    .fetch_all(pool)
    .await?;

    let mut unassigned_tasks = Vec::new();
    for row in unassigned_rows {
        let id_str: String = row.try_get("id")?;
        if let Ok(id) = Uuid::parse_str(&id_str) {
            unassigned_tasks.push(id);
        }
    }

    if !unassigned_tasks.is_empty() {
        task_groups.push(TaskGroup {
            id: "unassigned".to_string(),
            name: "Unassigned".to_string(),
            tasks: unassigned_tasks,
            created_at: Local::now(),
            updated_at: None,
            deleted_at: None,
        });
    }

    // 4. Construct existing groups
    for row in group_rows {
        let id: String = row.try_get("id")?;
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

        let tasks = relations.remove(&id).unwrap_or_default();

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
