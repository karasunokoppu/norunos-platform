import React, { useMemo, useRef, useEffect, useState } from "react";
import { Task, TaskGroup } from "../../type";
import { getTaskGroups } from "../../tauri/to_do_list_api";

interface GanttChartViewProps {
	tasks: Task[];
	onRefresh?: () => void;
}

const PIXELS_PER_DAY = 50;
const ROW_HEIGHT = 40;
const SIDEBAR_WIDTH = 250;

const GanttChartView: React.FC<GanttChartViewProps> = ({ tasks, onRefresh }) => {
	const sidebarRef = useRef<HTMLDivElement>(null);
	const headerRef = useRef<HTMLDivElement>(null);
	const chartRef = useRef<HTMLDivElement>(null);
	const [taskGroups, setTaskGroups] = useState<TaskGroup[]>([]);

	// View State
	const [pixelsPerDay, setPixelsPerDay] = useState(50);
	const [showDependencies, setShowDependencies] = useState(true);
	const [showInazuma, setShowInazuma] = useState(false);
	const [hoveredTask, setHoveredTask] = useState<string | null>(null);

	useEffect(() => {
		getTaskGroups().then(setTaskGroups).catch(console.error);
	}, [tasks]); // Re-fetch if tasks change, though groups might not.

	// 1. Filter valid tasks
	const validTasks = useMemo(() => {
		return tasks
			.filter((t) => t.start_datetime && t.end_datetime && !t.deleted_at)
			.filter((t) => !isNaN(new Date(t.start_datetime!).getTime()) && !isNaN(new Date(t.end_datetime!).getTime()));
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
	const { minDate, totalDays } = useMemo(() => {
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
		return diffDays * pixelsPerDay;
	};


	// Drag State
	const [dragPreview, setDragPreview] = useState<{ taskId: string; newStart: Date; newEnd: Date } | null>(null);
	const dragRef = useRef<{ taskId: string; startX: number; originalStart: Date; originalEnd: Date; mode: 'MOVE' | 'RESIZE' } | null>(null);

	// Link State
	const [linkMode, setLinkMode] = useState(false);
	const [linkSource, setLinkSource] = useState<string | null>(null);

	const handleMouseDown = async (e: React.MouseEvent, task: Task) => {
		if (linkMode) {
			e.preventDefault();
			e.stopPropagation();
			if (!linkSource) {
				setLinkSource(task.id);
			} else {
				if (linkSource === task.id) {
					setLinkSource(null); // Cancel
					return;
				}
				// Add dependency: Task(linkSource) -> Task(task.id) (Successor depends on Predecessor)
				// Check if already exists
				if (!task.dependencies?.includes(linkSource)) {
					const newDeps = [...(task.dependencies || []), linkSource];
					const updatedTask = { ...task, dependencies: newDeps };
					try {
						await import("../../tauri/to_do_list_api").then(mod => mod.updateTask(updatedTask));
						if (onRefresh) onRefresh();
						setLinkSource(null);
						setLinkMode(false);
					} catch (err) {
						console.error("Failed to add dependency", err);
					}
				} else {
					// Toggle: Remove dependency if already exists
					const newDeps = task.dependencies.filter(id => id !== linkSource);
					const updatedTask = { ...task, dependencies: newDeps };
					try {
						await import("../../tauri/to_do_list_api").then(mod => mod.updateTask(updatedTask));
						if (onRefresh) onRefresh();
						setLinkSource(null);
						setLinkMode(false);
					} catch (err) {
						console.error("Failed to remove dependency", err);
					}
				}
			}
			return;
		}

		if (!task.start_datetime || !task.end_datetime) return;
		e.preventDefault();
		e.stopPropagation();

		dragRef.current = {
			taskId: task.id,
			startX: e.clientX,
			originalStart: new Date(task.start_datetime),
			originalEnd: new Date(task.end_datetime),
			mode: 'MOVE'
		};

		document.addEventListener('mousemove', handleMouseMove);
		document.addEventListener('mouseup', handleMouseUp);
	};

	const handleResizeMouseDown = (e: React.MouseEvent, task: Task) => {
		if (!task.start_datetime || !task.end_datetime) return;
		e.preventDefault();
		e.stopPropagation();

		dragRef.current = {
			taskId: task.id,
			startX: e.clientX,
			originalStart: new Date(task.start_datetime),
			originalEnd: new Date(task.end_datetime),
			mode: 'RESIZE'
		};

		document.addEventListener('mousemove', handleMouseMove);
		document.addEventListener('mouseup', handleMouseUp);
	};

	const handleMouseMove = (e: MouseEvent) => {
		if (!dragRef.current) return;

		const deltaX = e.clientX - dragRef.current.startX;
		const deltaDays = deltaX / pixelsPerDay;
		const daysMs = deltaDays * 24 * 60 * 60 * 1000;

		let newStart = dragRef.current.originalStart;
		let newEnd = dragRef.current.originalEnd;

		if (dragRef.current.mode === 'MOVE') {
			newStart = new Date(dragRef.current.originalStart.getTime() + daysMs);
			newEnd = new Date(dragRef.current.originalEnd.getTime() + daysMs);
		} else if (dragRef.current.mode === 'RESIZE') {
			newEnd = new Date(dragRef.current.originalEnd.getTime() + daysMs);
			if (newEnd.getTime() < newStart.getTime()) {
				newEnd = newStart;
			}
		}

		setDragPreview({
			taskId: dragRef.current.taskId,
			newStart,
			newEnd
		});
	};

	const handleMouseUp = async (e: MouseEvent) => {
		if (!dragRef.current) return;

		document.removeEventListener('mousemove', handleMouseMove);
		document.removeEventListener('mouseup', handleMouseUp);

		// Recalculate final position avoiding stale state closure
		const deltaX = e.clientX - dragRef.current.startX;

		// Only update if moved significantly (optional, but good practice)
		if (Math.abs(deltaX) > 2) {
			const deltaDays = deltaX / pixelsPerDay;
			const daysMs = deltaDays * 24 * 60 * 60 * 1000;

			let newStart = dragRef.current.originalStart;
			let newEnd = dragRef.current.originalEnd;

			if (dragRef.current.mode === 'MOVE') {
				newStart = new Date(dragRef.current.originalStart.getTime() + daysMs);
				newEnd = new Date(dragRef.current.originalEnd.getTime() + daysMs);
			} else if (dragRef.current.mode === 'RESIZE') {
				newEnd = new Date(dragRef.current.originalEnd.getTime() + daysMs);
				if (newEnd.getTime() < newStart.getTime()) {
					newEnd = newStart;
				}
			}

			const task = tasks.find(t => t.id === dragRef.current!.taskId);
			if (task) {
				const updatedTask = {
					...task,
					start_datetime: newStart.toISOString(),
					end_datetime: newEnd.toISOString()
				};
				try {
					await import("../../tauri/to_do_list_api").then(mod => mod.updateTask(updatedTask));
					if (onRefresh) onRefresh();
				} catch (err) {
					console.error("Failed to update task date", err);
				}
			}
		}

		dragRef.current = null;
		setDragPreview(null);
	};

	const chartWidth = totalDays * pixelsPerDay;

	// Calculate total layout height for virtual sizing (optional, but good for relative div)
	const totalContentHeight = groupedData.reduce((acc, g) => acc + ROW_HEIGHT + (g.tasks.length * ROW_HEIGHT), 0);

	// 4. Calculate layout positions
	const taskLayout = useMemo(() => {
		const layout = new Map<string, { x: number; endX: number; y: number; progressX: number }>();
		let currentY = 0;

		groupedData.forEach(group => {
			currentY += ROW_HEIGHT; // Group Header
			group.tasks.forEach(task => {
				if (task.start_datetime && task.end_datetime) {
					const x = getXForDate(task.start_datetime);
					const endX = getXForDate(task.end_datetime) + pixelsPerDay;

					// Inazuma Progress Point
					// Calculate "Progress Date" = Start + (Duration * Progress)
					// Or simpler: x + (width * progress)
					const width = Math.max(pixelsPerDay, endX - x);
					let progressPercent = 0;
					if (task.subtasks && task.subtasks.length > 0) {
						const completed = task.subtasks.filter(s => s.completed).length;
						progressPercent = completed / task.subtasks.length;
					} else {
						progressPercent = (task.progress || (task.completed ? 100 : 0)) / 100;
					}
					const progressX = x + (width * progressPercent);

					layout.set(task.id, { x, endX, y: currentY, progressX });
				}
				currentY += ROW_HEIGHT;
			});
		});
		return layout;
	}, [groupedData, pixelsPerDay, minDate]); // Added minDate dependency implicitly via getXForDate logic copy if needed, but getXForDate uses closure. Ideally getXForDate should be dependency or memoized cleanly.
	// getXForDate depends on minDate and pixelsPerDay.

	// 5. Generate Lines
	const dependencyLines = useMemo(() => {
		if (!showDependencies) return [];
		const lines: JSX.Element[] = [];

		groupedData.forEach(group => {
			group.tasks.forEach(task => {
				const target = taskLayout.get(task.id);
				if (!target || !task.dependencies) return;

				task.dependencies.forEach(depId => {
					const source = taskLayout.get(depId);
					if (source) {
						// Draw from Source End to Target Start
						// Simple Bezier or L-shape
						const startX = source.endX;
						const startY = source.y + ROW_HEIGHT / 2;
						const endX = target.x;
						const endY = target.y + ROW_HEIGHT / 2;

						const path = `M ${startX} ${startY} C ${startX + 20} ${startY}, ${endX - 20} ${endY}, ${endX} ${endY}`;
						lines.push(
							<path key={`${depId}-${task.id}`} d={path} stroke="#999" strokeWidth="2" fill="none" markerEnd="url(#arrowhead)" opacity="0.6" />
						);
					}
				});
			});
		});
		return lines;
	}, [groupedData, taskLayout, showDependencies]);

	const inazumaPath = useMemo(() => {
		if (!showInazuma) return null;

		let d = "";
		// Sort all visible tasks by Y position
		const sortedTasks = Array.from(taskLayout.entries()).sort((a, b) => a[1].y - b[1].y);

		if (sortedTasks.length === 0) return null;

		const todayX = getXForDate(new Date().toISOString());

		// Start at top (Today)
		d += `M ${todayX} 0 `;

		sortedTasks.forEach(([_, layout]) => {
			d += `L ${layout.progressX} ${layout.y + ROW_HEIGHT / 2} `;
		});

		// End at bottom (Today)
		d += `L ${todayX} ${totalContentHeight}`;

		return <path d={d} stroke="red" strokeWidth="2" fill="none" strokeDasharray="4 2" />;
	}, [taskLayout, showInazuma, minDate, totalContentHeight]);


	// Scroll Sync
	const handleChartScroll = (e: React.UIEvent<HTMLDivElement>) => {
		const { scrollTop, scrollLeft } = e.currentTarget;
		if (sidebarRef.current) sidebarRef.current.scrollTop = scrollTop;
		if (headerRef.current) headerRef.current.scrollLeft = scrollLeft;
	};

	return (
		<div className="flex flex-col h-full w-full bg-bg-secondary text-text-primary overflow-hidden">
			{/* Toolbar */}
			<div className="flex items-center p-2 border-b border-border-primary bg-bg-primary gap-4">
				<div className="flex items-center gap-2">
					<span className="text-sm font-bold">Zoom:</span>
					<button className="px-2 py-1 bg-bg-tertiary rounded hover:bg-bg-hover border border-border-secondary" onClick={() => setPixelsPerDay(Math.max(20, pixelsPerDay - 10))}>-</button>
					<span className="text-sm w-8 text-center">{pixelsPerDay}</span>
					<button className="px-2 py-1 bg-bg-tertiary rounded hover:bg-bg-hover border border-border-secondary" onClick={() => setPixelsPerDay(Math.min(200, pixelsPerDay + 10))}>+</button>
				</div>
				<label className="flex items-center gap-2 cursor-pointer select-none">
					<input type="checkbox" checked={showDependencies} onChange={(e) => setShowDependencies(e.target.checked)} />
					<span className="text-sm">Show Dependencies</span>
				</label>
				<label className="flex items-center gap-2 cursor-pointer select-none">
					<input type="checkbox" checked={showInazuma} onChange={(e) => setShowInazuma(e.target.checked)} />
					<span className="text-sm">Inazuma Line</span>
				</label>
				<button
					className={`px-3 py-1 rounded border text-sm ${linkMode ? "bg-accent-primary text-white border-accent-primary" : "bg-bg-tertiary border-border-secondary hover:bg-bg-hover"}`}
					onClick={() => {
						setLinkMode(!linkMode);
						setLinkSource(null);
					}}
				>
					{linkMode ? (linkSource ? "Click Target" : "Select Source") : "Link Mode"}
				</button>
			</div>
			{/* Header */}
			<div className="flex flex-row border-b border-border-primary bg-bg-primary z-20 shrink-0 h-[40px]">
				<div className="shrink-0 flex items-center pl-4 font-bold border-r border-border-primary" style={{ width: SIDEBAR_WIDTH }}>
					Task Name
				</div>
				<div className="flex-1 overflow-hidden" ref={headerRef}>
					<div className="flex h-full" style={{ width: chartWidth }}>
						{Array.from({ length: totalDays }).map((_, i) => {
							const d = new Date(minDate);
							d.setDate(d.getDate() + i);
							const isToday = new Date().toDateString() === d.toDateString();
							return (
								<div key={i} className={`shrink-0 flex justify-center items-center border-r border-border-secondary text-xs ${isToday ? "bg-accent-light text-accent-secondary font-bold" : ""}`} style={{ width: pixelsPerDay }}>
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
				<div className="shrink-0 overflow-hidden border-r border-border-primary bg-bg-primary" style={{ width: SIDEBAR_WIDTH }} ref={sidebarRef}>
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
							{Array.from({ length: totalDays }).map((_, i) => {
								const d = new Date(minDate);
								d.setDate(d.getDate() + i);
								const isToday = new Date().toDateString() === d.toDateString();
								return (
									<div key={i} className={`border-r border-border-secondary shrink-0 h-full ${isToday ? "bg-accent-light opacity-70" : ""}`} style={{ width: pixelsPerDay }} />
								);
							})}
						</div>

						{/* SVG Layer */}
						<svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-10" style={{ width: chartWidth, height: totalContentHeight }}>
							<defs>
								<marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
									<polygon points="0 0, 10 3.5, 0 7" fill="#999" />
								</marker>
							</defs>
							{dependencyLines}
							{inazumaPath}
						</svg>

						{/* Content */}
						{groupedData.map(group => (
							<div key={group.id}>
								{/* Group Header Row (Empty in chart, just background) */}
								<div className="bg-bg-tertiary border-b border-border-secondary opacity-50" style={{ height: ROW_HEIGHT, width: chartWidth }} />

								{/* Tasks */}
								{group.tasks.map(task => {
									const isDragging = dragPreview?.taskId === task.id;
									const start = isDragging ? dragPreview!.newStart : new Date(task.start_datetime!);
									const end = isDragging ? dragPreview!.newEnd : new Date(task.end_datetime!);

									const x = getXForDate(start.toISOString());
									const endX = getXForDate(end.toISOString()) + pixelsPerDay;
									const width = Math.max(pixelsPerDay, endX - x);

									let progressPercent = 0;
									if (task.subtasks && task.subtasks.length > 0) {
										const completed = task.subtasks.filter(s => s.completed).length;
										progressPercent = (completed / task.subtasks.length) * 100;
									} else {
										progressPercent = task.progress || (task.completed ? 100 : 0);
									}

									const isLinkSource = linkMode && linkSource === task.id;

									return (
										<div key={task.id} className="relative border-b border-transparent hover:bg-black/5" style={{ height: ROW_HEIGHT }}>
											<div className={`absolute ml-1 rounded-md shadow-sm overflow-hidden bg-bg-tertiary top-1 ${linkMode ? "cursor-crosshair" : "cursor-grab active:cursor-grabbing"} ${isLinkSource ? "ring-2 ring-accent-primary" : ""}`}
												style={{ left: x, width: width - 4, height: ROW_HEIGHT - 8 }}
												title={`${task.description} (${Math.round(progressPercent)}%)`}
												onMouseDown={(e) => handleMouseDown(e, task)}
											>
												<div className="h-full bg-accent-primary opacity-80" style={{ width: `${progressPercent}%` }} />
												<div
													className={`absolute right-0 top-0 bottom-0 w-2 z-20 hover:bg-black/20 ${linkMode ? "" : "cursor-e-resize"}`}
													onMouseDown={(e) => {
														if (!linkMode) handleResizeMouseDown(e, task);
													}}
												/>
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
