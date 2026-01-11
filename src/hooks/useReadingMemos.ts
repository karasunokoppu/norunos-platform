import { invoke } from "@tauri-apps/api/core";
import { useCallback, useEffect, useState } from "react";
import { useToast } from "../context/ToastContext";
import type { ReadingMemo } from "../type/books";

export const useReadingMemos = (bookId: string, enabled: boolean = true) => {
    const [memos, setMemos] = useState<ReadingMemo[]>([]);
    const [memoContents, setMemoContents] = useState<Record<string, string>>({});
    const [isEditingMemo, setIsEditingMemo] = useState(false);
    const [currentMemoContent, setCurrentMemoContent] = useState("");
    const [currentPage, setCurrentPage] = useState(0);
    const [editingMemoId, setEditingMemoId] = useState<string | null>(null);

    const { showError, showSuccess } = useToast();

    const fetchMemos = useCallback(async () => {
        if (!bookId) return;
        try {
            const data = await invoke<ReadingMemo[]>("get_book_memos", {
                bookId: bookId,
            });
            setMemos(data);
            // Fetch content for previews
            const contents: Record<string, string> = {};
            for (const memo of data) {
                const text = await invoke<string>("read_book_memo_file", {
                    path: memo.content_path,
                });
                contents[memo.id] = text;
            }
            setMemoContents(contents);
        } catch (error) {
            console.error("Failed to fetch memos:", error);
            showError("メモの取得に失敗しました");
        }
    }, [bookId, showError]);

    useEffect(() => {
        if (enabled) {
            fetchMemos();
            // Reset editing state when bookId changes (or modal opens/closes if bookId changes)
            resetEditor();
        }
    }, [fetchMemos, enabled]);

    const resetEditor = () => {
        setIsEditingMemo(false);
        setEditingMemoId(null);
        setCurrentMemoContent("");
        setCurrentPage(0);
    };

    const startNewMemo = () => {
        resetEditor();
        setIsEditingMemo(true);
    };

    const handleEditMemo = (memo: ReadingMemo) => {
        setEditingMemoId(memo.id);
        setCurrentMemoContent(memoContents[memo.id] || "");
        setCurrentPage(memo.page_number);
        setIsEditingMemo(true);
    };

    const handleSaveMemo = async (content: string, pageNumber: number) => {
        try {
            if (editingMemoId) {
                await invoke("update_book_memo", {
                    id: editingMemoId,
                    pageNumber,
                    content,
                });
                showSuccess("メモを更新しました");
            } else {
                await invoke("create_book_memo", {
                    bookId: bookId,
                    pageNumber,
                    content,
                });
                showSuccess("メモを作成しました");
            }
            resetEditor();
            fetchMemos();
        } catch (error) {
            console.error("Failed to save memo:", error);
            showError("メモの保存に失敗しました");
        }
    };

    const handleDeleteMemo = async (id: string) => {
        if (!confirm("本当にこのメモを削除しますか？")) return;
        try {
            await invoke("delete_book_memo", { id });
            showSuccess("メモを削除しました");
            fetchMemos();
        } catch (error) {
            console.error("Failed to delete memo:", error);
            showError("メモの削除に失敗しました");
        }
    };

    return {
        memos,
        memoContents,
        isEditingMemo,
        currentMemoContent,
        currentPage,
        editingMemoId, // Exposed if needed, but maybe not
        setIsEditingMemo, // Exposed for cancel action
        startNewMemo,
        handleEditMemo,
        handleSaveMemo,
        handleDeleteMemo,
        fetchMemos, // Exposed if manual refresh needed
    };
};
