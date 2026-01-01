import React, { useState, useEffect } from "react";
import NotesSidebar from "./NotesSidebar";
import NoteEditor from "./NoteEditor";
import { getNotesTree, readNote, createNote, createFolder, deleteItem, renameItem, FileNode } from "../../tauri/notes_api";

const NotesView: React.FC = () => {
	const [fileTree, setFileTree] = useState<FileNode[]>([]);
	const [currentFile, setCurrentFile] = useState<string | null>(null);
	const [fileContent, setFileContent] = useState<string>("");

	const refreshTree = () => {
		getNotesTree().then(setFileTree).catch(console.error);
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
			refreshTree();
		} catch (e) {
			alert("Failed to create note: " + e);
		}
	};

	const handleCreateFolder = async (parentPath: string) => {
		const name = prompt("Enter folder name:");
		if (!name) return;
		try {
			await createFolder(parentPath, name);
			refreshTree();
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
			refreshTree();
		} catch (e) {
			alert("Failed to delete item: " + e);
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
			refreshTree();
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
			/>
		</div>
	);
};

export default NotesView;
