import React, { useState, useEffect } from "react";
import NotesSidebar from "./NotesSidebar";
import NoteEditor from "./NoteEditor";
import GraphView from "./GraphView";
import { getNotesTree, readNote, createNote, createFolder, deleteItem, renameItem, FileNode } from "../../tauri/notes_api";
import FolderSelectDialog from "./FolderSelectDialog";
import { Network } from "lucide-react";

const NotesView: React.FC = () => {
	const [fileTree, setFileTree] = useState<FileNode[]>([]);
	const [currentFile, setCurrentFile] = useState<string | null>(null);
	const [fileContent, setFileContent] = useState<string>("");
	const [showFolderDialog, setShowFolderDialog] = useState(false);
	const [pendingNoteName, setPendingNoteName] = useState<string | null>(null);
	const [showGraph, setShowGraph] = useState(false);

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
		setShowGraph(false);
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
				onCancel={() => { setShowFolderDialog(false); setPendingNoteName(null); }}
			/>
		</div>
	);
};

export default NotesView;
