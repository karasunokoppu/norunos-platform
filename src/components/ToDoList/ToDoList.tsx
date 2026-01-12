import {
	closestCenter,
	DndContext,
	DragOverlay,
} from "@dnd-kit/core";
import type React from "react";
import { useState } from "react";
import type { Task } from "../../type";
import BoardColumn from "./BoardColumn";
import TaskCard from "./TaskCard"; // For DragOverlay
import TaskInput from "./TaskInput";
import { LoadingSpinner } from "../UI/LoadingSpinner";
import { useKanbanDrag } from "./hooks/useKanbanDrag";
import { useTaskGroups } from "./hooks/useTaskGroups";

interface ToDoListViewProps {
	tasks: Task[];
	onRefresh: () => void;
}

const ToDoListView: React.FC<ToDoListViewProps> = ({ tasks, onRefresh }) => {
	const { taskGroups, isLoading, createTaskGroup } = useTaskGroups(tasks);
	const { sensors, activeId, handleDragStart, handleDragEnd, dropAnimation } = useKanbanDrag({
		taskGroups,
		onRefresh,
	});

	const [isCreatingGroup, setIsCreatingGroup] = useState(false);
	const [newGroupName, setNewGroupName] = useState("");

	const handleCreateGroup = async () => {
		const success = await createTaskGroup(newGroupName);
		if (success) {
			setNewGroupName("");
			setIsCreatingGroup(false);
		}
	};

	// Helper to get task object for overlay
	const activeTask = tasks.find((t) => t.id === activeId);

	return (
		<div className="h-full w-full flex flex-col bg-bg-secondary p-4 overflow-hidden">
			{/* Task Input Area */}
			<div className="w-full max-w-4xl mx-auto mb-6 shrink-0">
				<TaskInput onRefresh={onRefresh} taskGroups={taskGroups} />
			</div>

			{isLoading ? (
				<LoadingSpinner size="lg" className="flex-1" />
			) : (
				/* Kanban Board Area */
				<DndContext
					sensors={sensors}
					collisionDetection={closestCenter}
					onDragStart={handleDragStart}
					onDragEnd={handleDragEnd}
				>
					<div className="flex-1 overflow-x-auto overflow-y-hidden">
						<div className="flex h-full pb-4 items-start gap-4">
							{taskGroups.map((group) => {
								const groupTasks = tasks.filter((t) =>
									group.tasks.includes(t.id),
								);
								return (
									<BoardColumn
										key={group.id}
										group={group}
										tasks={groupTasks}
										onRefresh={onRefresh}
										taskGroups={taskGroups}
									/>
								);
							})}

							{/* Add Group Button/Form */}
							<div
								className={`w-80 min-w-[320px] bg-bg-tertiary/30 rounded-lg p-2 flex-shrink-0 border-2 border-dashed border-border-primary flex flex-col justify-center items-center h-24 hover:bg-bg-tertiary transition-colors cursor-pointer ${isCreatingGroup ? "h-auto cursor-default" : ""}`}
								onClick={() => !isCreatingGroup && setIsCreatingGroup(true)}
							>
								{isCreatingGroup ? (
									<div className="w-full p-2 space-y-2">
										<input
											autoFocus
											className="w-full p-2 rounded border border-border-primary bg-bg-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-secondary"
											placeholder="グループ名"
											value={newGroupName}
											onChange={(e) => setNewGroupName(e.target.value)}
											onKeyDown={(e) => {
												if (e.key === "Enter") handleCreateGroup();
											}}
											onClick={(e) => e.stopPropagation()}
										/>
										<div className="flex gap-2">
											<button
												onClick={(e) => {
													e.stopPropagation();
													handleCreateGroup();
												}}
												className="bg-accent-secondary text-text-on-accent px-3 py-1 rounded text-sm hover:bg-accent-hover"
											>
												追加
											</button>
											<button
												onClick={(e) => {
													e.stopPropagation();
													setIsCreatingGroup(false);
												}}
												className="text-text-secondary text-sm hover:text-text-primary"
											>
												キャンセル
											</button>
										</div>
									</div>
								) : (
									<span className="text-text-secondary font-medium">
										+ 新しいリストを追加
									</span>
								)}
							</div>
						</div>
					</div>

					<DragOverlay dropAnimation={dropAnimation}>
						{activeTask ? (
							<div className="transform rotate-2 scale-105 opacity-95 cursor-grabbing shadow-2xl rounded-md ring-2 ring-accent-secondary ring-opacity-50">
								<TaskCard
									task={activeTask}
									onRefresh={() => { }}
									taskGroups={taskGroups}
								/>
							</div>
						) : null}
					</DragOverlay>
				</DndContext>
			)}
		</div>
	);
};

export default ToDoListView;
