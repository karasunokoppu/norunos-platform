import React, { useState } from "react";
import { FileNode } from "../../tauri/notes_api";
import { Folder, File, ChevronRight, ChevronDown, Plus, Edit2, Trash2, FolderPlus } from "lucide-react";

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
    onCreateFile: (parentPath: string) => void;
    onCreateFolder: (parentPath: string) => void;
    onDelete: (path: string) => void;
    onRename: (path: string) => void;
}> = ({ node, selected, onSelect, level, onCreateFile, onCreateFolder, onDelete, onRename }) => {
    const [isOpen, setIsOpen] = useState(false);
    const isSelected = selected === node.path;
    const paddingLeft = level * 10 + 4;

    const handleToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (node.is_dir) setIsOpen(!isOpen);
        else onSelect(node.path);
    };

    const handleContextAction = (e: React.MouseEvent, action: () => void) => {
        e.stopPropagation();
        action();
    };

    return (
        <div>
            <div
                className={`flex items-center p-1 cursor-pointer hover:bg-bg-hover text-sm group ${isSelected ? "bg-bg-active text-text-primary" : "text-text-secondary"}`}
                style={{ paddingLeft: `${paddingLeft}px` }}
                onClick={handleToggle}
            >
                {node.is_dir ? (
                    <span className="mr-1">{isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}</span>
                ) : (
                    <span className="mr-1 w-[14px]"></span>
                )}

                {node.is_dir ? <Folder size={14} className="mr-2 text-accent-secondary" /> : <File size={14} className="mr-2 text-text-tertiary" />}

                <span className="flex-1 truncate">{node.name}</span>

                <div className="hidden group-hover:flex gap-1 ml-2">
                    {node.is_dir && (
                        <>
                            <button onClick={(e) => handleContextAction(e, () => onCreateFile(node.path))} title="New Note"><Plus size={12} /></button>
                            <button onClick={(e) => handleContextAction(e, () => onCreateFolder(node.path))} title="New Folder"><FolderPlus size={12} /></button>
                        </>
                    )}
                    <button onClick={(e) => handleContextAction(e, () => onRename(node.path))} title="Rename"><Edit2 size={12} /></button>
                    <button onClick={(e) => handleContextAction(e, () => onDelete(node.path))} title="Delete" className="text-danger"><Trash2 size={12} /></button>
                </div>
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
                            onCreateFile={onCreateFile}
                            onCreateFolder={onCreateFolder}
                            onDelete={onDelete}
                            onRename={onRename}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

const NotesSidebar: React.FC<NotesSidebarProps> = ({ fileTree, onSelectFile, currentFile, onCreateFile, onCreateFolder, onDelete, onRename }) => {
    return (
        <div className="w-64 bg-bg-primary border-r border-border-primary flex flex-col h-full">
            <div className="p-2 border-b border-border-primary flex justify-between items-center text-text-primary font-bold text-sm">
                <span>Notes</span>
                <div className="flex gap-2">
                    <button onClick={() => onCreateFolder("")} title="Root Folder"><FolderPlus size={16} /></button>
                    <button onClick={() => onCreateFile("")} title="Root Note"><Plus size={16} /></button>
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
                        onCreateFile={onCreateFile}
                        onCreateFolder={onCreateFolder}
                        onDelete={onDelete}
                        onRename={onRename}
                    />
                ))}
                {fileTree.length === 0 && <div className="p-4 text-xs text-text-tertiary text-center">No notes found. Create one!</div>}
            </div>
        </div>
    );
};

export default NotesSidebar;
