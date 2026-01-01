import type React from "react";
import { Task } from "../../type";
import SubTaskCard from "./SubTaskCard";
import { updateTask, deleteTask } from "../../tauri/to_do_list_api";
import NorunoContextMenu, { ContextMenuItem } from "../../ui/NorunoContextMenu";
import { useState } from "react";
import EditTaskDialog from "./EditTaskDialog";

interface TaskCardProps {
    task: Task;
    onRefresh: () => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onRefresh }) => {
    const [isOpened, setIsOpened] = useState(false);
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

    const handleToggleComplete = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const updatedTask = { ...task, completed: e.target.checked };
        try {
            await updateTask(updatedTask);
            onRefresh();
        } catch (error) {
            console.error("Failed to update task", error);
        }
    };

    const handleDelete = async (e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        if (confirm("Are you sure you want to delete this task?")) {
            try {
                await deleteTask(task);
                onRefresh();
            } catch (error) {
                console.error("Failed to delete task", error);
            }
        }
    }

    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY });
    };

    const handleEdit = () => {
        setIsEditDialogOpen(true);
    };

    const handleSaveEdit = async (updatedTask: Task) => {
        try {
            await updateTask(updatedTask);
            onRefresh();
        } catch (error) {
            console.error("Failed to update task details", error);
        }
    };

    const contextMenuItems: ContextMenuItem[] = [
        {
            label: "Edit",
            onClick: handleEdit,
        },
        {
            label: "Delete",
            onClick: () => handleDelete(),
            danger: true,
        },
    ];;

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
        <div
            className="w-full bg-bg-primary text-text-primary border-b border-border-primary"
            onContextMenu={handleContextMenu}
        >
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
                    onClick={(e) => handleDelete(e)}
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

            {contextMenu && (
                <NorunoContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    items={contextMenuItems}
                    onClose={() => setContextMenu(null)}
                />
            )}

            <EditTaskDialog
                task={task}
                isOpen={isEditDialogOpen}
                onClose={() => setIsEditDialogOpen(false)}
                onSave={handleSaveEdit}
            />

        </div>
    );
};

export default TaskCard;
