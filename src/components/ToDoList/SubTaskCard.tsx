import React, { useState } from "react";
import { Subtask, Task } from "../../type";
import { addSubtask, updateSubtask } from "../../tauri/to_do_list_api";

interface SubTaskCardProps {
    subtasks: Subtask[];
    isOpened: boolean;
    taskId: string;
    onUpdateTasks: (tasks: Task[]) => void;
}

const SubTaskCard: React.FC<SubTaskCardProps> = ({
    subtasks,
    isOpened,
    taskId,
    onUpdateTasks,
}) => {
    const [newSubtaskDescription, setNewSubtaskDescription] = useState("");

    const handleAddSubtask = async () => {
        if (newSubtaskDescription.trim() === "") return;
        const newSubtask: Subtask = {
            id: "",
            description: newSubtaskDescription,
            completed: false,
        };
        try {
            const updatedTasks = await addSubtask(taskId, newSubtask);
            onUpdateTasks(updatedTasks);
            setNewSubtaskDescription("");
        } catch (error) {
            console.error("Failed to add subtask:", error);
        }
    };

    const handleUpdateSubtask = async (subtask: Subtask) => {
        try {
            const updatedTasks = await updateSubtask(subtask);
            onUpdateTasks(updatedTasks);
        } catch (error) {
            console.error("Failed to update subtask:", error);
        }
    };
    return(
        <div>
            {isOpened && (
                <div>
                    {subtasks.map((subtask: Subtask) => (
                    <div key={subtask.id}>
                        <input 
                            type="checkbox" 
                            checked={subtask.completed}
                            onChange={() => {
                                const updatedSubtask = { ...subtask, completed: !subtask.completed };
                                handleUpdateSubtask(updatedSubtask);
                            }}
                        />
                        <label>{subtask.description}</label>
                    </div>
                ))}
                    <div className="mt-2">
                        <input
                            type="text"
                            value={newSubtaskDescription}
                            onChange={(e) => setNewSubtaskDescription(e.target.value)}
                            placeholder="新しいサブタスクを追加"
                            className="border px-2 py-1 mr-2"
                        />
                        <button
                            onClick={handleAddSubtask}
                            className="px-2 py-1 bg-blue-500 text-white rounded"
                        >
                            追加
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default SubTaskCard;