import type React from "react";
import { useEffect, useState } from "react";
import { moveTaskToGroup } from "../../tauri/to_do_list_api";
import type { Task, TaskGroup } from "../../type";
import NorunoDatePicker from "../../ui/NorunoDatePicker";
import NorunoDropdown from "../../ui/NorunoDropdown";

interface EditTaskDialogProps {
	task: Task;
	isOpen: boolean;
	onClose: () => void;
	onSave: (updatedTask: Task) => void;
	taskGroups: TaskGroup[];
}

const EditTaskDialog: React.FC<EditTaskDialogProps> = ({
	task,
	isOpen,
	onClose,
	onSave,
	taskGroups,
}) => {
	const [description, setDescription] = useState(task.description);
	const [details, setDetails] = useState(task.details || "");
	// Format: "YYYY-MM-DD HH:mm" for internal state and DatePicker
	const formatToPicker = (isoString?: string) => {
		if (!isoString) return "";
		return isoString.replace("T", " ").substring(0, 16); // "YYYY-MM-DD HH:mm"
	};

	const [startDate, setStartDate] = useState(
		formatToPicker(task.start_datetime),
	);
	const [endDate, setEndDate] = useState(formatToPicker(task.end_datetime));
	const [isStartDatePickerOpen, setIsStartDatePickerOpen] = useState(false);
	const [isEndDatePickerOpen, setIsEndDatePickerOpen] = useState(false);
	const [selectedGroupId, setSelectedGroupId] = useState<string>("");
	const [initialGroupId, setInitialGroupId] = useState<string>("");

	useEffect(() => {
		if (isOpen) {
			setDescription(task.description);
			setDetails(task.details || "");
			setStartDate(formatToPicker(task.start_datetime));
			setEndDate(formatToPicker(task.end_datetime));

			// Find current group
			const currentGroup = taskGroups.find((g) => g.tasks.includes(task.id));
			if (currentGroup) {
				setSelectedGroupId(currentGroup.id);
				setInitialGroupId(currentGroup.id);
			}
		}
	}, [isOpen, task, taskGroups]);

	const handleSave = async () => {
		// Convert "YYYY-MM-DD HH:mm" (Local) to ISO 8601 with timezone (UTC) e.g. "2024-01-01T03:00:00.000Z"
		const formatToISO = (pickerDate: string) => {
			if (!pickerDate) return undefined;
			const date = new Date(pickerDate.replace(" ", "T"));
			if (isNaN(date.getTime())) return undefined; // Invalid date check
			return date.toISOString();
		};

		const updatedTask = {
			...task,
			description,
			details,
			start_datetime: formatToISO(startDate),
			end_datetime: formatToISO(endDate),
		};

		// Handle Group Move
		if (selectedGroupId && selectedGroupId !== initialGroupId) {
			try {
				await moveTaskToGroup(task.id, selectedGroupId);
			} catch (e) {
				console.error("Failed to move task to group", e);
				alert("Failed to move task group");
			}
		}

		onSave(updatedTask);
		onClose();
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
			<div className="bg-bg-primary p-6 rounded-lg shadow-xl w-96 border border-border-primary text-text-primary">
				<h3 className="text-lg font-bold mb-4">タスク詳細</h3>

				<div className="mb-4">
					<label className="block text-sm font-medium mb-1">タスク名</label>
					<input
						type="text"
						value={description}
						onChange={(e) => setDescription(e.target.value)}
						className="w-full bg-bg-secondary border border-border-primary rounded px-3 py-2 focus:outline-none focus:border-accent-primary"
					/>
				</div>

				<div className="mb-4">
					<label className="block text-sm font-medium mb-1">詳細</label>
					<textarea
						value={details}
						onChange={(e) => setDetails(e.target.value)}
						className="w-full bg-bg-secondary border border-border-primary rounded px-3 py-2 focus:outline-none focus:border-accent-primary min-h-[100px] resize-y"
					/>
				</div>

				{/* import NorunoDropdown from "../../ui/NorunoDropdown";

                // ... (existing imports, but remove line 4 moveTaskToGroup if not needed or keep it)
                // actually we need to add the import at the top, I'll use a larger block or separate edit if needed.
                // But wait, allow_multiple is false. I should do a cleaner replace.

                // Let's replace the whole file content block for imports + the usage area. */}

				<div className="mb-4">
					<label className="block text-sm font-medium mb-1">タスクグループ</label>
					<NorunoDropdown
						options={taskGroups.map((g) => ({ label: g.name, value: g.id }))}
						value={selectedGroupId}
						onChange={(value) => setSelectedGroupId(value)}
						placeholder="Select Group"
					/>
				</div>

				<div className="mb-4">
					<label className="block text-sm font-medium mb-1">開始日</label>
					<div
						className="w-full bg-bg-secondary border border-border-primary rounded px-3 py-2 cursor-pointer"
						onClick={() => setIsStartDatePickerOpen(true)}
					>
						{startDate || "Select Start Date"}
					</div>
					{isStartDatePickerOpen && (
						<NorunoDatePicker
							value={startDate}
							onChange={(date) => setStartDate(date)}
							onClose={() => setIsStartDatePickerOpen(false)}
						/>
					)}
				</div>

				<div className="mb-4">
					<label className="block text-sm font-medium mb-1">期限</label>
					<div
						className="w-full bg-bg-secondary border border-border-primary rounded px-3 py-2 cursor-pointer"
						onClick={() => setIsEndDatePickerOpen(true)}
					>
						{endDate || "Select End Date"}
					</div>
					{isEndDatePickerOpen && (
						<NorunoDatePicker
							value={endDate}
							onChange={(date) => setEndDate(date)}
							onClose={() => setIsEndDatePickerOpen(false)}
						/>
					)}
				</div>

				<div className="flex justify-end gap-2 mt-6">
					<button
						onClick={onClose}
						className="px-4 py-2 text-sm bg-bg-secondary hover:bg-bg-hover rounded"
					>
						Cancel
					</button>
					<button
						onClick={handleSave}
						className="px-4 py-2 text-sm bg-accent-secondary text-text-on-accent hover:bg-accent-secondary/90 rounded"
					>
						Save
					</button>
				</div>
			</div>
		</div>
	);
};

export default EditTaskDialog;
