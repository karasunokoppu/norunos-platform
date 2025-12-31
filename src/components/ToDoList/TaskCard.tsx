import type React from "react";
import { Task } from "../../type";
import { useState } from "react";
import SubTaskCard from "./SubTaskCard";

interface TaskCardProps {
	task: Task;
}

const TaskCard: React.FC<TaskCardProps> = ({task}) => {
    const [isOpened, setIsOpened] = useState(false);

	return (
        <div className="w-full bg-bg-primary text-text-primary">
            <div className="flex flex-row">
                <input type="checkbox" checked={task.completed} />
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
            </div>
            {task.subtasks.length != 0 ? (
                <SubTaskCard 
                subtasks={task.subtasks}
                isOpened={isOpened}
                />
            ) : (
                <div>-</div>
            )}
            
        </div>
    );
};

export default TaskCard;
