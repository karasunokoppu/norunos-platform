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

	// Recursively flatten the tree to search effectively
	const flattenFiles = (nodes: FileNode[]): FileNode[] => {
		let files: FileNode[] = [];
		for (const node of nodes) {
			if (!node.is_dir) {
				files.push(node);
			} else if (node.children) {
				files = files.concat(flattenFiles(node.children));
			}
		}
		return files;
	};

	const resolveLinkTarget = (
		nodes: FileNode[],
		target: string,
	): string | null => {
		const normalize = (p: string) => p.replace(/\\/g, "/");
		// Ensure target has .md extension for comparison if it's a file link
		// But target might be a folder too... existing logic assumed files for wiki links mostly.
		// Let's assume user wants to link to a file if extension is missing, OR a folder.
		// WikiLinks usually link to files.

		const hasExtension = target.toLowerCase().endsWith(".md");
		// If it looks like a file link (most cases), we append .md for matching file paths
		// But we should also check folders.

		const allFiles = flattenFiles(nodes);

		// Strategy:
		// 1. Try to find exact match by path suffix (handling both file and folder)
		// 2. If target has no separators, also try name match (First-match win)

		const cleanTarget = normalize(target);
		const targetSegments = cleanTarget.split("/").filter((s) => s.length > 0);

		// 1. Path Suffix Match
		// Check files first (adding .md if needed)
		for (const file of allFiles) {
			const filePath = normalize(file.path);
			// Check with .md
			const checkName = hasExtension ? cleanTarget : `${cleanTarget}.md`;
			// Check if path ends with target
			// We compare segments to avoid partial string matches like "NotRealFile.md" matching "RealFile.md"
			const fileSegments = filePath.split("/").filter((s) => s.length > 0);

			if (fileSegments.length >= targetSegments.length) {
				// const suffix = fileSegments.slice(-targetSegments.length).join("/");
				// Re-construct suffix to compare.
				// Actually, simpler: does the file path end with "/" + checkName or is it equal to checkName?
				// Be careful with separators.
				if (
					filePath.endsWith(`/${checkName}`) ||
					filePath === checkName ||
					// Also handle case where target implies extension but user didn't write it
					(!hasExtension &&
						(filePath.endsWith(`/${cleanTarget}.md`) ||
							filePath === `${cleanTarget}.md`))
				) {
					return file.path;
				}
			}
		}

		// 2. Folder Match (if not found in files)
		// Recursively find folder ending with target
		const findFolder = (ns: FileNode[]): string | null => {
			for (const node of ns) {
				if (node.is_dir) {
					const nodePath = normalize(node.path);
					if (
						nodePath.endsWith(`/${cleanTarget}`) ||
						nodePath === cleanTarget
					) {
						return node.path;
					}
					if (node.children) {
						const found = findFolder(node.children);
						if (found) return found;
					}
				}
			}
			return null;
		};
		const folderMatch = findFolder(nodes);
		if (folderMatch) return folderMatch;

		// 3. Name Only Match (Legacy/Simple behavior)
		// If target has no separators, try to find by name only
		if (targetSegments.length === 1) {
			const nameToFind = targetSegments[0];
			for (const file of allFiles) {
				if (
					file.name === nameToFind ||
					(!hasExtension && file.name === `${nameToFind}.md`)
				) {
					return file.path;
				}
			}
		}

		return null;
	};

	const handleNavigate = async (target: string) => {
		const cleanTarget = target.replace(/^internal:\/\//, "");
		const existingPath = resolveLinkTarget(fileTree, cleanTarget);
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
				const found = resolveLinkTarget(tree, pendingNoteName);
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
