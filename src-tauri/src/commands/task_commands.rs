use crate::AppState;
use sqlx::SqlitePool;
use tauri::State;
use uuid::Uuid;
use crate::commands::task::task::Task;
use crate::commands::task::task_group::TaskGroup;
use crate::commands::task::sub_task::Subtask;

// Initialize database tables
#[tauri::command]
pub async fn init_database(state: State<'_, AppState>) -> Result<(), String> {
    let pool = &state.pool;

    Task::init_table(pool).await.map_err(|e| e.to_string())?;
    TaskGroup::init_table(pool).await.map_err(|e| e.to_string())?;
    Subtask::init_table(pool).await.map_err(|e| e.to_string())?;

    Ok(())
}

// Task commands
#[tauri::command]
pub async fn create_task(description: String, state: State<'_, AppState>) -> Result<String, String> {
    let pool = &state.pool;
    let mut task = Task::new();
    task.description = description;

    task.save(pool).await.map_err(|e| e.to_string())?;
    Ok(task.id.to_string())
}

#[tauri::command]
pub async fn get_tasks(state: State<'_, AppState>) -> Result<Vec<Task>, String> {
    let pool = &state.pool;
    Task::load_all(pool).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn update_task(id: String, description: Option<String>, completed: Option<bool>, state: State<'_, AppState>) -> Result<(), String> {
    let pool = &state.pool;
    let mut tasks = Task::load_all(pool).await.map_err(|e| e.to_string())?;
    let task_id = Uuid::parse_str(&id).map_err(|e| e.to_string())?;

    if let Some(task) = tasks.iter_mut().find(|t| t.id == task_id) {
        if let Some(desc) = description {
            task.description = desc;
        }
        if let Some(comp) = completed {
            task.completed = comp;
        }
        task.save(pool).await.map_err(|e| e.to_string())?;
    }

    Ok(())
}

#[tauri::command]
pub async fn delete_task(id: String, state: State<'_, AppState>) -> Result<(), String> {
    let pool = &state.pool;
    let mut tasks = Task::load_all(pool).await.map_err(|e| e.to_string())?;
    let task_id = Uuid::parse_str(&id).map_err(|e| e.to_string())?;

    if let Some(task) = tasks.iter_mut().find(|t| t.id == task_id) {
        task.set_deleted();
        task.save(pool).await.map_err(|e| e.to_string())?;
    }

    Ok(())
}

// TaskGroup commands
#[tauri::command]
pub async fn create_task_group(name: String, state: State<'_, AppState>) -> Result<String, String> {
    let pool = &state.pool;
    let mut task_group = TaskGroup::new();
    task_group.name = name;

    task_group.save(pool).await.map_err(|e| e.to_string())?;
    Ok(task_group.id.to_string())
}

#[tauri::command]
pub async fn get_task_groups(state: State<'_, AppState>) -> Result<Vec<TaskGroup>, String> {
    let pool = &state.pool;
    TaskGroup::load_all(pool).await.map_err(|e| e.to_string())
}

// Subtask commands
#[tauri::command]
pub async fn create_subtask(task_id: String, description: String, state: State<'_, AppState>) -> Result<String, String> {
    let pool = &state.pool;
    let task_uuid = Uuid::parse_str(&task_id).map_err(|e| e.to_string())?;
    let mut subtask = Subtask::new();
    subtask.description = description;

    subtask.save(task_uuid, pool).await.map_err(|e| e.to_string())?;
    Ok(subtask.id.to_string())
}

#[tauri::command]
pub async fn get_subtasks_for_task(task_id: String, state: State<'_, AppState>) -> Result<Vec<Subtask>, String> {
    let pool = &state.pool;
    let task_uuid = Uuid::parse_str(&task_id).map_err(|e| e.to_string())?;
    Subtask::load_for_task(task_uuid, pool).await.map_err(|e| e.to_string())
}