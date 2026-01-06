import { ChevronDown, ChevronRight, Folder } from "lucide-react";
import type React from "react";
import { useState } from "react";
import type { FileNode } from "../../tauri/notes_api";

interface FolderSelectDialogProps {
	isOpen: boolean;
	folders: FileNode[]; // Should only contain folders or we filter here
	onSelect: (path: string) => void;
	onCancel: () => void;
}

const FolderTreeNode: React.FC<{
	node: FileNode;
	selectedPath: string | null;
	onSelect: (path: string) => void;
	level: number;
}> = ({ node, selectedPath, onSelect, level }) => {
	const [isOpen, setIsOpen] = useState(true);
	const isSelected = selectedPath === node.path;
	const paddingLeft = level * 10 + 4;

	const handleToggle = (e: React.MouseEvent) => {
		e.stopPropagation();
		setIsOpen(!isOpen);
	};

	const handleClick = () => {
		onSelect(node.path);
	};

	if (!node.is_dir) return null;

	return (
		<div>
			<div
				className={`flex items-center p-2 cursor-pointer hover:bg-bg-hover text-sm ${isSelected ? "bg-accent-primary text-white" : "text-text-primary"}`}
				style={{ paddingLeft: `${paddingLeft}px` }}
				onClick={handleClick}
			>
				<span className="mr-1 cursor-pointer" onClick={handleToggle}>
					{isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
				</span>
				<Folder
					size={14}
					className={`mr-2 ${isSelected ? "text-white" : "text-accent-secondary"}`}
				/>
				<span className="truncate">{node.name}</span>
			</div>
			{isOpen && node.children && (
				<div>
					{node.children.map((child) => (
						<FolderTreeNode
							key={child.path}
							node={child}
							selectedPath={selectedPath}
							onSelect={onSelect}
							level={level + 1}
						/>
					))}
				</div>
			)}
		</div>
	);
};

const FolderSelectDialog: React.FC<FolderSelectDialogProps> = ({
	isOpen,
	folders,
	onSelect,
	onCancel,
}) => {
	const [selectedPath, setSelectedPath] = useState<string>(""); // Default to root

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
			<div className="bg-bg-primary border border-border-primary w-96 max-h-[80vh] flex flex-col rounded shadow-lg">
				<div className="p-4 border-b border-border-primary">
					<h3 className="text-lg font-bold text-text-primary">Select Folder</h3>
				</div>

				<div className="flex-1 overflow-y-auto p-2">
					{/* Root Option */}
					<div
						className={`flex items-center p-2 cursor-pointer hover:bg-bg-hover text-sm ${selectedPath === "" ? "bg-accent-primary text-white" : "text-text-primary"}`}
						onClick={() => setSelectedPath("")}
					>
						<Folder
							size={14}
							className={`mr-2 ${selectedPath === "" ? "text-white" : "text-accent-secondary"}`}
						/>
						<span>Root (/)</span>
					</div>

					{folders.map((node) => (
						<FolderTreeNode
							key={node.path}
							node={node}
							selectedPath={selectedPath}
							onSelect={setSelectedPath}
							level={1}
						/>
					))}
				</div>

				<div className="p-4 border-t border-border-primary flex justify-end gap-2 bg-bg-secondary">
					<button
						type="button"
						onClick={onCancel}
						className="px-4 py-2 text-sm text-text-primary hover:bg-bg-hover rounded"
					>
						Cancel
					</button>

					<button
						type="button"
						onClick={() => onSelect(selectedPath)}
						className="px-4 py-2 text-sm bg-accent-secondary text-white hover:bg-opacity-80 rounded"
					>
						Select
					</button>
				</div>
			</div>
		</div>
	);
};

export default FolderSelectDialog;
