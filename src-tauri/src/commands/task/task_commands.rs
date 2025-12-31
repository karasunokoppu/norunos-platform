use crate::AppState;
use crate::commands::task::task::Task;
use crate::commands::task::sub_task::Subtask;
use uuid::Uuid;

#[tauri::command]
pub async fn get_tasks(state: tauri::State<'_, AppState>) -> Result<Vec<Task>, String> {
    Task::load_all(&state.pool).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn create_task(state: tauri::State<'_, AppState>, mut task: Task) -> Result<Vec<Task>, String> {
    task.id = Uuid::new_v4().to_string();
    task.save(&state.pool).await.map_err(|e| e.to_string())?;
    Task::load_all(&state.pool).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn update_task(state: tauri::State<'_, AppState>, task: Task) -> Result<Vec<Task>, String> {
    let mut t = task;
    t.save(&state.pool).await.map_err(|e| e.to_string())?;
    Task::load_all(&state.pool).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_task(state: tauri::State<'_, AppState>, task: Task) -> Result<Vec<Task>, String> {
    sqlx::query("DELETE FROM tasks WHERE id = ?")
        .bind(&task.id)
        .execute(&state.pool)
        .await
        .map_err(|e| e.to_string())?;

    sqlx::query("DELETE FROM subtasks WHERE task_id = ?")
        .bind(&task.id)
        .execute(&state.pool)
        .await
        .map_err(|e| e.to_string())?;

    Task::load_all(&state.pool).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn add_subtask(state: tauri::State<'_, AppState>, task_id: String, mut subtask: Subtask) -> Result<Vec<Task>, String> {
    subtask.id = Uuid::new_v4().to_string();
    subtask.save(task_id, &state.pool).await.map_err(|e| e.to_string())?;
    Task::load_all(&state.pool).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn update_subtask(state: tauri::State<'_, AppState>, subtask: Subtask) -> Result<Vec<Task>, String> {
    sqlx::query("UPDATE subtasks SET description = ?, completed = ? WHERE id = ?")
        .bind(&subtask.description)
        .bind(subtask.completed)
        .bind(&subtask.id)
        .execute(&state.pool)
        .await
        .map_err(|e| e.to_string())?;
    Task::load_all(&state.pool).await.map_err(|e| e.to_string())
}
