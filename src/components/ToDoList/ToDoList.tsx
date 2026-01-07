import {
	closestCenter,
	DndContext,
	type DragEndEvent,
	DragOverlay,
	type DragStartEvent,
	type DropAnimation,
	defaultDropAnimationSideEffects,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import type React from "react";
import { useEffect, useState } from "react";
import { useToast } from "../../context/ToastContext";
import {
	createTaskGroup,
	getTaskGroups,
	moveTaskToGroup,
} from "../../tauri/to_do_list_api";
import type { Task, TaskGroup } from "../../type";
import BoardColumn from "./BoardColumn";
import TaskCard from "./TaskCard"; // For DragOverlay
import TaskInput from "./TaskInput";
import { LoadingSpinner } from "../UI/LoadingSpinner";

interface ToDoListViewProps {
	tasks: Task[];
	onRefresh: () => void;
}

const ToDoListView: React.FC<ToDoListViewProps> = ({ tasks, onRefresh }) => {
	const [taskGroups, setTaskGroups] = useState<TaskGroup[]>([]);
	const [activeId, setActiveId] = useState<string | null>(null);
	const [isCreatingGroup, setIsCreatingGroup] = useState(false);
	const [newGroupName, setNewGroupName] = useState("");
	const [isLoading, setIsLoading] = useState(true);
	const { showError, showSuccess } = useToast();

	const fetchGroups = () => {
		setIsLoading(true);
		getTaskGroups()
			.then(setTaskGroups)
			.catch((e) => {
				console.error(e);
				showError("グループの取得に失敗しました");
			})
			.finally(() => setIsLoading(false));
	};

	useEffect(() => {
		fetchGroups();
	}, [tasks]);

	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: {
				distance: 5, // Requires 5px movement to start drag, prevents accidental drags
			},
		}),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		}),
	);

	const dropAnimation: DropAnimation = {
		sideEffects: defaultDropAnimationSideEffects({
			styles: {
				active: {
					opacity: "0.4",
				},
			},
		}),
	};

	const handleDragStart = (event: DragStartEvent) => {
		setActiveId(event.active.id as string);
	};

	const handleDragEnd = async (event: DragEndEvent) => {
		const { active, over } = event;
		setActiveId(null);

		if (!over) return;

		const activeTaskId = active.id as string;
		const overId = over.id as string;

		// Find source group
		let sourceGroup = taskGroups.find((g) => g.tasks.includes(activeTaskId));
		// Check unassigned if not found in groups
		if (!sourceGroup) {
			const assignedTaskIds = new Set(taskGroups.flatMap((g) => g.tasks));
			if (!assignedTaskIds.has(activeTaskId)) {
				sourceGroup = {
					id: "unassigned",
					name: "Unassigned",
					tasks: [],
					created_at: "",
				};
			}
		}

		if (!sourceGroup) return;

		// Find target group
		// If over.id is a group ID (dropped on column)
		let targetGroup = taskGroups.find((g) => g.id === overId);

		// If not dropped on a group directly, maybe dropped on a task?
		if (!targetGroup) {
			targetGroup = taskGroups.find((g) => g.tasks.includes(overId));
		}

		// Cannot drop into "unassigned" (no group ID to move to)
		if (!targetGroup && overId === "unassigned") {
			return;
		}

		if (targetGroup && sourceGroup.id !== targetGroup.id) {
			// Moved to a different group
			try {
				await moveTaskToGroup(activeTaskId, targetGroup.id);
				onRefresh(); // Refresh to update backend state
			} catch (e) {
				console.error("Failed to move task", e);
				showError("タスクの移動に失敗しました");
			}
		}
	};

	const handleCreateGroup = async () => {
		if (!newGroupName.trim()) return;
		try {
			await createTaskGroup(newGroupName);
			setNewGroupName("");
			setIsCreatingGroup(false);
			fetchGroups(); // Refresh groups immediately
			showSuccess("グループを作成しました");
		} catch (e) {
			console.error("Failed to create group", e);
			showError("グループの作成に失敗しました");
		}
	};

	// Helper to get task object for overlay
	const activeTask = tasks.find((t) => t.id === activeId);

	// Calculate unassigned tasks
	const assignedTaskIds = new Set(taskGroups.flatMap((g) => g.tasks));
	const unassignedTasks = tasks.filter((t) => !assignedTaskIds.has(t.id));

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
							{unassignedTasks.length > 0 && (
								<BoardColumn
									group={{
										id: "unassigned",
										name: "Unassigned",
										tasks: [],
										created_at: "",
									}}
									tasks={unassignedTasks}
									onRefresh={onRefresh}
									taskGroups={taskGroups}
								/>
							)}

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
