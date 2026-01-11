import { useRef, useState } from "react";
import { useToast } from "../context/ToastContext";
import { updateTask } from "../tauri/to_do_list_api";
import type { Task } from "../type";

interface DragState {
    taskId: string;
    startX: number;
    originalStart: Date;
    originalEnd: Date;
    mode: "MOVE" | "RESIZE";
}

interface DragPreview {
    taskId: string;
    newStart: Date;
    newEnd: Date;
}

interface UseGanttDragOptions {
    pixelsPerDay: number;
    tasks: Task[];
    onRefresh?: () => void;
}

export const useGanttDrag = ({
    pixelsPerDay,
    tasks,
    onRefresh,
}: UseGanttDragOptions) => {
    const [dragPreview, setDragPreview] = useState<DragPreview | null>(null);
    const dragRef = useRef<DragState | null>(null);
    const { showError } = useToast();

    const handleMouseMove = (e: MouseEvent) => {
        if (!dragRef.current) return;

        const deltaX = e.clientX - dragRef.current.startX;
        const deltaDays = deltaX / pixelsPerDay;
        const daysMs = deltaDays * 24 * 60 * 60 * 1000;

        let newStart = dragRef.current.originalStart;
        let newEnd = dragRef.current.originalEnd;

        if (dragRef.current.mode === "MOVE") {
            newStart = new Date(dragRef.current.originalStart.getTime() + daysMs);
            newEnd = new Date(dragRef.current.originalEnd.getTime() + daysMs);
        } else if (dragRef.current.mode === "RESIZE") {
            newEnd = new Date(dragRef.current.originalEnd.getTime() + daysMs);
            if (newEnd.getTime() < newStart.getTime()) {
                newEnd = newStart;
            }
        }

        setDragPreview({
            taskId: dragRef.current.taskId,
            newStart,
            newEnd,
        });
    };

    const handleMouseUp = async (e: MouseEvent) => {
        if (!dragRef.current) return;

        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);

        const deltaX = e.clientX - dragRef.current.startX;

        if (Math.abs(deltaX) > 2) {
            const deltaDays = deltaX / pixelsPerDay;
            const daysMs = deltaDays * 24 * 60 * 60 * 1000;

            let newStart = dragRef.current.originalStart;
            let newEnd = dragRef.current.originalEnd;

            if (dragRef.current.mode === "MOVE") {
                newStart = new Date(dragRef.current.originalStart.getTime() + daysMs);
                newEnd = new Date(dragRef.current.originalEnd.getTime() + daysMs);
            } else if (dragRef.current.mode === "RESIZE") {
                newEnd = new Date(dragRef.current.originalEnd.getTime() + daysMs);
                if (newEnd.getTime() < newStart.getTime()) {
                    newEnd = newStart;
                }
            }

            const task = tasks.find((t) => t.id === dragRef.current!.taskId);
            if (task) {
                const updatedTask = {
                    ...task,
                    start_datetime: newStart.toISOString(),
                    end_datetime: newEnd.toISOString(),
                };
                try {
                    await updateTask(updatedTask);
                    if (onRefresh) onRefresh();
                } catch (err) {
                    console.error("Failed to update task date", err);
                    showError("タスクの日付更新に失敗しました");
                }
            }
        }

        dragRef.current = null;
        setDragPreview(null);
    };

    const startDrag = (
        e: React.MouseEvent,
        task: Task,
        mode: "MOVE" | "RESIZE",
    ) => {
        if (!task.start_datetime || !task.end_datetime) return;
        e.preventDefault();
        e.stopPropagation();

        dragRef.current = {
            taskId: task.id,
            startX: e.clientX,
            originalStart: new Date(task.start_datetime),
            originalEnd: new Date(task.end_datetime),
            mode,
        };

        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
    };

    const handleMouseDown = (e: React.MouseEvent, task: Task) => {
        startDrag(e, task, "MOVE");
    };

    const handleResizeMouseDown = (e: React.MouseEvent, task: Task) => {
        startDrag(e, task, "RESIZE");
    };

    return {
        dragPreview,
        handleMouseDown,
        handleResizeMouseDown,
    };
};
