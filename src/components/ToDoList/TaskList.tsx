import React from "react";
import { Task } from "../../type";
import TaskCard from "./TaskCard";

interface TaskListProps {
	tasks: Task[];
	onUpdateTask: (task: Task) => void;
	onDeleteTask: (task: Task) => void;
}

const TaskList: React.FC<TaskListProps> = ({ tasks, onUpdateTask, onDeleteTask }) => {
	return (
		<div className="w-full">
			{tasks.map((task: Task) => (
				<TaskCard task={task} onUpdateTask={onUpdateTask} onDeleteTask={onDeleteTask} />
			))}
		</div>
	);
};

export default TaskList;
