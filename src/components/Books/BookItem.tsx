import type React from "react";
import type { Book } from "../../type/books";

interface BookItemProps {
    book: Book;
    onClick: (book: Book) => void;
}

const BookItem: React.FC<BookItemProps> = ({ book, onClick }) => (
    <div
        className="border p-4 rounded shadow hover:shadow-lg cursor-pointer transition-shadow bg-bg-primary text-text-primary"
        onClick={() => onClick(book)}
    >
        {book.cover_image_path && (
            <div className="h-48 w-full mb-2 bg-gray-100 flex items-center justify-center overflow-hidden">
                <img
                    src={`https://asset.localhost/${book.cover_image_path}`}
                    alt={book.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                    }}
                />
            </div>
        )}
        {!book.cover_image_path && (
            <div className="h-48 w-full mb-2 bg-bg-tertiary flex items-center justify-center text-gray-400">
                No Cover
            </div>
        )}
        <h3 className="font-bold truncate" title={book.title}>
            {book.title}
        </h3>
        <p className="text-sm text-gray-600 truncate">{book.author}</p>
        <p className="text-xs text-gray-400 mt-1">
            {book.status} • {book.total_pages}p
        </p>
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
            <div
                className="bg-blue-600 h-1.5 rounded-full"
                style={{ width: `${Math.min(100, (book.current_page / Math.max(book.total_pages, 1)) * 100)}%` }}
            ></div>
        </div>
        <p className="text-xs text-right text-gray-400 mt-1">
            {Math.round((book.current_page / Math.max(book.total_pages, 1)) * 100)}%
        </p>
    </div>
);

export default BookItem;
