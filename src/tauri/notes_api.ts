import { invoke } from "@tauri-apps/api/core";

export interface FileNode {
    name: string;
    path: string; // Absolute path
    is_dir: boolean;
    children?: FileNode[];
}

export async function getNotesTree(): Promise<FileNode[]> {
    return await invoke("get_notes_tree");
}

export async function readNote(path: string): Promise<string> {
    return await invoke("read_note", { path });
}

export async function saveNote(path: string, content: string): Promise<void> {
    await invoke("save_note", { path, content });
}

export async function createNote(parentPath: string, name: string): Promise<string> {
    return await invoke("create_note", { parentPath, name });
}

export async function createFolder(parentPath: string, name: string): Promise<string> {
    return await invoke("create_folder", { parentPath, name });
}

export async function deleteItem(path: string): Promise<void> {
    await invoke("delete_item", { path });
}

export async function renameItem(path: string, newName: string): Promise<string> {
    return await invoke("rename_item", { path, newName });
}

export async function getBacklinks(target: string): Promise<string[]> {
    return await invoke("get_backlinks", { target });
}

export interface GraphNode {
    id: string;
    name: string;
    val: number;
}

export interface GraphLink {
    source: string;
    target: string;
}

export interface GraphData {
    nodes: GraphNode[];
    links: GraphLink[];
}

export async function getGraphData(): Promise<GraphData> {
    return await invoke("get_graph_data");
}
