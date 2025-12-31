import React from "react";
import { Task } from "../../type";
import TaskCard from "./TaskCard";

interface TaskListProps {
	tasks: Task[];
}

const TaskList: React.FC<TaskListProps> = ({ tasks }) => {
	return (
		<div className="w-full">
			{tasks.map((task: Task) => (
				<TaskCard task={task} />
			))}
		</div>
	);
};

export default TaskList;
