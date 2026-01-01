import React, { useState, useEffect } from "react";
import { Task, TaskGroup } from "../../type";
import TaskInput from "./TaskInput";
import TaskList from "./TaskList";
import TaskGroupSidebar from "./TaskGroupSidebar";
import { getTaskGroups } from "../../tauri/to_do_list_api";

interface ToDoListViewProps {
	tasks: Task[];
<<<<<<< HEAD
	onRefresh: () => void;
}

const ToDoListView: React.FC<ToDoListViewProps> = ({ tasks, onRefresh }) => {
	const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
	const [taskGroups, setTaskGroups] = useState<TaskGroup[]>([]);

	// Refresh groups when tasks change (might affect group counts or if we reload groups)
	const fetchGroups = () => {
		getTaskGroups().then(setTaskGroups).catch(console.error);
	};

	useEffect(() => {
		fetchGroups();
	}, [tasks]);

	const filteredTasks = selectedGroupId
		? tasks.filter(task => {
			const group = taskGroups.find(g => g.id === selectedGroupId);
			return group ? group.tasks.includes(task.id) : false;
		})
		: tasks;

	return (
		<div className="h-full w-full flex flex-row bg-bg-secondary">
			<TaskGroupSidebar
				selectedGroupId={selectedGroupId}
				onSelectGroup={setSelectedGroupId}
				groups={taskGroups}
				onRefreshGroups={fetchGroups}
			/>
			<div className="h-full flex-1 flex justify-center items-start py-8 overflow-y-auto">
				<div className="w-full max-w-4xl flex flex-col justify-start items-center space-y-6 px-4">
					<TaskInput onRefresh={onRefresh} taskGroups={taskGroups} />
					<TaskList tasks={filteredTasks} onRefresh={onRefresh} />
				</div>
=======
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
>>>>>>> 050c4bf92ad55825b52c8128619d1e1e296e04d2
			</div>
		</div>
	);
};

export default ToDoListView;
