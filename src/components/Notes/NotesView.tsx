import React, { useState, useEffect } from "react";
import NotesSidebar from "./NotesSidebar";
import NoteEditor from "./NoteEditor";
import { getNotesTree, readNote, createNote, createFolder, deleteItem, renameItem, FileNode } from "../../tauri/notes_api";
import FolderSelectDialog from "./FolderSelectDialog";

const NotesView: React.FC = () => {
	const [fileTree, setFileTree] = useState<FileNode[]>([]);
	const [currentFile, setCurrentFile] = useState<string | null>(null);
	const [fileContent, setFileContent] = useState<string>("");
	const [showFolderDialog, setShowFolderDialog] = useState(false);
	const [pendingNoteName, setPendingNoteName] = useState<string | null>(null);

	const refreshTree = async () => {
		try {
			const tree = await getNotesTree();
			setFileTree(tree);
		} catch (e) {
			console.error("Failed to refresh tree", e);
		}
	};

	useEffect(() => {
		refreshTree();
	}, []);

	const handleSelectFile = async (path: string) => {
		try {
			const content = await readNote(path);
			setCurrentFile(path);
			setFileContent(content);
		} catch (e) {
			console.error("Failed to read file", e);
			alert("Failed to read file");
		}
	};

	const handleCreateFile = async (parentPath: string) => {
		const name = prompt("Enter note name (e.g. MyNote):");
		if (!name) return;
		try {
			await createNote(parentPath, name);
			await refreshTree();
		} catch (e) {
			alert("Failed to create note: " + e);
		}
	};

	const handleCreateFolder = async (parentPath: string) => {
		const name = prompt("Enter folder name:");
		if (!name) return;
		try {
			await createFolder(parentPath, name);
			await refreshTree();
		} catch (e) {
			alert("Failed to create folder: " + e);
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
		} catch (e) {
			alert("Failed to delete item: " + e);
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
		// Clean up target just in case, though remark-wiki-link usually gives clean href
		const cleanTarget = target.replace(/^internal:\/\//, ""); // We will set hrefTemplate to internal://

		const existingPath = findPathByName(fileTree, cleanTarget);
		if (existingPath) {
			handleSelectFile(existingPath);
		} else {
			// Open dialog instead of immediate confirm
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
				// Try to find it again
				// Since we know the folderPath and name, we can guess the path, but let's just search
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
			// If renaming current file, update state
			if (currentFile === path) {
				setCurrentFile(newPath);
			}
			await refreshTree();
		} catch (e) {
			alert("Failed to rename item: " + e);
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
			/>
			<NoteEditor
				path={currentFile}
				initialContent={fileContent}
				onSaveSuccess={() => { }}
				onNavigate={handleNavigate}
			/>
			<FolderSelectDialog
				isOpen={showFolderDialog}
				folders={fileTree}
				onSelect={handleFolderSelect}
				onCancel={() => { setShowFolderDialog(false); setPendingNoteName(null); }}
			/>
		</div>
	);
};

export default NotesView;
