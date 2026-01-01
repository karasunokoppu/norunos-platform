use sqlx::SqlitePool;
// use uuid::Uuid; // Unused for now if we use strings for binding, but good to have if needed.

pub async fn init_rela_task_subtask_table(pool: &SqlitePool) -> Result<(), sqlx::Error> {
    sqlx::query(
        "CREATE TABLE IF NOT EXISTS rela_task_subtask (
            task_id TEXT NOT NULL,
            subtask_id TEXT NOT NULL,
            PRIMARY KEY (task_id, subtask_id)
        )",
    )
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn save_rela_task_subtask(
    pool: &SqlitePool,
    task_id: String,
    subtask_id: String,
) -> Result<(), sqlx::Error> {
    sqlx::query("INSERT OR REPLACE INTO rela_task_subtask (task_id, subtask_id) VALUES (?, ?)")
        .bind(task_id)
        .bind(subtask_id)
        .execute(pool)
        .await?;
    Ok(())
}
