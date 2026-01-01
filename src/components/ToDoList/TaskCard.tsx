import type React from "react";
import { Task } from "../../type";
import { useState } from "react";
import SubTaskCard from "./SubTaskCard";
import { updateTask, deleteTask } from "../../tauri/to_do_list_api";

interface TaskCardProps {
    task: Task;
    onRefresh: () => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onRefresh }) => {
    const [isOpened, setIsOpened] = useState(false);

    const handleToggleComplete = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const updatedTask = { ...task, completed: e.target.checked };
        try {
            await updateTask(updatedTask);
            onRefresh();
        } catch (error) {
            console.error("Failed to update task", error);
        }
    };

    const handleDelete = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm("Are you sure you want to delete this task?")) {
            try {
                await deleteTask(task);
                onRefresh();
            } catch (error) {
                console.error("Failed to delete task", error);
            }
        }
    };

    const handleSubtaskUpdate = async (subtasks: any[]) => {
        const updatedTask = { ...task, subtasks };
        try {
            await updateTask(updatedTask);
            onRefresh();
        } catch (error) {
            console.error("Failed to update task subtasks", error);
        }
    };

    return (
        <div className="w-full bg-bg-primary text-text-primary border-b border-border-primary">
            <div className="flex flex-row items-center p-2">
                <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={handleToggleComplete}
                    className="mr-3 h-5 w-5"
                />
                <div
                    onClick={() => setIsOpened(!isOpened)}
                    className="w-full px-2 flex flex-row justify-between"
                >
                    <div className="w-fit flex flex-row items-center gap-3">
                        <div className="flex flex-col">
                            <label className="font-medium">{task.description}</label>
                            <div className="flex flex-row gap-2 text-xs text-text-secondary">
                                <label>ID: {task.id.substring(0, 8)}...</label>
                            </div>
                        </div>
                    </div>
                    <div>
                        <div className="grid">
                            <label className="text-sm text-text-secondary">開始日:{task.start_datetime?.split('T')[0]}</label>
                            <label className="text-sm text-text-secondary">終了日:{task.end_datetime?.split('T')[0]}</label>
                        </div>
                    </div>
                </div>
                <button
                    onClick={handleDelete}
                    className="ml-2 px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 focus:outline-none"
                >
                    削除
                </button>
            </div>
            {isOpened && (
                <SubTaskCard
                    subtasks={task.subtasks}
                    isOpened={isOpened}
                    onUpdate={handleSubtaskUpdate}
                />
            )}

        </div>
    );
};

export default TaskCard;
