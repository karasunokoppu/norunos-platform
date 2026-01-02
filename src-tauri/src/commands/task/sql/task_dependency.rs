use sqlx::SqlitePool;

pub async fn init_task_dependency_table(pool: &SqlitePool) -> Result<(), sqlx::Error> {
    sqlx::query(
        "CREATE TABLE IF NOT EXISTS task_dependencies (
            task_id TEXT NOT NULL,
            depends_on_id TEXT NOT NULL,
            dependency_type TEXT DEFAULT 'FS',
            PRIMARY KEY (task_id, depends_on_id)
        )",
    )
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn save_dependency(
    pool: &SqlitePool,
    task_id: &str,
    depends_on_id: &str,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        "INSERT OR REPLACE INTO task_dependencies (task_id, depends_on_id, dependency_type) VALUES (?, ?, 'FS')",
    )
    .bind(task_id)
    .bind(depends_on_id)
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn delete_dependencies_for_task(
    pool: &SqlitePool,
    task_id: &str,
) -> Result<(), sqlx::Error> {
    sqlx::query("DELETE FROM task_dependencies WHERE task_id = ?")
        .bind(task_id)
        .execute(pool)
        .await?;
    Ok(())
}

pub async fn load_dependencies_for_task(
    pool: &SqlitePool,
    task_id: &str,
) -> Result<Vec<String>, sqlx::Error> {
    let rows = sqlx::query("SELECT depends_on_id FROM task_dependencies WHERE task_id = ?")
        .bind(task_id)
        .fetch_all(pool)
        .await?;

    let mut dependencies = Vec::new();
    for row in rows {
        use sqlx::Row;
        let depends_on_id: String = row.try_get("depends_on_id")?;
        dependencies.push(depends_on_id);
    }
    Ok(dependencies)
}
