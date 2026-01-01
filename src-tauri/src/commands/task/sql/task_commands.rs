use crate::commands::task::sql::task;
use crate::commands::task::sql::task_task_group::save_rela_task_task_group;
use crate::commands::task::task::Task;
use chrono::{DateTime, Local};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Serialize, Deserialize)]
pub struct CreateTaskDto {
    pub description: String,
    pub details: Option<String>,
    pub start_datetime: Option<DateTime<Local>>,
    pub end_datetime: Option<DateTime<Local>>,
    pub group_id: Option<Uuid>,
}
use crate::AppState;

//TODO 一通り変更
#[tauri::command]
pub async fn get_tasks(state: tauri::State<'_, AppState>) -> Result<Vec<Task>, String> {
    task::load_all(&state.pool).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn create_task(
    state: tauri::State<'_, AppState>,
    task_dto: CreateTaskDto,
) -> Result<Vec<Task>, String> {
    let mut t = Task::new();
    t.description = task_dto.description;
    t.details = task_dto.details;
    t.start_datetime = task_dto.start_datetime;
    t.end_datetime = task_dto.end_datetime;

    task::save_task(&state.pool, &mut t)
        .await
        .map_err(|e| e.to_string())?;

    if let Some(group_id) = task_dto.group_id {
        save_rela_task_task_group(&state.pool, group_id.to_string(), t.id.to_string())
            .await
            .map_err(|e| e.to_string())?;
    }

    task::load_all(&state.pool).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn update_task(
    state: tauri::State<'_, AppState>,
    task: Task,
) -> Result<Vec<Task>, String> {
    let mut t = task;
    task::save_task(&state.pool, &mut t)
        .await
        .map_err(|e| e.to_string())?;
    task::load_all(&state.pool).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_task(
    state: tauri::State<'_, AppState>,
    task: Task,
) -> Result<Vec<Task>, String> {
    let mut t = task;
    t.set_deleted();
    task::save_task(&state.pool, &mut t)
        .await
        .map_err(|e| e.to_string())?;
    task::load_all(&state.pool).await.map_err(|e| e.to_string())
}
