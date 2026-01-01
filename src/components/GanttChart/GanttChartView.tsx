import React, { useMemo, useRef, useEffect, useState } from "react";
import { Task, TaskGroup } from "../../type";
import { getTaskGroups } from "../../tauri/to_do_list_api";

interface GanttChartViewProps {
	tasks: Task[];
}

const PIXELS_PER_DAY = 50;
const HEADER_HEIGHT = 40;
const ROW_HEIGHT = 40;
const SIDEBAR_WIDTH = 250;

const GanttChartView: React.FC<GanttChartViewProps> = ({ tasks }) => {
	const sidebarRef = useRef<HTMLDivElement>(null);
	const headerRef = useRef<HTMLDivElement>(null);
	const chartRef = useRef<HTMLDivElement>(null);
	const [taskGroups, setTaskGroups] = useState<TaskGroup[]>([]);

	useEffect(() => {
		getTaskGroups().then(setTaskGroups).catch(console.error);
	}, [tasks]); // Re-fetch if tasks change, though groups might not.

	// 1. Filter valid tasks
	const validTasks = useMemo(() => {
		return tasks
			.filter((t) => t.start_datetime && t.end_datetime && !t.deleted_at);
	}, [tasks]);

	// 2. Group tasks
	const groupedData = useMemo(() => {
		const groups: { id: string; name: string; tasks: Task[] }[] = [];
		const assignedTaskIds = new Set<string>();

		// Process existing groups
		taskGroups.forEach(g => {
			const groupTasks = validTasks.filter(t => g.tasks.includes(t.id));
			if (groupTasks.length > 0) {
				// Sort by start date
				groupTasks.sort((a, b) => new Date(a.start_datetime!).getTime() - new Date(b.start_datetime!).getTime());
				groups.push({
					id: g.id,
					name: g.name,
					tasks: groupTasks
				});
				groupTasks.forEach(t => assignedTaskIds.add(t.id));
			}
		});

		// Unassigned tasks
		const unassignedTasks = validTasks.filter(t => !assignedTaskIds.has(t.id));
		if (unassignedTasks.length > 0) {
			unassignedTasks.sort((a, b) => new Date(a.start_datetime!).getTime() - new Date(b.start_datetime!).getTime());
			groups.push({
				id: "unassigned",
				name: "Unassigned",
				tasks: unassignedTasks
			});
		}

		return groups;
	}, [validTasks, taskGroups]);

	// 3. Determine timeline range
	const { minDate, maxDate, totalDays } = useMemo(() => {
		const allTasks = groupedData.flatMap(g => g.tasks);
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

		// Add padding
		const min = new Date(minTs);
		min.setDate(min.getDate() - 2);
		const max = new Date(maxTs);
		max.setDate(max.getDate() + 5);

		const diffTime = max.getTime() - min.getTime();
		const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

		return { minDate: min, maxDate: max, totalDays: days };
	}, [groupedData]);

	// Format helpers
	const formatDate = (date: Date) => `${date.getMonth() + 1}/${date.getDate()}`;
	const getXForDate = (dateStr: string) => {
		const date = new Date(dateStr);
		const diffTime = date.getTime() - minDate.getTime();
		const diffDays = diffTime / (1000 * 60 * 60 * 24);
		return diffDays * PIXELS_PER_DAY;
	};

	const chartWidth = totalDays * PIXELS_PER_DAY;

	// Calculate total layout height for virtual sizing (optional, but good for relative div)
	const totalContentHeight = groupedData.reduce((acc, g) => acc + ROW_HEIGHT + (g.tasks.length * ROW_HEIGHT), 0);

	// Scroll Sync
	const handleChartScroll = (e: React.UIEvent<HTMLDivElement>) => {
		const { scrollTop, scrollLeft } = e.currentTarget;
		if (sidebarRef.current) sidebarRef.current.scrollTop = scrollTop;
		if (headerRef.current) headerRef.current.scrollLeft = scrollLeft;
	};

	return (
		<div className="flex flex-col h-full w-full bg-bg-secondary text-text-primary overflow-hidden">
			{/* Header */}
			<div className="flex flex-row border-b border-border-primary bg-bg-primary z-20 shrink-0 h-[40px]">
				<div className="flex-shrink-0 flex items-center pl-4 font-bold border-r border-border-primary" style={{ width: SIDEBAR_WIDTH }}>
					Task Name
				</div>
				<div className="flex-1 overflow-hidden" ref={headerRef}>
					<div className="flex h-full" style={{ width: chartWidth }}>
						{Array.from({ length: totalDays }).map((_, i) => {
							const d = new Date(minDate);
							d.setDate(d.getDate() + i);
							return (
								<div key={i} className="flex-shrink-0 flex justify-center items-center border-r border-border-secondary text-xs" style={{ width: PIXELS_PER_DAY }}>
									{formatDate(d)}
								</div>
							);
						})}
					</div>
				</div>
			</div>

			{/* Body */}
			<div className="flex flex-row flex-1 min-h-0 relative">
				{/* Sidebar */}
				<div className="flex-shrink-0 overflow-hidden border-r border-border-primary bg-bg-primary" style={{ width: SIDEBAR_WIDTH }} ref={sidebarRef}>
					{groupedData.map(group => (
						<div key={group.id}>
							{/* Group Header */}
							<div className="flex items-center pl-2 font-bold bg-bg-tertiary border-b border-border-secondary text-text-secondary sticky" style={{ height: ROW_HEIGHT }}>
								{group.name}
							</div>
							{/* Tasks */}
							{group.tasks.map(task => (
								<div key={task.id} className="flex items-center pl-6 border-b border-border-secondary truncate pr-2 hover:bg-bg-hover text-sm" style={{ height: ROW_HEIGHT }} title={task.description}>
									{task.description}
								</div>
							))}
						</div>
					))}
					{groupedData.length === 0 && <div className="p-4 text-text-secondary">No scheduled tasks</div>}
				</div>

				{/* Chart */}
				<div className="flex-1 overflow-auto bg-bg-secondary relative" ref={chartRef} onScroll={handleChartScroll}>
					<div className="relative" style={{ width: chartWidth, minHeight: totalContentHeight }}>
						{/* Grid */}
						<div className="absolute top-0 left-0 bottom-0 right-0 flex pointer-events-none h-full">
							{Array.from({ length: totalDays }).map((_, i) => (
								<div key={i} className="border-r border-border-secondary flex-shrink-0 h-full" style={{ width: PIXELS_PER_DAY }} />
							))}
						</div>

						{/* Content */}
						{groupedData.map(group => (
							<div key={group.id}>
								{/* Group Header Row (Empty in chart, just background) */}
								<div className="bg-bg-tertiary border-b border-border-secondary opacity-50" style={{ height: ROW_HEIGHT, width: chartWidth }} />

								{/* Tasks */}
								{group.tasks.map(task => {
									const x = getXForDate(task.start_datetime!);
									const endX = getXForDate(task.end_datetime!) + PIXELS_PER_DAY;
									const width = Math.max(PIXELS_PER_DAY, endX - x);

									let progressPercent = 0;
									if (task.subtasks && task.subtasks.length > 0) {
										const completed = task.subtasks.filter(s => s.completed).length;
										progressPercent = (completed / task.subtasks.length) * 100;
									} else {
										progressPercent = task.completed ? 100 : 0;
									}

									return (
										<div key={task.id} className="relative border-b border-transparent hover:bg-black/5" style={{ height: ROW_HEIGHT }}>
											<div className="absolute ml-1 rounded-md shadow-sm overflow-hidden bg-bg-tertiary top-1"
												style={{ left: x, width: width - 4, height: ROW_HEIGHT - 8 }}
												title={`${task.description} (${Math.round(progressPercent)}%)`}>
												<div className="h-full bg-accent-primary opacity-80" style={{ width: `${progressPercent}%` }} />
											</div>
										</div>
									);
								})}
							</div>
						))}
					</div>
				</div>
			</div>
		</div>
	);
};

export default GanttChartView;
