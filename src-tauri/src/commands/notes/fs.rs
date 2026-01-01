use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};

#[derive(Debug, Serialize, Deserialize)]
pub struct FileNode {
    pub name: String,
    pub path: String,
    pub is_dir: bool,
    pub children: Option<Vec<FileNode>>,
}

const NOTES_DIR_NAME: &str = "NorunosNotes";

fn get_notes_dir() -> PathBuf {
    // For simplicity, let's use the App Data directory or Document directory.
    // However, Rust side getting "Documents" folder might require `directories` crate or tauri API.
    // Let's rely on a base path relative to the app or a fixed logic.
    // Or better, let's assume we store it in the AppData directory for now to avoid permission headaches
    // unless configured otherwise. User said "Documents/NorunosNotes".
    // Getting standard directories in Rust:
    // We can use `tauri::path::BaseDirectory`.
    // For now, let's use the simple approach of storing it alongside the database in AppData,
    // or try to resolve user's Document folder if possible.
    // Given the constraints and setup, let's stick to AppData/NorunosNotes for guaranteed access,
    // or try to use a hardcoded path if user really wants "Documents".

    // Changing strategy: Let's pass the AppHandle or resolve it via `dirs` crate if available?
    // `dirs` is not in Cargo.toml.
    // We can use `app_handle.path().document_dir()`.

    // Since we are in a command, we can accept `app_handle` but `files` logic might be cleaner if standalone.
    // Let's implement helper to get path via tauri context if possible, or just default to AppData for V1.
    // User specifically mentioned "Documents/NorunosNotes".

    // We will attempt to use the standard directories.
    // But since adding crates is annoying, let's try to infer from environment or just use a safe place.
    // Actually, `dirs` crate is very standard. Check Cargo.toml?
    // If not, we'll punt to AppData for safety unless we want to try `std::env::home_dir` (deprecated) or `env::var("HOME")`.

    if let Ok(home) = std::env::var("HOME") {
        PathBuf::from(home).join("Documents").join(NOTES_DIR_NAME)
    } else {
        PathBuf::from(NOTES_DIR_NAME) // Fallback
    }
}

fn ensure_notes_dir() -> Result<PathBuf, String> {
    let path = get_notes_dir();
    if !path.exists() {
        fs::create_dir_all(&path).map_err(|e| e.to_string())?;
    }
    Ok(path)
}

fn read_dir_recursive(path: &Path) -> Result<Vec<FileNode>, String> {
    let mut nodes = Vec::new();
    let entries = fs::read_dir(path).map_err(|e| e.to_string())?;

    for entry in entries {
        let entry = entry.map_err(|e| e.to_string())?;
        let path = entry.path();
        let metadata = entry.metadata().map_err(|e| e.to_string())?;
        let name = entry.file_name().to_string_lossy().to_string();
        let is_dir = metadata.is_dir();

        let children = if is_dir {
            Some(read_dir_recursive(&path)?)
        } else {
            None
        };

        nodes.push(FileNode {
            name,
            path: path.to_string_lossy().to_string(),
            is_dir,
            children,
        });
    }

    // Sort: Directories first, then files. Alphabetical.
    nodes.sort_by(|a, b| {
        if a.is_dir == b.is_dir {
            a.name.cmp(&b.name)
        } else {
            if a.is_dir {
                std::cmp::Ordering::Less
            } else {
                std::cmp::Ordering::Greater
            }
        }
    });

    Ok(nodes)
}

#[tauri::command]
pub async fn get_notes_tree() -> Result<Vec<FileNode>, String> {
    let root = ensure_notes_dir()?;
    read_dir_recursive(&root)
}

#[tauri::command]
pub async fn read_note(path: String) -> Result<String, String> {
    fs::read_to_string(path).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn save_note(path: String, content: String) -> Result<(), String> {
    fs::write(path, content).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn create_note(parent_path: String, name: String) -> Result<String, String> {
    // If parent_path is empty, use root.
    let dir = if parent_path.is_empty() {
        ensure_notes_dir()?
    } else {
        PathBuf::from(parent_path)
    };

    let mut file_path = dir.join(&name);
    if !name.ends_with(".md") {
        file_path.set_extension("md");
    }

    if file_path.exists() {
        return Err("File already exists".to_string());
    }

    fs::write(&file_path, "").map_err(|e| e.to_string())?;
    Ok(file_path.to_string_lossy().to_string())
}

#[tauri::command]
pub async fn create_folder(parent_path: String, name: String) -> Result<String, String> {
    let dir = if parent_path.is_empty() {
        ensure_notes_dir()?
    } else {
        PathBuf::from(parent_path)
    };

    let folder_path = dir.join(name);
    if folder_path.exists() {
        return Err("Folder already exists".to_string());
    }

    fs::create_dir(&folder_path).map_err(|e| e.to_string())?;
    Ok(folder_path.to_string_lossy().to_string())
}

#[tauri::command]
pub async fn delete_item(path: String) -> Result<(), String> {
    let p = PathBuf::from(&path);
    if p.is_dir() {
        fs::remove_dir_all(p).map_err(|e| e.to_string())
    } else {
        fs::remove_file(p).map_err(|e| e.to_string())
    }
}

#[tauri::command]
pub async fn rename_item(path: String, new_name: String) -> Result<String, String> {
    let old_path = PathBuf::from(&path);
    let parent = old_path.parent().ok_or("Invalid path")?;
    let new_path = parent.join(new_name);

    fs::rename(&old_path, &new_path).map_err(|e| e.to_string())?;
    Ok(new_path.to_string_lossy().to_string())
}
