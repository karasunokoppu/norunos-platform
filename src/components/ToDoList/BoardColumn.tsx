import { useDroppable } from "@dnd-kit/core";
import {
	SortableContext,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type React from "react";
import type { Task, TaskGroup } from "../../type";
import SortableTaskCard from "./SortableTaskCard";

interface BoardColumnProps {
	group: TaskGroup;
	tasks: Task[];
	onRefresh: () => void;
	taskGroups: TaskGroup[];
}

const BoardColumn: React.FC<BoardColumnProps> = ({
	group,
	tasks,
	onRefresh,
	taskGroups,
}) => {
	const { setNodeRef, isOver } = useDroppable({
		id: group.id,
	});

	const pendingTasks = tasks.filter((t) => !t.completed);
	const completedTasks = tasks.filter((t) => t.completed);

	return (
		<div
			ref={setNodeRef}
			className={`flex flex-col min-w-[320px] w-80 rounded-lg mr-4 h-full max-h-full border shadow-sm flex-shrink-0 transition-colors duration-200
                ${
									isOver
										? "bg-bg-tertiary border-accent-secondary ring-2 ring-accent-secondary/30"
										: "bg-bg-tertiary/30 border-border-primary"
								}
            `}
		>
			{/* Header */}
			<div
				className={`p-3 flex items-center justify-between border-b rounded-t-lg transition-colors duration-200 ${
					isOver
						? "border-accent-secondary/50 bg-bg-tertiary"
						: "border-border-primary bg-bg-tertiary"
				}`}
			>
				<div className="font-bold text-text-primary truncate">{group.name}</div>
				<span className="text-sm text-text-secondary bg-bg-secondary px-2 py-0.5 rounded-full">
					{tasks.length}
				</span>
			</div>

			{/* Droppable Area */}
			<div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-bg-tertiary scrollbar-track-transparent">
				<SortableContext
					items={tasks.map((t) => t.id)}
					strategy={verticalListSortingStrategy}
				>
					<div className="space-y-2 min-h-[50px]">
						{pendingTasks.map((task) => (
							<SortableTaskCard
								key={task.id}
								task={task}
								onRefresh={onRefresh}
								taskGroups={taskGroups}
							/>
						))}
					</div>

					{completedTasks.length > 0 && (
						<div className="mt-4">
							<details className="group">
								<summary className="flex items-center cursor-pointer py-1 px-2 rounded hover:bg-bg-tertiary/50 text-text-secondary select-none text-sm font-medium mb-2">
									<svg
										className="w-4 h-4 mr-1 transform transition-transform group-open:rotate-90"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
										aria-label="Toggle Details"
										role="img"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M9 5l7 7-7 7"
										/>
									</svg>
									Completed ({completedTasks.length})
								</summary>
								<div className="space-y-2 pl-2 border-l border-border-secondary/30 ml-2">
									{completedTasks.map((task) => (
										<SortableTaskCard
											key={task.id}
											task={task}
											onRefresh={onRefresh}
											taskGroups={taskGroups}
										/>
									))}
								</div>
							</details>
						</div>
					)}
				</SortableContext>
			</div>
		</div>
	);
};

export default BoardColumn;
