import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Book, ReadingMemo } from "../../type/books";
import ReadingMemoEditor from "./ReadingMemoEditor";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Edit2, Trash2, X } from "lucide-react";

interface BookDetailModalProps {
    book: Book;
    isOpen: boolean;
    onClose: () => void;
    onEditBook: () => void;
}

const BookDetailModal = ({ book, isOpen, onClose, onEditBook }: BookDetailModalProps) => {
    const [memos, setMemos] = useState<ReadingMemo[]>([]);
    const [memoContents, setMemoContents] = useState<Record<string, string>>({});
    const [isEditingMemo, setIsEditingMemo] = useState(false);
    const [currentMemoContent, setCurrentMemoContent] = useState("");
    const [currentPage, setCurrentPage] = useState(0);
    const [editingMemoId, setEditingMemoId] = useState<string | null>(null);

    const fetchMemos = async () => {
        try {
            const data = await invoke<ReadingMemo[]>("get_book_memos", { bookId: book.id });
            setMemos(data);
            // Fetch content for previews (optional, or fetch on demand. For now fetch all)
            const contents: Record<string, string> = {};
            for (const memo of data) {
                const text = await invoke<string>("read_book_memo_file", { path: memo.content_path });
                contents[memo.id] = text;
            }
            setMemoContents(contents);
        } catch (error) {
            console.error("Failed to fetch memos:", error);
        }
    };

    useEffect(() => {
        if (isOpen && book) {
            fetchMemos();
            setIsEditingMemo(false);
            setEditingMemoId(null);
        }
    }, [isOpen, book]);

    if (!isOpen) return null;

    const handleSaveMemo = async (content: string, pageNumber: number) => {
        try {
            if (editingMemoId) {
                await invoke("update_book_memo", { id: editingMemoId, pageNumber, content });
            } else {
                await invoke("create_book_memo", { bookId: book.id, pageNumber, content });
            }
            setIsEditingMemo(false);
            setEditingMemoId(null);
            fetchMemos();
        } catch (error) {
            console.error("Failed to save memo:", error);
        }
    };

    const handleDeleteMemo = async (id: string) => {
        if (!confirm("Are you sure you want to delete this memo?")) return;
        try {
            await invoke("delete_book_memo", { id });
            fetchMemos();
        } catch (error) {
            console.error("Failed to delete memo:", error);
        }
    };

    const handleEditMemo = (memo: ReadingMemo) => {
        setEditingMemoId(memo.id);
        setCurrentMemoContent(memoContents[memo.id] || "");
        setCurrentPage(memo.page_number);
        setIsEditingMemo(true);
    };

    const startNewMemo = () => {
        setEditingMemoId(null);
        setCurrentMemoContent("");
        setCurrentPage(0);
        setIsEditingMemo(true);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
                <div className="flex justify-between items-start p-4 border-b bg-gray-50">
                    <div className="flex gap-4">
                        {book.cover_image_path && (
                            <img src={`https://asset.localhost/${book.cover_image_path}`}
                                alt={book.title}
                                className="w-20 h-28 object-cover rounded shadow"
                            />
                        )}
                        <div>
                            <h2 className="text-2xl font-bold">{book.title}</h2>
                            <p className="text-gray-700">{book.author}</p>
                            <p className="text-s text-gray-500">{book.status} • {book.total_pages} Pages</p>
                            <button
                                onClick={onEditBook}
                                className="mt-2 text-blue-600 text-sm hover:underline flex items-center gap-1"
                            >
                                <Edit2 size={14} /> Edit Book Info
                            </button>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
                        <X size={24} />
                    </button>
                </div>

                <div className="flex-1 overflow-auto p-4 bg-gray-100 flex gap-4">
                    {/* Memo List */}
                    <div className={`flex-1 flex flex-col gap-4 ${isEditingMemo ? 'hidden md:flex' : ''}`}>
                        <div className="flex justify-between items-center">
                            <h3 className="font-bold text-lg">Reading Memos</h3>
                            <button
                                onClick={startNewMemo}
                                className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                            >
                                + New Memo
                            </button>
                        </div>
                        {memos.length === 0 && <p className="text-gray-500 text-center py-4">No memos yet.</p>}

                        {memos.map(memo => (
                            <div key={memo.id} className="bg-white p-4 rounded shadow border hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start mb-2 border-b pb-2">
                                    <div className="text-sm font-semibold text-blue-800">Page {memo.page_number}</div>
                                    <div className="text-xs text-gray-500 flex items-center gap-2">
                                        <span>{new Date(memo.created_at).toLocaleDateString()}</span>
                                        <button onClick={() => handleEditMemo(memo)} className="text-gray-400 hover:text-blue-600"><Edit2 size={14} /></button>
                                        <button onClick={() => handleDeleteMemo(memo.id)} className="text-gray-400 hover:text-red-600"><Trash2 size={14} /></button>
                                    </div>
                                </div>
                                <div className="prose prose-sm max-w-none line-clamp-3">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{memoContents[memo.id] || "Loading..."}</ReactMarkdown>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Editor / Detail View */}
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
