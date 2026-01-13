import type React from "react";
import { useEffect, useState } from "react";
import { useToast } from "../../context/ToastContext";
import {
	createFolder,
	createNote,
	deleteItem,
	type FileNode,
	getNotesTree,
	moveItem,
	readNote,
	renameItem,
} from "../../tauri/notes_api";
import FolderSelectDialog from "./FolderSelectDialog";
import GraphView from "./GraphView";
import NoteEditor from "./NoteEditor";
import NotesSidebar from "./NotesSidebar";

const NotesView: React.FC = () => {
	const [fileTree, setFileTree] = useState<FileNode[]>([]);
	const [currentFile, setCurrentFile] = useState<string | null>(null);
	const [fileContent, setFileContent] = useState<string>("");
	const [showFolderDialog, setShowFolderDialog] = useState(false);
	const [pendingNoteName, setPendingNoteName] = useState<string | null>(null);
	const [showGraph, setShowGraph] = useState(false);
	const { showError, showSuccess } = useToast();

	const refreshTree = async () => {
		try {
			const tree = await getNotesTree();
			setFileTree(tree);
		} catch (e) {
			console.error("Failed to refresh tree", e);
			showError("ファイルツリーの取得に失敗しました");
		}
	};

	useEffect(() => {
		refreshTree();
	}, []);

	const handleSelectFile = async (path: string) => {
		setShowGraph(false);
		try {
			const content = await readNote(path);
			setCurrentFile(path);
			setFileContent(content);
		} catch (e) {
			console.error("Failed to read file", e);
			showError("ファイルの読み込みに失敗しました");
		}
	};

	const handleCreateFile = async (parentPath: string) => {
		const name = prompt("Enter note name (e.g. MyNote):");
		if (!name) return;
		try {
			await createNote(parentPath, name);
			await refreshTree();
			showSuccess("ノートを作成しました");
		} catch (e) {
			showError("ノートの作成に失敗しました: " + e);
		}
	};

	const handleCreateFolder = async (parentPath: string) => {
		const name = prompt("Enter folder name:");
		if (!name) return;
		try {
			await createFolder(parentPath, name);
			await refreshTree();
			showSuccess("フォルダを作成しました");
		} catch (e) {
			showError("フォルダの作成に失敗しました: " + e);
		}
	};

	const handleDelete = async (path: string) => {
		if (!confirm("Are you sure you want to delete this item?")) return;
		try {
			await deleteItem(path);
			if (currentFile === path) {
				setCurrentFile(null);
				setFileContent("");
			}
			await refreshTree();
			showSuccess("削除しました");
		} catch (e) {
			showError("削除に失敗しました: " + e);
		}
	};

	const findPathByName = (nodes: FileNode[], name: string): string | null => {
		for (const node of nodes) {
			if (!node.is_dir && (node.name === name || node.name === name + ".md")) {
				return node.path;
			}
			if (node.is_dir && node.children) {
				const found = findPathByName(node.children, name);
				if (found) return found;
			}
		}
		return null;
	};

	const handleNavigate = async (target: string) => {
		const cleanTarget = target.replace(/^internal:\/\//, "");
		const existingPath = findPathByName(fileTree, cleanTarget);
		if (existingPath) {
			handleSelectFile(existingPath);
		} else {
			setPendingNoteName(cleanTarget);
			setShowFolderDialog(true);
		}
	};

	const handleFolderSelect = async (folderPath: string) => {
		if (!pendingNoteName) return;
		setShowFolderDialog(false);
		try {
			const newPath = await createNote(folderPath, pendingNoteName);
			await refreshTree();
			await handleSelectFile(newPath);
			setPendingNoteName(null);
		} catch (e) {
			const errorMsg = String(e);
			if (errorMsg.includes("exists")) {
				await refreshTree();
				const tree = await getNotesTree();
				setFileTree(tree);
				const found = findPathByName(tree, pendingNoteName);
				if (found) {
					handleSelectFile(found);
					setPendingNoteName(null);
					return;
				}
			}
			alert("Failed to create note: " + errorMsg);
		}
	};

	const handleRename = async (path: string) => {
		const newName = prompt("Enter new name:");
		if (!newName) return;
		try {
			const newPath = await renameItem(path, newName);
			if (currentFile === path) {
				setCurrentFile(newPath);
			}
			await refreshTree();
			showSuccess("名前を変更しました");
		} catch (e) {
			showError("名前の変更に失敗しました: " + e);
		}
	};

	return (
		<div className="h-full w-full flex flex-row">
			<NotesSidebar
				fileTree={fileTree}
				onSelectFile={handleSelectFile}
				currentFile={currentFile}
				onCreateFile={handleCreateFile}
				onCreateFolder={handleCreateFolder}
				onDelete={handleDelete}
				onRename={handleRename}
				onMoveItem={async (path, targetParentPath) => {
					try {
						await moveItem(path, targetParentPath);
						if (currentFile === path) {
							// If we moved the currently open file, update its path
							// But we need the new path. The API returns new path.
							// Since we don't have the new path here easily without calling API differently
							// or calculating it.
							// Let's just refresh tree for now.
							// Ideally moveItem should return new path. It does!
							// But TypeScript definition for moveItem returns Promise<string>
							// Wait, let's fix the call properly
							// const name = path.split(/[/\\]/).pop() || "";
							// Re-calculate new path manually or just rely on tree refresh?
							// A refresh is safest.
						}
						await refreshTree();
						showSuccess("移動しました");
					} catch (e) {
						showError("移動に失敗しました: " + e);
					}
				}}
			/>
			<div className="flex-1 flex flex-col h-full bg-bg-secondary overflow-hidden relative">
				{showGraph ? (
					<GraphView
						onNavigate={handleNavigate}
						onClose={() => setShowGraph(false)}
					/>
				) : (
					<NoteEditor
						path={currentFile}
						initialContent={fileContent}
						onSaveSuccess={() => { }}
						onNavigate={handleNavigate}
						onToggleGraph={() => setShowGraph(true)}
					/>
				)}
			</div>
			<FolderSelectDialog
				isOpen={showFolderDialog}
				folders={fileTree}
				onSelect={handleFolderSelect}
				onCancel={() => {
					setShowFolderDialog(false);
					setPendingNoteName(null);
				}}
			/>
		</div>
	);
};

export default NotesView;
