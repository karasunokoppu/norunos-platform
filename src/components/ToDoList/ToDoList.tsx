import React from "react";
import { Task } from "../../type";
import TaskInput from "./TaskInput";
import TaskList from "./TaskList";

interface ToDoListViewProps {
	tasks: Task[];
	onCreateTask: (task: Task) => void;
	onUpdateTask: (task: Task) => void;
	onDeleteTask: (task: Task) => void;
	onUpdateTasks: (tasks: Task[]) => void;
}

const ToDoListView: React.FC<ToDoListViewProps> = ({ tasks, onCreateTask, onUpdateTask, onDeleteTask, onUpdateTasks }) => {
	return (
		<div className="h-full w-full flex justify-center items-start py-8">
			<div className="h-full w-full max-w-4xl flex flex-col justify-start items-center space-y-6">
				<TaskInput onCreateTask={onCreateTask} />
				<TaskList tasks={tasks} onUpdateTask={onUpdateTask} onDeleteTask={onDeleteTask} onUpdateTasks={onUpdateTasks} />
			</div>
		</div>
	);
};

export default ToDoListView;
