import React from "react";
import { Task, TaskGroup } from "../../type";
import TaskCard from "./TaskCard";

interface TaskListProps {
	tasks: Task[];
	onRefresh: () => void;
	taskGroups: TaskGroup[];
}

const TaskList: React.FC<TaskListProps> = ({ tasks, onRefresh, taskGroups }) => {
	const pendingTasks = tasks.filter(t => !t.completed);
	const completedTasks = tasks.filter(t => t.completed);

	return (
		<div className="w-full space-y-6">
			<div className="space-y-2">
				{pendingTasks.map((task: Task) => (
					<TaskCard key={task.id} task={task} onRefresh={onRefresh} taskGroups={taskGroups} />
				))}
			</div>

			{completedTasks.length > 0 && (
				<details className="w-full group">
					<summary className="cursor-pointer py-2 px-4 rounded bg-bg-tertiary text-text-secondary hover:text-text-primary font-medium select-none flex items-center">
						<span className="mr-2 transform group-open:rotate-90 transition-transform">▶</span>
						Completed Tasks ({completedTasks.length})
					</summary>
					<div className="mt-2 space-y-2 pl-4 border-l-2 border-border-primary">
						{completedTasks.map((task: Task) => (
							<TaskCard key={task.id} task={task} onRefresh={onRefresh} taskGroups={taskGroups} />
						))}
					</div>
				</details>
			)}
		</div>
	);
};

export default TaskList;
