import { invoke } from "@tauri-apps/api/core";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { useReadingMemos } from "../../hooks/useReadingMemos";
import type { Book } from "../../type/books";
import BookInfo from "./BookInfo";
import MemoList from "./MemoList";
import ReadingMemoEditor from "./ReadingMemoEditor";
import ReadingSessionHistory from "./ReadingSessionHistory";

interface BookDetailModalProps {
	book: Book;
	isOpen: boolean;
	onClose: () => void;
	onEditBook: () => void;
	onBookUpdated?: () => void; // 本が更新されたときの通知
}

const BookDetailModal = ({
	book: initialBook,
	isOpen,
	onClose,
	onEditBook,
	onBookUpdated,
}: BookDetailModalProps) => {
	const [book, setBook] = useState<Book>(initialBook);

	const {
		memos,
		memoContents,
		isEditingMemo,
		currentMemoContent,
		currentPage,
		setIsEditingMemo,
		startNewMemo,
		handleEditMemo,
		handleSaveMemo,
		handleDeleteMemo,
	} = useReadingMemos(book.id, isOpen);

	// initialBookが変更されたら内部stateも更新
	useEffect(() => {
		setBook(initialBook);
	}, [initialBook]);

	// セッション作成後にbookを再取得
	const handleSessionCreated = async () => {
		try {
			const books = await invoke<Book[]>("get_books");
			const updatedBook = books.find((b) => b.id === book.id);
			if (updatedBook) {
				setBook(updatedBook);
			}
			onBookUpdated?.();
		} catch (error) {
			console.error("Failed to refresh book:", error);
		}
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
			<div className="bg-bg-primary rounded-lg w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden text-text-primary border border-border-primary shadow-xl">
				<div className="flex justify-between items-start p-4 border-b border-border-primary bg-bg-secondary">
					<BookInfo book={book} onEditBook={onEditBook} />
					<button
						onClick={onClose}
						className="text-text-secondary hover:text-text-primary"
					>
						<X size={24} />
					</button>
				</div>

				<div className="flex-1 overflow-auto p-4 bg-bg-tertiary flex gap-4">
					{/* 左側: メモ一覧 */}
					<div className="w-full md:w-1/2 flex flex-col gap-4">
						<ReadingSessionHistory
							book={book}
							onSessionCreated={handleSessionCreated}
						/>
						<MemoList
							memos={memos}
							memoContents={memoContents}
							onEditMemo={handleEditMemo}
							onDeleteMemo={handleDeleteMemo}
							onStartNewMemo={startNewMemo}
							isDetailViewOpen={isEditingMemo}
						/>
					</div>

					{/* 右側: エディタ */}
					{isEditingMemo && (
						<div className="w-full md:w-1/2 flex flex-col">
							<ReadingMemoEditor
								initialContent={currentMemoContent}
								initialPage={currentPage}
								onSave={handleSaveMemo}
								onCancel={() => setIsEditingMemo(false)}
							/>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default BookDetailModal;

