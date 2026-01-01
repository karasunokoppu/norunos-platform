import React, { useState, useEffect } from "react";
import { TaskGroup } from "../../type";
import {
    createTaskGroup,
    updateTaskGroup,
    deleteTaskGroup,
} from "../../tauri/to_do_list_api";

interface TaskGroupSidebarProps {
    onSelectGroup: (groupId: string | null) => void;
    selectedGroupId: string | null;
    groups: TaskGroup[];
    onRefreshGroups: () => void;
}

const TaskGroupSidebar: React.FC<TaskGroupSidebarProps> = ({
    onSelectGroup,
    selectedGroupId,
    groups,
    onRefreshGroups,
}) => {
    // const [groups, setGroups] = useState<TaskGroup[]>([]); // Removed internal state
    const [isCreating, setIsCreating] = useState(false);
    const [newGroupName, setNewGroupName] = useState("");
    const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
    const [editingName, setEditingName] = useState("");

    // const fetchGroups = async () => { ... } // Removed
    // useEffect(() => { fetchGroups(); }, []); // Removed

    const handleCreate = async () => {
        if (!newGroupName.trim()) return;
        try {
            await createTaskGroup(newGroupName);
            setNewGroupName("");
            setIsCreating(false);
            onRefreshGroups();
        } catch (e) {
            console.error("Failed to create group", e);
        }
    };

    const handleUpdate = async (group: TaskGroup) => {
        if (!editingName.trim()) return;
        try {
            const updatedGroup = { ...group, name: editingName };
            await updateTaskGroup(updatedGroup);
            setEditingGroupId(null);
            onRefreshGroups();
        } catch (e) {
            console.error("Failed to update group", e);
        }
    };

    const handleDelete = async (group: TaskGroup, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm(`Delete group "${group.name}"?`)) {
            try {
                await deleteTaskGroup(group);
                if (selectedGroupId === group.id) onSelectGroup(null);
                onRefreshGroups();
            } catch (e) {
                console.error("Failed to delete group", e);
            }
        }
    };

    return (
        <div className="w-64 bg-bg-primary h-full border-r border-border-primary flex flex-col p-4">
            <h3 className="text-lg font-bold text-text-primary mb-4">Groups</h3>

            <div
                className={`p-2 rounded cursor-pointer mb-2 ${selectedGroupId === null
                    ? "bg-accent-secondary text-text-on-accent"
                    : "text-text-primary hover:bg-bg-secondary"
                    }`}
                onClick={() => onSelectGroup(null)}
            >
                All Tasks
            </div>

            <div className="flex-1 overflow-y-auto space-y-1">
                {groups.map((group) => (
                    <div
                        key={group.id}
                        className={`p-2 rounded cursor-pointer flex justify-between items-center group ${selectedGroupId === group.id
                            ? "bg-accent-secondary text-text-on-accent"
                            : "text-text-primary hover:bg-bg-secondary"
                            }`}
                        onClick={() => onSelectGroup(group.id)}
                    >
                        {editingGroupId === group.id ? (
                            <input
                                type="text"
                                value={editingName}
                                onChange={(e) => setEditingName(e.target.value)}
                                onBlur={() => handleUpdate(group)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") handleUpdate(group);
                                }}
                                autoFocus
                                className="bg-bg-secondary text-text-primary px-1 rounded w-full"
                                onClick={(e) => e.stopPropagation()}
                            />
                        ) : (
                            <>
                                <span
                                    onDoubleClick={() => {
                                        setEditingGroupId(group.id);
                                        setEditingName(group.name);
                                    }}
                                    className="flex-1 truncate"
                                >
                                    {group.name}
                                </span>
                                <button
                                    className="hidden group-hover:block text-red-500 hover:text-red-700 ml-2"
                                    onClick={(e) => handleDelete(group, e)}
                                >
                                    ×
                                </button>
                            </>
                        )}
                    </div>
                ))}
            </div>

            {isCreating ? (
                <div className="mt-4">
                    <input
                        type="text"
                        value={newGroupName}
                        onChange={(e) => setNewGroupName(e.target.value)}
                        className="w-full bg-bg-secondary text-text-primary border border-border-primary rounded px-2 py-1 mb-2"
                        placeholder="Group Name"
                        autoFocus
                    />
                    <div className="flex space-x-2">
                        <button
                            onClick={handleCreate}
                            className="bg-accent-primary text-text-on-accent px-3 py-1 rounded text-sm"
                        >
                            Add
                        </button>
                        <button
                            onClick={() => setIsCreating(false)}
                            className="bg-bg-secondary text-text-primary px-3 py-1 rounded text-sm"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            ) : (
                <button
                    onClick={() => setIsCreating(true)}
                    className="mt-4 w-full bg-bg-secondary text-text-primary py-2 rounded border border-dashed border-border-primary hover:bg-bg-tertiary"
                >
                    + New Group
                </button>
            )}
        </div>
    );
};

export default TaskGroupSidebar;
