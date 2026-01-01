import { invoke } from "@tauri-apps/api/core";
import { Task, CreateTaskPayload, TaskGroup } from "../type";

export async function getTasks(): Promise<Task[]> {
    try {
        return await invoke<Task[]>("get_tasks", {});
    } catch (e) {
        console.error("getTasks failed", e);
        throw e;
    }
}

export async function createTask(payload: CreateTaskPayload): Promise<Task[]> {
    try {
        return await invoke<Task[]>("create_task", { taskDto: payload });
    } catch (e) {
        console.error("createTask failed", e);
        throw e;
    }
}

export async function updateTask(task: Task): Promise<Task[]> {
    try {
        return await invoke<Task[]>("update_task", { task });
    } catch (e) {
        console.error("updateTask failed", e);
        throw e;
    }
}

export async function deleteTask(task: Task): Promise<Task[]> {
    try {
        return await invoke<Task[]>("delete_task", { task });
    } catch (e) {
        console.error("deleteTask failed", e);
        throw e;
    }
}

// Task Group APIs
export async function getTaskGroups(): Promise<TaskGroup[]> {
    try {
        return await invoke<TaskGroup[]>("get_task_groups", {});
    } catch (e) {
        console.error("getTaskGroups failed", e);
        throw e;
    }
}

export async function createTaskGroup(name: string): Promise<TaskGroup[]> {
    try {
        return await invoke<TaskGroup[]>("create_task_group", { name });
    } catch (e) {
        console.error("createTaskGroup failed", e);
        throw e;
    }
}

export async function updateTaskGroup(group: TaskGroup): Promise<TaskGroup[]> {
    try {
        return await invoke<TaskGroup[]>("update_task_group", { group });
    } catch (e) {
        console.error("updateTaskGroup failed", e);
        throw e;
    }
}

export async function deleteTaskGroup(group: TaskGroup): Promise<TaskGroup[]> {
    try {
        return await invoke<TaskGroup[]>("delete_task_group", { group });
    } catch (e) {
        console.error("deleteTaskGroup failed", e);
        throw e;
    }
}