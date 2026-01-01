export interface MindMap {
    id: string;
    title: string;
    content: string; // JSON blob
    created_at: string;
    updated_at: string | null;
    deleted_at: string | null;
}
