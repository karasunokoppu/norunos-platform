use crate::commands::task::sql::task;
use crate::AppState;

//TODO 一通り変更
// #[tauri::command]
// pub async fn get_tasks(state: tauri::State<'_, AppState>) -> Result<Vec<Task>, String> {
//     task::load_all(&state.pool).await.map_err(|e| e.to_string())
// }

// #[tauri::command]
// pub async fn create_task(
//     state: tauri::State<'_, AppState>,
//     task: Task,
// ) -> Result<Vec<Task>, String> {
//     let mut t = task;
//     t.save(&state.pool).await.map_err(|e| e.to_string())?;
//     task::load_all(&state.pool).await.map_err(|e| e.to_string())
// }

// #[tauri::command]
// pub async fn update_task(
//     state: tauri::State<'_, AppState>,
//     task: Task,
// ) -> Result<Vec<Task>, String> {
//     let mut t = task;
//     t.save(&state.pool).await.map_err(|e| e.to_string())?;
//     task::load_all(&state.pool).await.map_err(|e| e.to_string())
// }

// #[tauri::command]
// pub async fn delete_task(
//     state: tauri::State<'_, AppState>,
//     task: Task,
// ) -> Result<Vec<Task>, String> {
//     let mut t = task;
//     t.set_deleted();
//     t.save(&state.pool).await.map_err(|e| e.to_string())?;
//     task::load_all(&state.pool).await.map_err(|e| e.to_string())
// }
