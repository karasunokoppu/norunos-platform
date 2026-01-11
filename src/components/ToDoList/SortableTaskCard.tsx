import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type React from "react";
import type { Task, TaskGroup } from "../../type";
import TaskCard from "./TaskCard";

interface SortableTaskCardProps {
	task: Task;
	onRefresh: () => void;
	taskGroups: TaskGroup[];
}

const SortableTaskCard: React.FC<SortableTaskCardProps> = (props) => {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id: props.task.id });

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.35 : 1,
	};

	return (
		<div ref={setNodeRef} style={style} {...attributes} {...listeners}>
			<TaskCard {...props} />
		</div>
	);
};

export default SortableTaskCard;
