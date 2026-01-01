import React, { useState } from "react";
import { Subtask } from "../../type";
// Since we moved UUID to backend, we better not import uuid here... 
// But creating subtask locally needs an ID. 
// Actually, backend generates IDs for Tasks. For Subtasks, do we generate locally?
// The user requirement "Refactor UUID generation to backend" was for TASKS. 
// Subtasks are part of Task update. If I generate ID locally, it's fine for now, or I can let backend ignore it and generate if empty.
// But React needs keys.
// I will use a simple random string or keep uuid if it's already used in project (it was removed?). `uuid` package might still be there.
// Checking imports... `uuid` might be removed from frontend.
// I will use a simple utility for frontend temporary ID if needed.

interface SubTaskCardProps {
    subtasks: Subtask[];
    isOpened: boolean;
    onUpdate: (subtasks: Subtask[]) => void;
}

const SubTaskCard: React.FC<SubTaskCardProps> = ({
    subtasks,
    isOpened,
    onUpdate,
}) => {
    const [newSubtaskDesc, setNewSubtaskDesc] = useState("");

    const handleAdd = () => {
        if (!newSubtaskDesc.trim()) return;
        const newSubtask: Subtask = {
            id: crypto.randomUUID(), // Use standard Web Crypto API
            description: newSubtaskDesc,
            completed: false,
            order: subtasks.length,
            created_at: new Date().toISOString(),
        };
        onUpdate([...subtasks, newSubtask]);
        setNewSubtaskDesc("");
    };

    const handleToggle = (id: string) => {
        const updated = subtasks.map(s => s.id === id ? { ...s, completed: !s.completed } : s);
        onUpdate(updated);
    };

    const handleDelete = (id: string) => {
        const updated = subtasks.filter(s => s.id !== id);
        onUpdate(updated);
    };

    const handleEdit = (id: string, desc: string) => {
        const updated = subtasks.map(s => s.id === id ? { ...s, description: desc } : s);
        onUpdate(updated);
    };

    if (!isOpened) return null;

    return (
        <div className="pl-8 pr-2 py-2 flex flex-col gap-2">
            {subtasks.map((subtask) => (
                <div key={subtask.id} className="flex flex-row items-center gap-2 group">
                    <input
                        type="checkbox"
                        checked={subtask.completed}
                        onChange={() => handleToggle(subtask.id)}
                        className="h-4 w-4"
                    />
                    <input
                        type="text"
                        value={subtask.description}
                        onChange={(e) => handleEdit(subtask.id, e.target.value)}
                        className="flex-1 bg-transparent border-none focus:ring-0 text-sm text-text-primary"
                    />
                    <button
                        onClick={() => handleDelete(subtask.id)}
                        className="opacity-0 group-hover:opacity-100 text-text-secondary hover:text-red-500 transition-opacity"
                    >
                        ×
                    </button>
                </div>
            ))}
            <div className="flex flex-row items-center gap-2 mt-2">
                <input
                    type="text"
                    value={newSubtaskDesc}
                    onChange={(e) => setNewSubtaskDesc(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                    placeholder="New subtask..."
                    className="flex-1 bg-bg-secondary border border-border-primary rounded px-2 py-1 text-sm text-text-primary focus:outline-none focus:border-accent-primary"
                />
                <button
                    onClick={handleAdd}
                    className="bg-bg-secondary text-text-primary px-3 py-1 rounded text-sm hover:bg-bg-hover"
                >
                    Add
                </button>
            </div>
        </div>
    );
};

export default SubTaskCard;