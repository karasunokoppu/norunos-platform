import type React from "react";
import { Task } from "../../type";
import { useState } from "react";
import SubTaskCard from "./SubTaskCard";

interface TaskCardProps {
	task: Task;
	onUpdateTask: (task: Task) => void;
	onDeleteTask: (task: Task) => void;
	onUpdateTasks: (tasks: Task[]) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onUpdateTask, onDeleteTask, onUpdateTasks }) => {
    const [isOpened, setIsOpened] = useState(false);

	return (
        <div className="w-full bg-bg-primary text-text-primary">
            <div className="flex flex-row">
                <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => {
                        const updatedTask = { ...task, completed: !task.completed };
                        onUpdateTask(updatedTask);
                    }}
                />
                <div 
                onClick={()=>setIsOpened(!isOpened)}
                className="w-full px-2 flex flex-row justify-between"
                >
                    <div className="w-fit flex flex-row items-center gap-3">
                        <div className="flex flex-col">
                            <label>{task.description}</label>
                            <label>{task.group} : {task.id}</label>
                        </div>
                    </div>
                    <div>
                        <div className="grid">
                            <label>開始日:{task.start_date}</label>
                            <label>終了日:{task.end_date}</label>
                        </div>
                    </div>
                </div>
                <button
                    onClick={() => onDeleteTask(task)}
                    className="px-2 py-1 bg-red-500 text-white rounded"
                >
                    削除
                </button>
            </div>
                <SubTaskCard 
                subtasks={task.subtasks}
                isOpened={isOpened}
                taskId={task.id}
                onUpdateTasks={onUpdateTasks}
                />
        </div>
    );
};

export default TaskCard;
