import type { Book } from "../../type/books";
import ReadingProgress from "./ReadingProgress";

interface BookInfoProps {
    book: Book;
    onEditBook: () => void;
}

const BookInfo = ({ book, onEditBook }: BookInfoProps) => {
    return (
        <div className="flex gap-4">
            {book.cover_image_path && (
                <img
                    src={`https://asset.localhost/${book.cover_image_path}`}
                    alt={book.title}
                    className="w-20 h-28 object-cover rounded shadow"
                />
            )}
            <div className="flex-1">
                <h2 className="text-2xl font-bold text-text-primary">{book.title}</h2>
                <p className="text-text-secondary">{book.author}</p>
                <p className="text-s text-text-tertiary">
                    {book.status} • {book.total_pages} ページ
                </p>

                <ReadingProgress book={book} onEdit={onEditBook} />
            </div>
        </div>
    );
};

export default BookInfo;
