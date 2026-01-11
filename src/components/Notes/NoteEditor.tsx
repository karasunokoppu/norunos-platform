import { Network } from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { useToast } from "../../context/ToastContext";
import { getBacklinks, saveNote } from "../../tauri/notes_api";
import MarkdownRenderer from "../shared/MarkdownRenderer";

interface NoteEditorProps {
	path: string | null;
	initialContent: string;
	onSaveSuccess: () => void;
	onNavigate?: (target: string) => void;
	onToggleGraph?: () => void;
}

const NoteEditor: React.FC<NoteEditorProps> = ({
	path,
	initialContent,
	onSaveSuccess,
	onNavigate,
	onToggleGraph,
}) => {
	const [content, setContent] = useState(initialContent);
	const [isDirty, setIsDirty] = useState(false);
	const [backlinks, setBacklinks] = useState<string[]>([]);
	const { showError, showSuccess } = useToast();

	// Refs for scroll synchronization
	const editorRef = useRef<HTMLTextAreaElement>(null);
	const previewRef = useRef<HTMLDivElement>(null);
	const scrollSource = useRef<"editor" | "preview" | null>(null);

	// Reset content when path changes
	useEffect(() => {
		setContent(initialContent);
		setIsDirty(false);
	}, [path, initialContent]);

	// Fetch backlinks when path changes
	useEffect(() => {
		if (path) {
			getBacklinks(path)
				.then(setBacklinks)
				.catch((err) => {
					console.error("Failed to fetch backlinks:", err);
					setBacklinks([]);
					showError("バックリンクの取得に失敗しました");
				});
		} else {
			setBacklinks([]);
		}
	}, [path]);

	const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		setContent(e.target.value);
		setIsDirty(true);
	};

	const handleSave = async () => {
		if (!path) return;
		try {
			await saveNote(path, content);
			setIsDirty(false);
			onSaveSuccess();
			showSuccess("ノートを保存しました");
		} catch (e) {
			console.error("Failed to save note:", e);
			showError("ノートの保存に失敗しました");
		}
	};

	// Auto-save or Shortcut (Ctrl+S)
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if ((e.ctrlKey || e.metaKey) && e.key === "s") {
				e.preventDefault();
				handleSave();
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [path, content]);

	// Scroll Sync Handlers
	const handleEditorScroll = () => {
		if (scrollSource.current === "preview") return;

		const editor = editorRef.current;
		const preview = previewRef.current;

		if (editor && preview) {
			const percentage =
				editor.scrollTop / (editor.scrollHeight - editor.clientHeight);
			if (!isNaN(percentage)) {
				preview.scrollTop =
					percentage * (preview.scrollHeight - preview.clientHeight);
			}
		}
	};

	const handlePreviewScroll = () => {
		if (scrollSource.current === "editor") return;

		const editor = editorRef.current;
		const preview = previewRef.current;

		if (editor && preview) {
			const percentage =
				preview.scrollTop / (preview.scrollHeight - preview.clientHeight);
			if (!isNaN(percentage)) {
				editor.scrollTop =
					percentage * (editor.scrollHeight - editor.clientHeight);
			}
		}
	};

	if (!path) {
		return (
			<div className="flex-1 flex flex-col h-full bg-bg-secondary text-text-primary">
				<div className="h-10 border-b border-border-primary bg-bg-primary flex items-center px-4 justify-end">
					{onToggleGraph && (
						<button
							type="button"
							onClick={onToggleGraph}
							className="p-1 rounded hover:bg-bg-tertiary text-text-secondary hover:text-text-primary transition-colors"
							title="Graph View"
						>
							<Network size={18} />
						</button>
					)}
				</div>
				<div className="flex-1 flex justify-center items-center text-text-tertiary">
					Select a note to edit
				</div>
			</div>
		);
	}

	return (
		<div className="flex-1 flex flex-col h-full bg-bg-secondary text-text-primary">
			{/* Toolbar */}
			<div className="h-10 border-b border-border-primary bg-bg-primary flex items-center px-4 justify-between">
				<span className="text-xs text-text-secondary truncate">{path}</span>
				<div className="flex items-center gap-4">
					<span
						className={`text-xs ${isDirty ? "text-yellow-500" : "text-green-500"}`}
					>
						{isDirty ? "Unsaved" : "Saved"}
					</span>
					<button
						type="button"
						onClick={handleSave}
						className="bg-accent-secondary text-white px-3 py-1 rounded text-xs hover:bg-opacity-80"
					>
						Save
					</button>
					{onToggleGraph && (
						<button
							type="button"
							onClick={onToggleGraph}
							className="p-1 rounded hover:bg-bg-tertiary text-text-secondary hover:text-text-primary transition-colors"
							title="Graph View"
						>
							<Network size={18} />
						</button>
					)}
				</div>
			</div>

			{/* Split View */}
			<div className="flex-1 flex flex-row overflow-hidden">
				{/* Editor */}
				<div className="flex-1 h-full border-r border-border-primary flex flex-col">
					<textarea
						ref={editorRef}
						className="flex-1 w-full bg-bg-secondary text-text-primary p-4 outline-none resize-none font-mono text-sm leading-relaxed"
						value={content}
						onChange={handleChange}
						onScroll={handleEditorScroll}
						onMouseEnter={() => {
							scrollSource.current = "editor";
						}}
						onFocus={() => {
							scrollSource.current = "editor";
						}}
						placeholder="# Write your markdown here..."
					/>
				</div>

				{/* Preview & Backlinks */}
				<div className="flex-1 h-full flex flex-col overflow-hidden">
					<div
						ref={previewRef}
						onScroll={handlePreviewScroll}
						onMouseEnter={() => {
							scrollSource.current = "preview";
						}}
						onFocus={() => {
							scrollSource.current = "preview";
						}}
						className="flex-1 overflow-y-auto p-4"
					>
						<MarkdownRenderer content={content} onNavigate={onNavigate} />
					</div>
					{/* Backlinks Section */}
					{backlinks.length > 0 && (
						<div className="h-40 border-t border-border-primary p-4 bg-bg-tertiary overflow-y-auto">
							<h3 className="text-sm font-bold text-text-secondary mb-2">
								Linked to this note:
							</h3>
							<ul className="space-y-1">
								{backlinks.map((linkPath) => {
									// Extract filename for display
									const parts = linkPath.split(/[/\\]/);
									const fileName = parts.pop() || linkPath;
									const displayName = fileName.replace(".md", "");

									return (
										<li key={linkPath}>
											<button
												type="button"
												onClick={() =>
													onNavigate && onNavigate(`internal://${displayName}`)
												}
												className="text-xs text-accent-secondary hover:underline flex items-center"
											>
												<span className="mr-1">←</span>
												{displayName}
												<span className="text-text-tertiary ml-2 text-[10px] truncate max-w-[200px]">
													{linkPath}
												</span>
											</button>
										</li>
									);
								})}
							</ul>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default NoteEditor;
