use crate::commands::mindmap::db::MindMap;
use crate::AppState;
use chrono::Local;
use tauri::State;

#[tauri::command]
pub async fn get_mind_maps(state: State<'_, AppState>) -> Result<Vec<MindMap>, String> {
    sqlx::query_as::<_, MindMap>(
        "SELECT * FROM mind_maps WHERE deleted_at IS NULL ORDER BY updated_at DESC",
    )
    .fetch_all(&state.pool)
    .await
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn create_mind_map(
    state: State<'_, AppState>,
    title: String,
    content: String,
) -> Result<MindMap, String> {
    let mind_map = MindMap::new(title, content);

    sqlx::query(
        "INSERT INTO mind_maps (id, title, content, created_at, updated_at, deleted_at)
         VALUES (?, ?, ?, ?, ?, ?)",
    )
    .bind(&mind_map.id)
    .bind(&mind_map.title)
    .bind(&mind_map.content)
    .bind(&mind_map.created_at)
    .bind(&mind_map.updated_at)
    .bind(&mind_map.deleted_at)
    .execute(&state.pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(mind_map)
}

#[tauri::command]
pub async fn update_mind_map(
    state: State<'_, AppState>,
    id: String,
    title: String,
    content: String,
) -> Result<MindMap, String> {
    let updated_at = Local::now().to_rfc3339();

    sqlx::query("UPDATE mind_maps SET title = ?, content = ?, updated_at = ? WHERE id = ?")
        .bind(&title)
        .bind(&content)
        .bind(&updated_at)
        .bind(&id)
        .execute(&state.pool)
        .await
        .map_err(|e| e.to_string())?;

    let updated_map = sqlx::query_as::<_, MindMap>("SELECT * FROM mind_maps WHERE id = ?")
        .bind(&id)
        .fetch_one(&state.pool)
        .await
        .map_err(|e| e.to_string())?;

    Ok(updated_map)
}

#[tauri::command]
pub async fn delete_mind_map(state: State<'_, AppState>, id: String) -> Result<(), String> {
    let deleted_at = Local::now().to_rfc3339();
    sqlx::query("UPDATE mind_maps SET deleted_at = ? WHERE id = ?")
        .bind(deleted_at)
        .bind(id)
        .execute(&state.pool)
        .await
        .map_err(|e| e.to_string())?;
    Ok(())
}
