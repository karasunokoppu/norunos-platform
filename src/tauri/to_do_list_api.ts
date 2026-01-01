import { invoke } from "@tauri-apps/api/core";
import type { Task, Subtask } from "../type";

export async function getTasks(): Promise<Task[]> {
    try {
        return await invoke<Task[]>("get_tasks", {});
    } catch (e) {
        console.error("getTasks failed", e);
        throw e;
    }
}

export async function createTask(task: Task): Promise<Task[]> {
    try{
        return await invoke<Task[]>("create_task", { task });
    }catch(e){
        console.error("createTask failed", e);
        throw e;
    }
}

export async function updateTask(task: Task): Promise<Task[]> {
    try{
        return await invoke<Task[]>("update_task", { task });
    }catch(e){
        console.error("updateTask failed", e);
        throw e;
    }
}

export async function deleteTask(task: Task): Promise<Task[]> {
    try{
        return await invoke<Task[]>("delete_task", { task });
    }catch(e){
        console.error("deleteTask failed", e);
        throw e;
    }
}

export async function addSubtask(taskId: string, subtask: Subtask): Promise<Task[]> {
    try{
        return await invoke<Task[]>("add_subtask", { taskId, subtask });
    }catch(e){
        console.error("addSubtask failed", e);
        throw e;
    }
}

export async function updateSubtask(subtask: Subtask): Promise<Task[]> {
    try{
        return await invoke<Task[]>("update_subtask", { subtask });
    }catch(e){
        console.error("updateSubtask failed", e);
        throw e;
    }
}