import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";
import { useToast } from "../../context/ToastContext";
import type { Book } from "../../type/books";

interface BookDialogProps {
	isOpen: boolean;
	onClose: () => void;
	onSave: (book: Book) => void;
	initialBook?: Book | null;
}

const BookDialog = ({
	isOpen,
	onClose,
	onSave,
	initialBook,
}: BookDialogProps) => {
	const [title, setTitle] = useState(initialBook?.title || "");
	const [author, setAuthor] = useState(initialBook?.author || "");
	const [status, setStatus] = useState(initialBook?.status || "To Read");
	const [totalPages, setTotalPages] = useState(initialBook?.total_pages || 0);
	const [currentPage, setCurrentPage] = useState(initialBook?.current_page || 0);
	const [coverPath, setCoverPath] = useState(
		initialBook?.cover_image_path || "",
	);
	const { showError, showSuccess } = useToast();

	// Reset form when initialBook changes (e.g., switching between add and edit mode)
	useEffect(() => {
		if (isOpen) {
			setTitle(initialBook?.title || "");
			setAuthor(initialBook?.author || "");
			setStatus(initialBook?.status || "To Read");
			setTotalPages(initialBook?.total_pages || 0);
			setCurrentPage(initialBook?.current_page || 0);
			setCoverPath(initialBook?.cover_image_path || "");
		}
	}, [isOpen, initialBook]);

	if (!isOpen) return null;

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		try {
			let savedBook: Book;
			if (initialBook) {
				savedBook = await invoke("update_book", {
					id: initialBook.id,
					title,
					author,
					status,
					totalPages,
					currentPage,
					coverImagePath: coverPath || null,
				});
			} else {
				savedBook = await invoke("create_book", {
					title,
					author,
					totalPages,
					coverImagePath: coverPath || null,
				});
			}
			onSave(savedBook);
			onClose();
			showSuccess("本を保存しました");
		} catch (error) {
			console.error("Failed to save book:", error);
			showError("本の保存に失敗しました");
		}
	};

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
			<div className="bg-white rounded-lg p-6 w-full max-w-md">
				<h3 className="text-xl font-bold mb-4">
					{initialBook ? "Edit Book" : "Add Book"}
				</h3>
				<form onSubmit={handleSubmit} className="space-y-4">
					<div>
						<label className="block text-sm font-medium text-gray-700">
							Title
						</label>
						<input
							type="text"
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							required
							className="mt-1 block w-full border border-gray-300 rounded-md p-2"
						/>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700">
							Author
						</label>
						<input
							type="text"
							value={author}
							onChange={(e) => setAuthor(e.target.value)}
							required
							className="mt-1 block w-full border border-gray-300 rounded-md p-2"
						/>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700">
							Status
						</label>
						<select
							value={status}
							onChange={(e) => setStatus(e.target.value)}
							className="mt-1 block w-full border border-gray-300 rounded-md p-2"
						>
							<option value="To Read">未読</option>
							<option value="Reading">読書中</option>
							<option value="Read">読了</option>
						</select>
					</div>
					<div className="flex gap-4">
						<div className="flex-1">
							<label className="block text-sm font-medium text-gray-700">
								Total Pages
							</label>
							<input
								type="number"
								min="0"
								value={totalPages}
								onChange={(e) => setTotalPages(parseInt(e.target.value))}
								required
								className="mt-1 block w-full border border-gray-300 rounded-md p-2"
							/>
						</div>
						<div className="flex-1">
							<label className="block text-sm font-medium text-gray-700">
								Current Page
							</label>
							<input
								type="number"
								min="0"
								max={totalPages}
								value={currentPage}
								onChange={(e) => setCurrentPage(parseInt(e.target.value))}
								className="mt-1 block w-full border border-gray-300 rounded-md p-2"
							/>
						</div>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700">
							Cover Image Path
						</label>
						<input
							type="text"
							value={coverPath}
							onChange={(e) => setCoverPath(e.target.value)}
							placeholder="/path/to/image.jpg"
							className="mt-1 block w-full border border-gray-300 rounded-md p-2"
						/>
					</div>
					<div className="flex justify-end gap-2 mt-6">
						<button
							type="button"
							onClick={onClose}
							className="px-4 py-2 text-gray-600 hover:text-gray-800"
						>
							Cancel
						</button>
						<button
							type="submit"
							className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
						>
							Save
						</button>
					</div>
				</form>
			</div>
		</div>
	);
};

export default BookDialog;
