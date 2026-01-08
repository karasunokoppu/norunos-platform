import { Edit2 } from "lucide-react";
import type { Book } from "../../type/books";

interface ReadingProgressProps {
    book: Book;
    onEdit: () => void;
}

const ReadingProgress = ({ book, onEdit }: ReadingProgressProps) => {
    const progressPercentage = Math.round(
        (book.current_page / book.total_pages) * 100,
    );

    return (
        <div className="mt-4 bg-bg-primary p-3 rounded border border-border-secondary">
            <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-text-secondary">
                    進捗状況
                </span>
                <span className="text-sm text-accent-primary">
                    {progressPercentage}%
                </span>
            </div>
            <div className="w-full bg-bg-tertiary rounded-full h-2.5 mb-2">
                <div
                    className="bg-accent-primary h-2.5 rounded-full"
                    style={{
                        width: `${Math.min(100, progressPercentage)}%`,
                    }}
                ></div>
            </div>
            <div className="flex items-center gap-2 text-sm text-text-secondary">
                <span>ページ</span>
                <input
                    type="number"
                    min="0"
                    max={book.total_pages}
                    value={book.current_page}
                    disabled
                    className="w-16 px-1 py-0.5 border border-border-secondary rounded bg-bg-secondary text-text-primary"
                />
                <span> / {book.total_pages}</span>
            </div>

            <button
                onClick={onEdit}
                className="mt-2 text-accent-primary text-sm hover:underline flex items-center gap-1"
            >
                <Edit2 size={14} /> 進捗更新 / 情報を編集
            </button>
        </div>
    );
};

export default ReadingProgress;
