use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};
use tauri::Manager;

#[derive(Debug, Serialize, Deserialize)]
pub struct FileNode {
    pub name: String,
    pub path: String,
    pub is_dir: bool,
    pub children: Option<Vec<FileNode>>,
}

// const NOTES_DIR_NAME: &str = "NorunosNotes"; // No longer needed as we use "notes" inside app data

fn get_notes_dir(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let app_data_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    Ok(app_data_dir.join("notes"))
}

fn ensure_notes_dir(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let path = get_notes_dir(app)?;
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
pub async fn get_notes_tree(app: tauri::AppHandle) -> Result<Vec<FileNode>, String> {
    let root = ensure_notes_dir(&app)?;
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
pub async fn create_note(
    app: tauri::AppHandle,
    parent_path: String,
    name: String,
) -> Result<String, String> {
    // If parent_path is empty, use root.
    let dir = if parent_path.is_empty() {
        ensure_notes_dir(&app)?
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
pub async fn create_folder(
    app: tauri::AppHandle,
    parent_path: String,
    name: String,
) -> Result<String, String> {
    let dir = if parent_path.is_empty() {
        ensure_notes_dir(&app)?
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

    let mut final_name = new_name;
    // If old path was a markdown file and new name doesn't have an extension, add .md
    if let Some(ext) = old_path.extension() {
        if ext == "md" && !final_name.ends_with(".md") {
            final_name.push_str(".md");
        }
    }

    let new_path = parent.join(final_name);

    if new_path.exists() {
        return Err("Target path already exists".to_string());
    }

    fs::rename(&old_path, &new_path).map_err(|e| e.to_string())?;
    Ok(new_path.to_string_lossy().to_string())
}

fn find_backlinks_recursive(
    dir: &Path,
    target_name: &str,
    backlinks: &mut Vec<String>,
) -> Result<(), String> {
    if !dir.is_dir() {
        return Ok(());
    }

    let entries = fs::read_dir(dir).map_err(|e| e.to_string())?;
    for entry in entries {
        let entry = entry.map_err(|e| e.to_string())?;
        let path = entry.path();

        if path.is_dir() {
            find_backlinks_recursive(&path, target_name, backlinks)?;
        } else {
            if let Some(ext) = path.extension() {
                if ext == "md" {
                    // Read file content
                    let content = fs::read_to_string(&path).unwrap_or_default();

                    let link_pattern_1 = format!("[[{}]]", target_name);
                    let link_pattern_2 = format!("[[{}|", target_name);

                    if content.contains(&link_pattern_1) || content.contains(&link_pattern_2) {
                        backlinks.push(path.to_string_lossy().to_string());
                    }
                }
            }
        }
    }
    Ok(())
}

#[tauri::command]
pub async fn get_backlinks(app: tauri::AppHandle, target: String) -> Result<Vec<String>, String> {
    let root = ensure_notes_dir(&app)?;
    let mut backlinks = Vec::new();

    // Target might contain .md extension, but wiki-links usually don't.
    // Let's strip extension if present for the search.
    let search_term = if target.ends_with(".md") {
        target.trim_end_matches(".md").to_string()
    } else {
        target.clone()
    };

    let path_obj = PathBuf::from(&search_term);
    let file_stem = path_obj
        .file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or(&search_term)
        .to_string();

    find_backlinks_recursive(&root, &file_stem, &mut backlinks)?;

    Ok(backlinks)
}

#[derive(Serialize, Deserialize)]
pub struct GraphNode {
    id: String,
    name: String,
    val: i32,
}

#[derive(Serialize, Deserialize)]
pub struct GraphLink {
    source: String,
    target: String,
}

#[derive(Serialize, Deserialize)]
pub struct GraphData {
    nodes: Vec<GraphNode>,
    links: Vec<GraphLink>,
}

fn collect_graph_data_recursive(
    dir: &Path,
    nodes: &mut Vec<GraphNode>,
    links: &mut Vec<GraphLink>,
) -> Result<(), String> {
    if !dir.is_dir() {
        return Ok(());
    }

    let entries = fs::read_dir(dir).map_err(|e| e.to_string())?;
    for entry in entries {
        let entry = entry.map_err(|e| e.to_string())?;
        let path = entry.path();

        if path.is_dir() {
            collect_graph_data_recursive(&path, nodes, links)?;
        } else {
            if let Some(ext) = path.extension() {
                if ext == "md" {
                    let file_stem = path.file_stem().unwrap().to_string_lossy().to_string();
                    let content = fs::read_to_string(&path).unwrap_or_default();

                    nodes.push(GraphNode {
                        id: file_stem.clone(),
                        name: file_stem.clone(),
                        val: 1, // Default size
                    });

                    // Parse links: [[Link]] or [[Link|Alias]]
                    let mut start_idx = 0;
                    while let Some(open) = content[start_idx..].find("[[") {
                        let actual_open = start_idx + open;
                        if let Some(close) = content[actual_open..].find("]]") {
                            let actual_close = actual_open + close;
                            let link_content = &content[actual_open + 2..actual_close];

                            // Handle aliases [[Target|Alias]]
                            let target = if let Some(pipe) = link_content.find('|') {
                                &link_content[..pipe]
                            } else {
                                link_content
                            };

                            // Trim and add link
                            let target_clean = target.trim().to_string();
                            if !target_clean.is_empty() {
                                links.push(GraphLink {
                                    source: file_stem.clone(),
                                    target: target_clean,
                                });
                            }

                            start_idx = actual_close + 2;
                        } else {
                            break;
                        }
                    }
                }
            }
        }
    }
    Ok(())
}

#[tauri::command]
pub async fn move_item(
    app: tauri::AppHandle,
    path: String,
    target_parent_path: String,
) -> Result<String, String> {
    let old_path = PathBuf::from(&path);
    if !old_path.exists() {
        return Err("Source item does not exist".to_string());
    }

    let file_name = old_path
        .file_name()
        .ok_or("Invalid source path")?
        .to_string_lossy()
        .to_string();

    let parent_dir = if target_parent_path.is_empty() {
        ensure_notes_dir(&app)?
    } else {
        PathBuf::from(target_parent_path)
    };

    if !parent_dir.exists() {
        return Err("Target parent directory does not exist".to_string());
    }

    let new_path = parent_dir.join(&file_name);

    // Prevent moving into itself or subdirectory if it's a directory
    if old_path.is_dir() && new_path.starts_with(&old_path) {
        return Err("Cannot move directory into its own subdirectory".to_string());
    }

    if new_path.exists() {
        return Err("Target path already exists".to_string());
    }

    fs::rename(&old_path, &new_path).map_err(|e| e.to_string())?;
    Ok(new_path.to_string_lossy().to_string())
}

#[tauri::command]
pub async fn get_graph_data(app: tauri::AppHandle) -> Result<GraphData, String> {
    let root = ensure_notes_dir(&app)?;
    let mut nodes = Vec::new();
    let mut links = Vec::new();

    collect_graph_data_recursive(&root, &mut nodes, &mut links)?;

    Ok(GraphData { nodes, links })
}
