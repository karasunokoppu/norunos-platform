import {
    type DragEndEvent,
    type DragStartEvent,
    type DropAnimation,
    defaultDropAnimationSideEffects,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useState } from "react";
import { useToast } from "../../../context/ToastContext";
import { moveTaskToGroup } from "../../../tauri/to_do_list_api";
import type { TaskGroup } from "../../../type";

interface UseKanbanDragProps {
    taskGroups: TaskGroup[];
    onRefresh: () => void;
}

export const useKanbanDrag = ({ taskGroups, onRefresh }: UseKanbanDragProps) => {
    const [activeId, setActiveId] = useState<string | null>(null);
    const { showError } = useToast();

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        }),
    );

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);

        if (!over) return;

        const activeTaskId = active.id as string;
        const overId = over.id as string;

        const sourceGroup = taskGroups.find((g) => g.tasks.includes(activeTaskId));

        if (!sourceGroup) return;

        let targetGroup = taskGroups.find((g) => g.id === overId);

        if (!targetGroup) {
            targetGroup = taskGroups.find((g) => g.tasks.includes(overId));
        }

        if (!targetGroup && overId === "unassigned") {
            return;
        }

        if (targetGroup && sourceGroup.id !== targetGroup.id) {
            try {
                await moveTaskToGroup(activeTaskId, targetGroup.id);
                onRefresh();
            } catch (e) {
                console.error("Failed to move task", e);
                showError("タスクの移動に失敗しました");
            }
        }
    };

    const dropAnimation: DropAnimation = {
        sideEffects: defaultDropAnimationSideEffects({
            styles: {
                active: {
                    opacity: "0.4",
                },
            },
        }),
    };

    return {
        sensors,
        activeId,
        handleDragStart,
        handleDragEnd,
        dropAnimation,
    };
};
