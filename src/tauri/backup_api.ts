import { invoke } from "@tauri-apps/api/core";

export async function exportBackup(targetPath: string): Promise<void> {
    await invoke("export_backup", { targetPath });
}

export async function importBackup(sourcePath: string): Promise<void> {
    await invoke("import_backup", { sourcePath });
}
