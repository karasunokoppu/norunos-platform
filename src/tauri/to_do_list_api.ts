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