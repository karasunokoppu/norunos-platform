import { invoke } from "@tauri-apps/api/core";

export interface CalendarMemo {
    date: string;
    content: string;
}

export async function getMemos(startDate: string, endDate: string): Promise<CalendarMemo[]> {
    try {
        return await invoke<CalendarMemo[]>("get_memos", { startDate, endDate });
    } catch (e) {
        console.error("getMemos failed", e);
        throw e;
    }
}

export async function saveMemo(date: string, content: string): Promise<void> {
    try {
        await invoke("save_memo", { date, content });
    } catch (e) {
        console.error("saveMemo failed", e);
        throw e;
    }
}

export async function deleteMemo(date: string): Promise<void> {
    try {
        await invoke("delete_memo", { date });
    } catch (e) {
        console.error("deleteMemo failed", e);
        throw e;
    }
}
