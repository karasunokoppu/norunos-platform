import React, { useState, useEffect } from "react";
import { Task, TaskGroup } from "../../type";
import TaskInput from "./TaskInput";
import TaskList from "./TaskList";
import TaskGroupSidebar from "./TaskGroupSidebar";
import { getTaskGroups } from "../../tauri/to_do_list_api";

interface ToDoListViewProps {
	tasks: Task[];
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
			</div>
		</div>
	);
};

export default ToDoListView;
