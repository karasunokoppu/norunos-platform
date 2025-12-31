import React from "react";
import { Task } from "../../type";
import TaskInput from "./TaskInput";
import TaskList from "./TaskList";

interface ToDoListViewProps {
	tasks: Task[];
}

const ToDoListView: React.FC<ToDoListViewProps> = ({ tasks }) => {
	return (
		<div className="h-full w-full flex justify-center items-start py-8">
			<div className="h-full w-full max-w-4xl flex flex-col justify-start items-center space-y-6">
				<TaskInput />
				<TaskList tasks={tasks} />
			</div>
		</div>
	);
};

export default ToDoListView;
