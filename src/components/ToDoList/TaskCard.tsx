import type React from "react";
import { useState } from "react";
import { useToast } from "../../context/ToastContext";
import { deleteTask, updateTask } from "../../tauri/to_do_list_api";
import type { Task, TaskGroup } from "../../type";
import NorunoContextMenu, {
	type ContextMenuItem,
} from "../../ui/NorunoContextMenu";
import EditTaskDialog from "./EditTaskDialog";
import SubTaskCard from "./SubTaskCard";

interface TaskCardProps {
	task: Task;
	onRefresh: () => void;
	taskGroups: TaskGroup[];
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onRefresh, taskGroups }) => {
	const [isOpened, setIsOpened] = useState(false);
	const [contextMenu, setContextMenu] = useState<{
		x: number;
		y: number;
	} | null>(null);
	const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
	const { showError, showSuccess } = useToast();

	const handleToggleComplete = async (
		e: React.ChangeEvent<HTMLInputElement>,
	) => {
		const updatedTask = { ...task, completed: e.target.checked };
		try {
			await updateTask(updatedTask);
			onRefresh();
		} catch (error) {
			console.error("Failed to update task", error);
			showError("タスクの更新に失敗しました");
		}
	};

	const handleDelete = async (e?: React.MouseEvent) => {
		if (e) e.stopPropagation();
		if (confirm("このタスクを削除しますか？")) {
			try {
				await deleteTask(task);
				onRefresh();
				showSuccess("タスクを削除しました");
			} catch (error) {
				console.error("Failed to delete task", error);
				showError("タスクの削除に失敗しました");
			}
		}
	};

	const handleContextMenu = (e: React.MouseEvent) => {
		e.preventDefault();
		setContextMenu({ x: e.clientX, y: e.clientY });
	};

	const handleEdit = () => {
		setIsEditDialogOpen(true);
	};

	const handleSaveEdit = async (updatedTask: Task) => {
		try {
			await updateTask(updatedTask);
			onRefresh();
			showSuccess("タスクを更新しました");
		} catch (error) {
			console.error("Failed to update task details", error);
			showError("タスクの更新に失敗しました");
		}
	};

	const contextMenuItems: ContextMenuItem[] = [
		{
			label: "編集",
			onClick: handleEdit,
		},
		{
			label: "削除",
			onClick: () => handleDelete(),
			danger: true,
		},
	];

	const handleSubtaskUpdate = async (subtasks: any[]) => {
		const updatedTask = { ...task, subtasks };
		try {
			await updateTask(updatedTask);
			onRefresh();
		} catch (error) {
			console.error("Failed to update task subtasks", error);
			showError("サブタスクの更新に失敗しました");
		}
	};

	return (
		<div
			className="w-full bg-bg-primary text-text-primary rounded-md shadow-sm border border-border-primary hover:shadow-md hover:border-accent-secondary/50 transition-all duration-200 relative group/card"
			onContextMenu={handleContextMenu}
		>
			<div className="flex flex-row items-start p-3 gap-3">
				<input
					type="checkbox"
					checked={task.completed}
					onChange={handleToggleComplete}
					className="mt-1 h-4 w-4 rounded border-border-secondary text-accent-secondary focus:ring-accent-secondary cursor-pointer flex-shrink-0"
				/>

				<div
					className="flex-1 flex flex-col gap-2 min-w-0"
					onClick={() => setIsOpened(!isOpened)}
				>
					{/* Description */}
					<div className="w-full">
						<label
							className={`text-sm font-medium leading-relaxed break-words block cursor-pointer ${task.completed ? "text-text-disabled line-through" : "text-text-primary"}`}
						>
							{task.description}
						</label>
					</div>

					{/* Metadata Badges */}
					<div className="flex flex-wrap gap-2 items-center">
						{/* Subtasks Badge */}
						{task.subtasks && task.subtasks.length > 0 && (
							<div
								className={`flex items-center text-xs px-1.5 py-0.5 rounded border ${
									task.subtasks.every((s) => s.completed)
										? "bg-accent-light text-accent-secondary border-accent-secondary/20"
										: "bg-bg-tertiary text-text-secondary border-transparent"
								}`}
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="12"
									height="12"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round"
									className="mr-1"
									aria-label="Subtasks"
								>
									<path d="M9 11l3 3L22 4" />
									<path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
								</svg>
								{task.subtasks.filter((s) => s.completed).length}/
								{task.subtasks.length}
							</div>
						)}

						{/* Date Badges */}
						{(task.start_datetime || task.end_datetime) && (
							<div className="flex items-center gap-1">
								{task.end_datetime && (
									<div
										className={`flex items-center text-xs px-1.5 py-0.5 rounded border ${
											new Date(task.end_datetime) < new Date() &&
											!task.completed
												? "bg-red-500/10 text-red-400 border-red-500/20"
												: "bg-bg-tertiary text-text-secondary border-transparent"
										}`}
									>
										<svg
											xmlns="http://www.w3.org/2000/svg"
											width="12"
											height="12"
											viewBox="0 0 24 24"
											fill="none"
											stroke="currentColor"
											strokeWidth="2"
											strokeLinecap="round"
											strokeLinejoin="round"
											className="mr-1"
											aria-label="Due Date"
										>
											<rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
											<line x1="16" x2="16" y1="2" y2="6" />
											<line x1="8" x2="8" y1="2" y2="6" />
											<line x1="3" x2="21" y1="10" y2="10" />
										</svg>
										{new Date(task.end_datetime).toLocaleDateString(undefined, {
											month: "numeric",
											day: "numeric",
										})}
									</div>
								)}
							</div>
						)}
					</div>
				</div>
			</div>

			{/* Subtasks Expansion */}
			{isOpened && (
				<div className="px-3 pb-3 pt-0 animate-in slide-in-from-top-1 duration-200">
					<div className="border-t border-border-primary/50 my-2"></div>
					<SubTaskCard
						subtasks={task.subtasks}
						isOpened={isOpened}
						onUpdate={handleSubtaskUpdate}
					/>
				</div>
			)}

			{contextMenu && (
				<NorunoContextMenu
					x={contextMenu.x}
					y={contextMenu.y}
					items={contextMenuItems}
					onClose={() => setContextMenu(null)}
				/>
			)}

			<EditTaskDialog
				task={task}
				isOpen={isEditDialogOpen}
				onClose={() => setIsEditDialogOpen(false)}
				onSave={handleSaveEdit}
				taskGroups={taskGroups}
			/>
		</div>
	);
};

export default TaskCard;
