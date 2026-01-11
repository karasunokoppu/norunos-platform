import { BookOpen } from "lucide-react";
import type React from "react";
import type { Book } from "../../type/books";

interface ReadingProgressWidgetProps {
    books: Book[];
}

const ReadingProgressWidget: React.FC<ReadingProgressWidgetProps> = ({
    books,
}) => {
    return (
        <div className="bg-bg-primary p-6 rounded-lg shadow-md border border-border-primary">
            <div className="flex items-center gap-2 mb-4">
                <BookOpen className="text-accent-secondary" size={20} />
                <h3 className="text-lg font-bold text-text-primary">読書中の本</h3>
            </div>
            {books.length === 0 ? (
                <p className="text-text-tertiary text-sm">
                    現在読んでいる本はありません
                </p>
            ) : (
                <div className="space-y-4">
                    {books.slice(0, 3).map((book) => {
                        const progressPercent =
                            book.total_pages > 0
                                ? Math.round((book.current_page / book.total_pages) * 100)
                                : 0;
                        return (
                            <div key={book.id} className="p-3 bg-bg-secondary rounded">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-text-primary text-sm font-medium truncate max-w-[70%]">
                                        {book.title}
                                    </span>
                                    <span className="text-xs text-accent-primary">
                                        {progressPercent}%
                                    </span>
                                </div>
                                <div className="w-full bg-bg-tertiary rounded-full h-2">
                                    <div
                                        className="bg-accent-primary h-2 rounded-full transition-all"
                                        style={{ width: `${progressPercent}%` }}
                                    />
                                </div>
                                <div className="text-xs text-text-tertiary mt-1">
                                    {book.current_page} / {book.total_pages} ページ
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default ReadingProgressWidget;
