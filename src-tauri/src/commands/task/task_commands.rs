use crate::AppState;
use crate::commands::task::task::Task;

#[tauri::command]
pub async fn get_tasks(state: tauri::State<'_, AppState>) -> Result<Vec<Task>, String> {
    Task::load_all(&state.pool).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn create_task(state: tauri::State<'_, AppState>, task: Task) -> Result<Vec<Task>, String> {
    let mut t = task;
    t.save(&state.pool).await.map_err(|e| e.to_string())?;
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
    let mut t = task;
    t.set_deleted();
    t.save(&state.pool).await.map_err(|e| e.to_string())?;
    Task::load_all(&state.pool).await.map_err(|e| e.to_string())
}
