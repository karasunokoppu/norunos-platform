import { invoke } from "@tauri-apps/api/core";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useToast } from "../../context/ToastContext";
import type { Book } from "../../type/books";

import BookDetailModal from "./BookDetailModal";
import BookDialog from "./BookDialog";
import BookItem from "./BookItem";

const BooksView = () => {
	const [books, setBooks] = useState<Book[]>([]);
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [isDetailOpen, setIsDetailOpen] = useState(false);
	const [selectedBook, setSelectedBook] = useState<Book | null>(null);
	const { showError } = useToast();

	const fetchBooks = async () => {
		try {
			const data = await invoke<Book[]>("get_books");
			setBooks(data);
		} catch (error) {
			console.error("Failed to fetch books:", error);
			showError("本の一覧の取得に失敗しました");
		}
	};

	useEffect(() => {
		fetchBooks();
	}, []);

	const handleSave = () => {
		fetchBooks();
	};

	const handleAddClick = () => {
		setSelectedBook(null);
		setIsDialogOpen(true);
	};

	const handleBookClick = (book: Book) => {
		setSelectedBook(book);
		setIsDetailOpen(true);
	};

	const handleEditFromDetail = () => {
		// Keep detail open? Or close it?
		// Let's close detail and open edit dialog.
		setIsDetailOpen(false);
		setIsDialogOpen(true);
		// We will need to re-open detail after save if we want continuous flow,
		// but for now let's just go back to list.
	};

	return (
		<div className="p-6">
			<div className="flex justify-between items-center mb-6">
				<h2 className="text-2xl text-text-primary font-bold">
					Books (Reading Memos)
				</h2>
				<button
					className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
					onClick={handleAddClick}
				>
					<Plus size={20} />
					Add Book
				</button>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
				{books.map((book) => (
					<BookItem key={book.id} book={book} onClick={handleBookClick} />
				))}
			</div>

			{books.length === 0 && (
				<div className="text-center py-10 text-gray-500">
					No books found. Start by adding one!
				</div>
			)}

			<BookDialog
				isOpen={isDialogOpen}
				onClose={() => setIsDialogOpen(false)}
				onSave={handleSave}
				initialBook={selectedBook}
			/>
			{selectedBook && (
				<BookDetailModal
					book={selectedBook}
					isOpen={isDetailOpen}
					onClose={() => setIsDetailOpen(false)}
					onEditBook={handleEditFromDetail}
				/>
			)}
		</div>
	);
};

export default BooksView;
