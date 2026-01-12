use sqlx::SqlitePool;

pub async fn init_rela_task_task_group_table(pool: &SqlitePool) -> Result<(), sqlx::Error> {
    sqlx::query(
        "CREATE TABLE IF NOT EXISTS rela_task_task_group (
            task_group_id TEXT NOT NULL,
            task_id TEXT NOT NULL
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

pub async fn delete_rela_task_task_group_by_task_id(
    pool: &SqlitePool,
    task_id: String,
) -> Result<(), sqlx::Error> {
    sqlx::query("DELETE FROM rela_task_task_group WHERE task_id = ?")
        .bind(task_id)
        .execute(pool)
        .await?;
    Ok(())
}
