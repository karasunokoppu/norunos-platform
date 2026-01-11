import { useMemo } from "react";
import type { Task, TaskGroup } from "../type";

interface GroupedData {
    id: string;
    name: string;
    tasks: Task[];
}

interface UseGanttRangeOptions {
    tasks: Task[];
    taskGroups: TaskGroup[];
}

interface UseGanttRangeResult {
    validTasks: Task[];
    groupedData: GroupedData[];
    minDate: Date;
    totalDays: number;
    getXForDate: (dateStr: string, pixelsPerDay: number) => number;
    formatDate: (date: Date) => string;
}

export const useGanttRange = ({
    tasks,
    taskGroups,
}: UseGanttRangeOptions): UseGanttRangeResult => {
    // 1. Filter valid tasks
    const validTasks = useMemo(() => {
        return tasks
            .filter((t) => t.start_datetime && t.end_datetime && !t.deleted_at)
            .filter(
                (t) =>
                    !isNaN(new Date(t.start_datetime!).getTime()) &&
                    !isNaN(new Date(t.end_datetime!).getTime()),
            );
    }, [tasks]);

    // 2. Group tasks
    const groupedData = useMemo(() => {
        const groups: GroupedData[] = [];
        const assignedTaskIds = new Set<string>();

        taskGroups.forEach((g) => {
            const groupTasks = validTasks.filter((t) => g.tasks.includes(t.id));
            if (groupTasks.length > 0) {
                groupTasks.sort(
                    (a, b) =>
                        new Date(a.start_datetime!).getTime() -
                        new Date(b.start_datetime!).getTime(),
                );
                groups.push({
                    id: g.id,
                    name: g.name,
                    tasks: groupTasks,
                });
                groupTasks.forEach((t) => assignedTaskIds.add(t.id));
            }
        });

        const unassignedTasks = validTasks.filter(
            (t) => !assignedTaskIds.has(t.id),
        );
        if (unassignedTasks.length > 0) {
            unassignedTasks.sort(
                (a, b) =>
                    new Date(a.start_datetime!).getTime() -
                    new Date(b.start_datetime!).getTime(),
            );
            groups.push({
                id: "unassigned",
                name: "Unassigned",
                tasks: unassignedTasks,
            });
        }

        return groups;
    }, [validTasks, taskGroups]);

    // 3. Determine timeline range
    const { minDate, totalDays } = useMemo(() => {
        const allTasks = groupedData.flatMap((g) => g.tasks);
        if (allTasks.length === 0) {
            const today = new Date();
            const start = new Date(today);
            start.setDate(today.getDate() - 2);
            const end = new Date(today);
            end.setDate(today.getDate() + 14);
            return { minDate: start, maxDate: end, totalDays: 16 };
        }

        let minTs = Number.MAX_SAFE_INTEGER;
        let maxTs = 0;

        allTasks.forEach((t) => {
            const start = new Date(t.start_datetime!).getTime();
            const end = new Date(t.end_datetime!).getTime();
            if (start < minTs) minTs = start;
            if (end > maxTs) maxTs = end;
        });

        const min = new Date(minTs);
        min.setDate(min.getDate() - 2);
        const max = new Date(maxTs);
        max.setDate(max.getDate() + 5);

        const diffTime = max.getTime() - min.getTime();
        const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        return { minDate: min, maxDate: max, totalDays: days };
    }, [groupedData]);

    // Helper functions
    const getXForDate = (dateStr: string, pixelsPerDay: number) => {
        const date = new Date(dateStr);
        const diffTime = date.getTime() - minDate.getTime();
        const diffDays = diffTime / (1000 * 60 * 60 * 24);
        return diffDays * pixelsPerDay;
    };

    const formatDate = (date: Date) => `${date.getMonth() + 1}/${date.getDate()}`;

    return {
        validTasks,
        groupedData,
        minDate,
        totalDays,
        getXForDate,
        formatDate,
    };
};
