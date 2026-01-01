use crate::commands::task::sql::task_group;
use crate::commands::task::task_group::TaskGroup;
use crate::AppState;
use uuid::Uuid;

#[tauri::command]
pub async fn get_task_groups(state: tauri::State<'_, AppState>) -> Result<Vec<TaskGroup>, String> {
    task_group::load_all(&state.pool)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn create_task_group(
    state: tauri::State<'_, AppState>,
    name: String,
) -> Result<Vec<TaskGroup>, String> {
    let mut group = TaskGroup::new();
    group.name = name;
    task_group::save_task_group(&state.pool, &mut group)
        .await
        .map_err(|e| e.to_string())?;
    task_group::load_all(&state.pool)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn update_task_group(
    state: tauri::State<'_, AppState>,
    group: TaskGroup,
) -> Result<Vec<TaskGroup>, String> {
    let mut group = group;
    task_group::save_task_group(&state.pool, &mut group)
        .await
        .map_err(|e| e.to_string())?;
    task_group::load_all(&state.pool)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_task_group(
    state: tauri::State<'_, AppState>,
    group: TaskGroup,
) -> Result<Vec<TaskGroup>, String> {
    let mut group = group;
    group.set_deleted();
    task_group::save_task_group(&state.pool, &mut group)
        .await
        .map_err(|e| e.to_string())?;
    task_group::load_all(&state.pool)
        .await
        .map_err(|e| e.to_string())
}
