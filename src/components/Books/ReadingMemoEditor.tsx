import { useState } from "react";
import MarkdownRenderer from "../shared/MarkdownRenderer";

interface ReadingMemoEditorProps {
	initialContent?: string;
	onSave: (content: string, pageNumber: number) => void;
	onCancel: () => void;
	initialPage?: number;
}

const ReadingMemoEditor = ({
	initialContent = "",
	onSave,
	onCancel,
	initialPage = 0,
}: ReadingMemoEditorProps) => {
	const [content, setContent] = useState(initialContent);
	const [pageNumber, setPageNumber] = useState(initialPage);
	const [isPreview, setIsPreview] = useState(false);

	const handleSave = () => {
		onSave(content, pageNumber);
	};

	return (
		<div className="flex flex-col h-full border border-border-primary rounded-lg overflow-hidden bg-bg-primary">
			<div className="flex justify-between items-center bg-bg-secondary p-2 border-b border-border-primary">
				<div className="flex items-center gap-4">
					<span className="font-bold text-sm text-text-primary">メモ</span>
					<div className="flex items-center gap-2">
						<label className="text-xs text-text-secondary">ページ:</label>
						<input
							type="number"
							value={pageNumber}
							onChange={(e) => setPageNumber(parseInt(e.target.value))}
							className="w-20 px-2 py-1 text-sm border border-border-secondary rounded bg-bg-primary text-text-primary"
						/>
					</div>
				</div>
				<div className="flex gap-2">
					<button
						className={`px-3 py-1 text-sm rounded ${!isPreview ? "bg-accent-secondary/20 text-accent-secondary" : "text-text-secondary"}`}
						onClick={() => setIsPreview(false)}
					>
						編集
					</button>
					<button
						className={`px-3 py-1 text-sm rounded ${isPreview ? "bg-accent-secondary/20 text-accent-secondary" : "text-text-secondary"}`}
						onClick={() => setIsPreview(true)}
					>
						プレビュー
					</button>
				</div>
			</div>

			<div className="flex-1 overflow-auto p-4 min-h-[300px] bg-bg-secondary">
				{!isPreview ? (
					<textarea
						className="w-full h-full p-2 border-none outline-none resize-none font-mono text-sm bg-bg-secondary text-text-primary"
						value={content}
						onChange={(e) => setContent(e.target.value)}
						placeholder="ここにメモを入力... (Markdown対応)"
					/>
				) : (
					<div className="prose prose-sm prose-invert w-full max-w-none">
						<MarkdownRenderer content={content} />
					</div>
				)}
			</div>

			<div className="p-3 border-t border-border-primary bg-bg-secondary flex justify-end gap-2">
				<button
					type="button"
					onClick={onCancel}
					className="px-4 py-2 text-text-secondary text-sm hover:text-text-primary"
				>
					キャンセル
				</button>

				<button
					type="button"
					onClick={handleSave}
					className="px-4 py-2 bg-accent-secondary text-white text-sm rounded hover:bg-opacity-90"
				>
					メモを保存
				</button>
			</div>
		</div>
	);
};

export default ReadingMemoEditor;
