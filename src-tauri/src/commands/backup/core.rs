use crate::AppState;
use std::fs::{self, File};
use std::io::{Read, Write};
use std::path::PathBuf;
use tauri::Manager;
use walkdir::WalkDir;
use zip::write::FileOptions; // Import AppState from lib.rs root

fn get_app_data_dir(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    app.path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data dir: {}", e))
}

#[tauri::command]
pub async fn export_backup(
    app: tauri::AppHandle,
    state: tauri::State<'_, AppState>,
    target_path: String,
) -> Result<(), String> {
    let source_dir = get_app_data_dir(&app)?;

    // 1. Create a safe DB snapshot using VACUUM INTO
    let temp_dir = app.path().temp_dir().unwrap_or_else(|_| source_dir.clone());
    let temp_db_name = format!("norunos_snapshot_{}.db", chrono::Utc::now().timestamp());
    let temp_db_path = temp_dir.join(&temp_db_name);

    // Ensure clean state
    if temp_db_path.exists() {
        let _ = fs::remove_file(&temp_db_path);
    }

    // Execute VACUUM INTO
    let sql = format!("VACUUM INTO '{}'", temp_db_path.to_string_lossy());
    sqlx::query(&sql)
        .execute(&state.pool)
        .await
        .map_err(|e| format!("DB Snapshot failed: {}", e))?;

    // 2. Prepare Zip
    let file = File::create(&target_path).map_err(|e| e.to_string())?;
    let mut zip = zip::ZipWriter::new(file);
    let options = FileOptions::<()>::default()
        .compression_method(zip::CompressionMethod::Stored)
        .unix_permissions(0o755);

    // 3. Add DB snapshot as "norunos.db"
    let mut f = File::open(&temp_db_path).map_err(|e| e.to_string())?;
    let mut buffer = Vec::new();
    f.read_to_end(&mut buffer).map_err(|e| e.to_string())?;
    zip.start_file("norunos.db", options)
        .map_err(|e| e.to_string())?;
    zip.write_all(&buffer).map_err(|e| e.to_string())?;

    // cleanup temp db
    let _ = fs::remove_file(temp_db_path);

    // 4. Add other files (notes, books) - Whitelist approach
    let filter_root = source_dir.clone();
    let walker = WalkDir::new(&source_dir).into_iter();

    for entry in walker.filter_entry(move |e| {
        let path = e.path();
        match path.strip_prefix(&filter_root) {
            Ok(rel) => {
                if rel.as_os_str().is_empty() {
                    return true;
                }

                if let Some(first) = rel.components().next() {
                    let name = first.as_os_str().to_string_lossy();
                    // ALLOW ONLY: notes, books
                    // DB is already handled via snapshot, so exclude norunos.db here
                    let is_allowed = name == "notes" || name == "books";
                    if is_allowed {
                        return !e.file_name().to_string_lossy().contains(".DS_Store");
                    }
                }
                false
            }
            Err(_) => false,
        }
    }) {
        let entry = entry.map_err(|e| e.to_string())?;
        let path = entry.path();

        if path.is_file() {
            let name = path
                .strip_prefix(&source_dir)
                .map_err(|e| e.to_string())?
                .to_string_lossy()
                .into_owned();

            #[cfg(windows)]
            let name = name.replace('\\', "/");

            zip.start_file(name, options).map_err(|e| e.to_string())?;
            let mut f = File::open(path).map_err(|e| e.to_string())?;
            let mut buffer = Vec::new();
            f.read_to_end(&mut buffer).map_err(|e| e.to_string())?;
            zip.write_all(&buffer).map_err(|e| e.to_string())?;
        }
    }

    zip.finish().map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn import_backup(app: tauri::AppHandle, source_path: String) -> Result<(), String> {
    let target_dir = get_app_data_dir(&app)?;
    let file = File::open(&source_path).map_err(|e| e.to_string())?;
    let mut archive = zip::ZipArchive::new(file).map_err(|e| e.to_string())?;

    // CLEANUP: Delete existing DB files to ensure clean overwrite
    let _ = fs::remove_file(target_dir.join("norunos.db"));
    let _ = fs::remove_file(target_dir.join("norunos.db-shm"));
    let _ = fs::remove_file(target_dir.join("norunos.db-wal"));

    for i in 0..archive.len() {
        let mut file = archive.by_index(i).map_err(|e| e.to_string())?;

        // Sanity Check: If zip contains norunos.db-wal or shm, IGNORE them if we are restoring a snapshot db
        // But for backward compatibility with old backups, we might let them in?
        // Actually, if we restore norunos.db from a VACUUM snapshot, it is a self-contained WAL-less DB.
        // If the zip *also* has wal files (from old backup), they might confuse SQLite if they don't match.
        // SAFE BET: Ignore WAL/SHM from zip if present.
        if file.name().contains("norunos.db-wal") || file.name().contains("norunos.db-shm") {
            continue;
        }

        let outpath = match file.enclosed_name() {
            Some(path) => target_dir.join(path),
            None => continue,
        };

        if file.name().ends_with('/') {
            fs::create_dir_all(&outpath).map_err(|e| e.to_string())?;
        } else {
            if let Some(p) = outpath.parent() {
                if !p.exists() {
                    fs::create_dir_all(p).map_err(|e| e.to_string())?;
                }
            }
            let mut outfile = File::create(&outpath).map_err(|e| e.to_string())?;
            std::io::copy(&mut file, &mut outfile).map_err(|e| e.to_string())?;
        }
    }
    Ok(())
}
