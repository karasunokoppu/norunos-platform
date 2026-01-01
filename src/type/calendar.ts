import { Task } from "./index";

export interface CalendarMemo {
    date: string;
    content: string;
}

export interface ReadingActivity {
    date: string;
    book_title: string;
    start_page: number;
    end_page: number;
    memo_id: string;
}

export type CalendarEvent =
    | { type: 'task'; data: Task }
    | { type: 'memo'; data: CalendarMemo }
    | { type: 'reading'; data: ReadingActivity };
