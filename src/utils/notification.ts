import { invoke } from "@tauri-apps/api/core";

export async function sendNotification(title: string, body?: string): Promise<string> {
    try {
        await invoke("send_notification", { title, body });
        console.log('[Notification] Notification sent via Rust command');
        return 'sent';
    } catch (e) {
        console.error('[Notification] Error sending notification:', e);
        return `error: ${e}`;
    }
}
