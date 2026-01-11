import { invoke } from "@tauri-apps/api/core";
import { Calendar, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useToast } from "../../context/ToastContext";
import type { Book, ReadingSession } from "../../type/books";

interface ReadingSessionHistoryProps {
    book: Book;
    onSessionCreated: () => void; // current_page更新後のリフレッシュ用
}

/**
 * 読書セッション履歴コンポーネント
 * - セッション一覧表示（日付、ページ範囲、読んだページ数）
 * - 新規セッション記録フォーム（開始ページは自動設定）
 * - セッション削除機能
 */
const ReadingSessionHistory = ({
    book,
    onSessionCreated,
}: ReadingSessionHistoryProps) => {
    const [sessions, setSessions] = useState<ReadingSession[]>([]);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [endPage, setEndPage] = useState<number>(book.current_page);
    const [note, setNote] = useState<string>("");
    const [sessionDate, setSessionDate] = useState<string>(
        new Date().toISOString().split("T")[0],
    );
    const { showSuccess, showError } = useToast();

    const fetchSessions = async () => {
        try {
            const data = await invoke<ReadingSession[]>("get_reading_sessions", {
                bookId: book.id,
            });
            setSessions(data);
        } catch (error) {
            console.error("Failed to fetch reading sessions:", error);
            showError("読書セッションの取得に失敗しました");
        }
    };

    useEffect(() => {
        fetchSessions();
    }, [book.id]);

    // bookが更新されたらendPageの初期値も更新
    useEffect(() => {
        setEndPage(book.current_page);
    }, [book.current_page]);

    const handleCreateSession = async () => {
        if (endPage <= book.current_page) {
            showError("終了ページは現在のページより大きくしてください");
            return;
        }

        try {
            await invoke("create_reading_session", {
                bookId: book.id,
                sessionDate,
                startPage: book.current_page,
                endPage,
                note: note.trim() || null,
            });

            showSuccess("読書セッションを記録しました");
            setIsFormOpen(false);
            setNote("");
            fetchSessions();
            onSessionCreated(); // 親コンポーネントでbookを再取得
        } catch (error) {
            console.error("Failed to create reading session:", error);
            showError("読書セッションの記録に失敗しました");
        }
    };

    const handleDeleteSession = async (sessionId: string) => {
        try {
            await invoke("delete_reading_session", { id: sessionId });
            showSuccess("読書セッションを削除しました");
            fetchSessions();
        } catch (error) {
            console.error("Failed to delete reading session:", error);
            showError("読書セッションの削除に失敗しました");
        }
    };

    return (
        <div className="bg-bg-secondary rounded-lg border border-border-primary p-4">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-text-primary flex items-center gap-2">
                    <Calendar size={18} />
                    読書セッション履歴
                </h3>
                <button
                    onClick={() => setIsFormOpen(!isFormOpen)}
                    className="flex items-center gap-1 text-sm text-accent-primary hover:text-accent-secondary"
                >
                    <Plus size={16} />
                    記録する
                </button>
            </div>

            {/* 新規記録フォーム */}
            {isFormOpen && (
                <div className="bg-bg-tertiary rounded p-3 mb-4 border border-border-secondary">
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <label className="text-sm text-text-secondary w-20">日付</label>
                            <input
                                type="date"
                                value={sessionDate}
                                onChange={(e) => setSessionDate(e.target.value)}
                                className="flex-1 px-2 py-1 rounded border border-border-secondary bg-bg-primary text-text-primary text-sm"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <label className="text-sm text-text-secondary w-20">
                                開始ページ
                            </label>
                            <span className="text-text-primary">{book.current_page}</span>
                            <span className="text-text-secondary text-xs">（自動設定）</span>
                        </div>

                        <div className="flex items-center gap-2">
                            <label className="text-sm text-text-secondary w-20">
                                終了ページ
                            </label>
                            <input
                                type="number"
                                min={book.current_page + 1}
                                max={book.total_pages}
                                value={endPage}
                                onChange={(e) => setEndPage(Number(e.target.value))}
                                className="w-24 px-2 py-1 rounded border border-border-secondary bg-bg-primary text-text-primary text-sm"
                            />
                            <span className="text-text-secondary text-xs">
                                / {book.total_pages}
                            </span>
                        </div>

                        <div className="flex items-start gap-2">
                            <label className="text-sm text-text-secondary w-20 pt-1">
                                メモ
                            </label>
                            <textarea
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                placeholder="任意"
                                className="flex-1 px-2 py-1 rounded border border-border-secondary bg-bg-primary text-text-primary text-sm resize-none"
                                rows={2}
                            />
                        </div>

                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setIsFormOpen(false)}
                                className="px-3 py-1 text-sm text-text-secondary hover:text-text-primary"
                            >
                                キャンセル
                            </button>
                            <button
                                onClick={handleCreateSession}
                                className="px-3 py-1 text-sm bg-accent-primary text-white rounded hover:bg-accent-secondary"
                            >
                                記録
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* セッション一覧 */}
            {sessions.length === 0 ? (
                <p className="text-text-secondary text-sm text-center py-4">
                    まだ読書セッションがありません
                </p>
            ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                    {sessions.map((session) => (
                        <div
                            key={session.id}
                            className="flex items-center justify-between bg-bg-primary rounded p-2 border border-border-secondary group"
                        >
                            <div className="flex-1">
                                <div className="flex items-center gap-3 text-sm">
                                    <span className="text-text-secondary">{session.session_date}</span>
                                    <span className="text-text-primary">
                                        p.{session.start_page} → p.{session.end_page}
                                    </span>
                                    <span className="text-accent-primary font-medium">
                                        +{session.pages_read}ページ
                                    </span>
                                </div>
                                {session.note && (
                                    <p className="text-xs text-text-secondary mt-1 truncate">
                                        {session.note}
                                    </p>
                                )}
                            </div>
                            <button
                                onClick={() => handleDeleteSession(session.id)}
                                className="p-1 text-text-secondary hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                title="削除"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ReadingSessionHistory;
