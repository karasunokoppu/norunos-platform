import { invoke } from "@tauri-apps/api/core";
import type { Task } from "../type";

export async function getTasks(): Promise<Task[]> {
    try{
        return await invoke<Task[]>("get_tasks");
    }catch(e){
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