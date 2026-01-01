import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Book } from "../../type/books";
import { Plus } from "lucide-react";

// Placeholder components
const BookItem = ({ book, onClick }: { book: Book; onClick: (book: Book) => void }) => (
	<div
		className="border p-4 rounded shadow hover:shadow-lg cursor-pointer transition-shadow bg-white"
		onClick={() => onClick(book)}
	>
		{book.cover_image_path && (
			<div className="h-48 w-full mb-2 bg-gray-100 flex items-center justify-center overflow-hidden">
				{/* TODO: Handle local asset loading securely if needed, or assume web URL/convertFileSrc */}
				<img src={`https://asset.localhost/${book.cover_image_path}`} alt={book.title} className="w-full h-full object-cover"
					onError={(e) => {
						(e.target as HTMLImageElement).style.display = 'none';
					}}
				/>
			</div>
		)}
		{!book.cover_image_path && (
			<div className="h-48 w-full mb-2 bg-gray-200 flex items-center justify-center text-gray-400">
				No Cover
			</div>
		)}
		<h3 className="font-bold truncate" title={book.title}>{book.title}</h3>
		<p className="text-sm text-gray-600 truncate">{book.author}</p>
		<p className="text-xs text-gray-400 mt-1">{book.status} • {book.total_pages}p</p>
	</div>
);

import BookDialog from "./BookDialog";

import BookDetailModal from "./BookDetailModal";

const BooksView = () => {
	const [books, setBooks] = useState<Book[]>([]);
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [isDetailOpen, setIsDetailOpen] = useState(false);
	const [selectedBook, setSelectedBook] = useState<Book | null>(null);

	const fetchBooks = async () => {
		try {
			const data = await invoke<Book[]>("get_books");
			setBooks(data);
		} catch (error) {
			console.error("Failed to fetch books:", error);
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
				<h2 className="text-2xl font-bold">Books (Reading Memos)</h2>
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
