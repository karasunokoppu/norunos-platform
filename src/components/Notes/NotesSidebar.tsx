import {
	ChevronDown,
	ChevronRight,
	File,
	Folder,
	FolderPlus,
	Plus,
} from "lucide-react";
import type React from "react";
import { useState } from "react";
import type { FileNode } from "../../tauri/notes_api";
import NorunoContextMenu, {
	type ContextMenuItem,
} from "../../ui/NorunoContextMenu";

interface NotesSidebarProps {
	fileTree: FileNode[];
	onSelectFile: (path: string) => void;
	currentFile: string | null;
	onCreateFile: (parentPath: string) => void;
	onCreateFolder: (parentPath: string) => void;
	onDelete: (path: string) => void;
	onRename: (path: string) => void;
}

const FileTreeNode: React.FC<{
	node: FileNode;
	selected: string | null;
	onSelect: (path: string) => void;
	level: number;
	onContextMenu: (e: React.MouseEvent, node: FileNode) => void;
}> = ({ node, selected, onSelect, level, onContextMenu }) => {
	const [isOpen, setIsOpen] = useState(false);
	const isSelected = selected === node.path;
	const paddingLeft = level * 10 + 4;

	const handleToggle = (e: React.MouseEvent) => {
		e.stopPropagation();
		if (node.is_dir) setIsOpen(!isOpen);
		else onSelect(node.path);
	};

	return (
		<div>
			<div
				className={`flex items-center p-1 cursor-pointer hover:bg-bg-hover text-sm group ${isSelected ? "bg-bg-active text-text-primary" : "text-text-secondary"}`}
				style={{ paddingLeft: `${paddingLeft}px` }}
				onClick={handleToggle}
				onContextMenu={(e) => onContextMenu(e, node)}
			>
				{node.is_dir ? (
					<span className="mr-1">
						{isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
					</span>
				) : (
					<span className="mr-1 w-[14px]"></span>
				)}

				{node.is_dir ? (
					<Folder size={14} className="mr-2 text-accent-secondary" />
				) : (
					<File size={14} className="mr-2 text-text-tertiary" />
				)}

				<span className="flex-1 truncate">{node.name}</span>
			</div>

			{isOpen && node.children && (
				<div>
					{node.children.map((child) => (
						<FileTreeNode
							key={child.path}
							node={child}
							selected={selected}
							onSelect={onSelect}
							level={level + 1}
							onContextMenu={onContextMenu}
						/>
					))}
				</div>
			)}
		</div>
	);
};

const NotesSidebar: React.FC<NotesSidebarProps> = ({
	fileTree,
	onSelectFile,
	currentFile,
	onCreateFile,
	onCreateFolder,
	onDelete,
	onRename,
}) => {
	const [contextMenu, setContextMenu] = useState<{
		x: number;
		y: number;
		node: FileNode;
	} | null>(null);

	const handleContextMenu = (e: React.MouseEvent, node: FileNode) => {
		e.preventDefault();
		setContextMenu({ x: e.clientX, y: e.clientY, node });
	};

	const handleCloseContextMenu = () => {
		setContextMenu(null);
	};

	const getContextMenuItems = (node: FileNode): ContextMenuItem[] => {
		const items: ContextMenuItem[] = [];

		if (node.is_dir) {
			items.push(
				{
					label: "New Note",
					onClick: () => onCreateFile(node.path),
				},
				{
					label: "New Folder",
					onClick: () => onCreateFolder(node.path),
				},
			);
		}

		items.push(
			{
				label: "Rename",
				onClick: () => onRename(node.path),
			},
			{
				label: "Delete",
				onClick: () => onDelete(node.path),
				danger: true,
			},
		);

		return items;
	};

	return (
		<div
			className="w-64 bg-bg-primary border-r border-border-primary flex flex-col h-full"
			onContextMenu={(e) => e.preventDefault()}
		>
			<div className="p-2 border-b border-border-primary flex justify-between items-center text-text-primary font-bold text-sm">
				<span>Notes</span>
				<div className="flex gap-2">
					<button
						type="button"
						onClick={() => onCreateFolder("")}
						title="Root Folder"
						className="p-1 hover:bg-bg-tertiary rounded text-text-secondary"
					>
						<FolderPlus size={16} />
					</button>
					<button
						type="button"
						onClick={() => onCreateFile("")}
						title="Root Note"
						className="p-1 hover:bg-bg-tertiary rounded text-text-secondary"
					>
						<Plus size={16} />
					</button>
				</div>
			</div>
			<div className="flex-1 overflow-y-auto">
				{fileTree.map((node) => (
					<FileTreeNode
						key={node.path}
						node={node}
						selected={currentFile}
						onSelect={onSelectFile}
						level={1}
						onContextMenu={handleContextMenu}
					/>
				))}
				{fileTree.length === 0 && (
					<div className="p-4 text-xs text-text-tertiary text-center">
						No notes found. Create one!
					</div>
				)}
			</div>

			{contextMenu && (
				<NorunoContextMenu
					x={contextMenu.x}
					y={contextMenu.y}
					items={getContextMenuItems(contextMenu.node)}
					onClose={handleCloseContextMenu}
				/>
			)}
		</div>
	);
};

export default NotesSidebar;
