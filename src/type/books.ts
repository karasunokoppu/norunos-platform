export interface Book {
    id: string;
    title: string;
    author: string;
    status: string; // "To Read" | "Reading" | "Read"
    total_pages: number;
    cover_image_path: string | null;
    created_at: string;
    updated_at: string | null;
    deleted_at: string | null;
}

export interface ReadingMemo {
    id: string;
    book_id: string;
    page_number: number;
    content_path: string;
    created_at: string;
    updated_at: string | null;
    deleted_at: string | null;
}

export interface CreateBookDto {
    title: string;
    author: string;
    total_pages: number;
    cover_image_path: string | null;
}

export interface CreateMemoDto {
    book_id: string;
    page_number: number;
    content: string;
}
