import { Edit2, Trash2 } from "lucide-react";
import type { ReadingMemo } from "../../type/books";
import MarkdownRenderer from "../shared/MarkdownRenderer";

interface MemoListProps {
    memos: ReadingMemo[];
    memoContents: Record<string, string>;
    onEditMemo: (memo: ReadingMemo) => void;
    onDeleteMemo: (id: string) => void;
    onStartNewMemo: () => void;
    isDetailViewOpen: boolean;
}

const MemoList = ({
    memos,
    memoContents,
    onEditMemo,
    onDeleteMemo,
    onStartNewMemo,
    isDetailViewOpen,
}: MemoListProps) => {
    return (
        <div
            className={`flex-1 flex flex-col gap-4 ${isDetailViewOpen ? "hidden md:flex" : ""
                }`}
        >
            <div className="flex justify-between items-center">
                <h3 className="font-bold text-lg text-text-primary">読書メモ</h3>
                <button
                    onClick={onStartNewMemo}
                    className="bg-accent-secondary text-white px-3 py-1 rounded text-sm hover:bg-opacity-90"
                >
                    + 新規メモ
                </button>
            </div>
            {memos.length === 0 && (
                <p className="text-text-tertiary text-center py-4">
                    メモはまだありません。
                </p>
            )}

            {memos.map((memo) => (
                <div
                    key={memo.id}
                    className="bg-bg-primary p-4 rounded shadow border border-border-secondary hover:shadow-md transition-shadow"
                >
                    <div className="flex justify-between items-start mb-2 border-b border-border-secondary pb-2">
                        <div className="text-sm font-semibold text-accent-secondary">
                            P. {memo.page_number}
                        </div>
                        <div className="text-xs text-text-tertiary flex items-center gap-2">
                            <span>{new Date(memo.created_at).toLocaleDateString()}</span>
                            <button
                                onClick={() => onEditMemo(memo)}
                                className="text-text-secondary hover:text-accent-primary"
                                title="編集"
                            >
                                <Edit2 size={14} />
                            </button>
                            <button
                                onClick={() => onDeleteMemo(memo.id)}
                                className="text-text-secondary hover:text-red-500"
                                title="削除"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    </div>
                    <div className="prose prose-sm prose-invert max-w-none line-clamp-3 text-text-secondary">
                        <MarkdownRenderer content={memoContents[memo.id] || "Loading..."} />
                    </div>
                </div>
            ))}
        </div>
    );
};

export default MemoList;
