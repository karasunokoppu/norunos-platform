import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useToast } from "../../context/ToastContext";
import { useGanttDrag } from "../../hooks/useGanttDrag";
import { useGanttRange } from "../../hooks/useGanttRange";
import { getTaskGroups, updateTask } from "../../tauri/to_do_list_api";
import type { Task, TaskGroup } from "../../type";
import GanttHeader from "./GanttHeader";
import GanttSidebar from "./GanttSidebar";
import GanttTaskBar from "./GanttTaskBar";
import {
	DEFAULT_PIXELS_PER_DAY,
	MAX_PIXELS_PER_DAY,
	MIN_PIXELS_PER_DAY,
	ROW_HEIGHT,
	SIDEBAR_WIDTH,
} from "./constants";

interface GanttChartViewProps {
	tasks: Task[];
	onRefresh?: () => void;
}

const GanttChartView: React.FC<GanttChartViewProps> = ({
	tasks,
	onRefresh,
}) => {
	const sidebarRef = useRef<HTMLDivElement>(null);
	const headerRef = useRef<HTMLDivElement>(null);
	const chartRef = useRef<HTMLDivElement>(null);
	const [taskGroups, setTaskGroups] = useState<TaskGroup[]>([]);

	// View State
	const [pixelsPerDay, setPixelsPerDay] = useState(DEFAULT_PIXELS_PER_DAY);
	const [showDependencies, setShowDependencies] = useState(true);
	const [showInazuma, setShowInazuma] = useState(false);
	const { showError } = useToast();

	// Link State
	const [linkMode, setLinkMode] = useState(false);
	const [linkSource, setLinkSource] = useState<string | null>(null);

	useEffect(() => {
		getTaskGroups()
			.then(setTaskGroups)
			.catch((e) => {
				console.error(e);
				showError("タスクグループの取得に失敗しました");
			});
	}, [tasks, showError]);

	// Use custom hooks
	const { groupedData, minDate, totalDays, getXForDate, formatDate } =
		useGanttRange({ tasks, taskGroups });

	const { dragPreview, handleMouseDown, handleResizeMouseDown } = useGanttDrag({
		pixelsPerDay,
		tasks,
		onRefresh,
	});

	const chartWidth = totalDays * pixelsPerDay;
	const totalContentHeight = groupedData.reduce(
		(acc, g) => acc + ROW_HEIGHT + g.tasks.length * ROW_HEIGHT,
		0,
	);

	// 4. Calculate layout positions
	const taskLayout = useMemo(() => {
		const layout = new Map<
			string,
			{ x: number; endX: number; y: number; progressX: number }
		>();
		let currentY = 0;

		groupedData.forEach((group) => {
			currentY += ROW_HEIGHT;
			group.tasks.forEach((task) => {
				if (task.start_datetime && task.end_datetime) {
					const x = getXForDate(task.start_datetime, pixelsPerDay);
					const endX = getXForDate(task.end_datetime, pixelsPerDay) + pixelsPerDay;
					const width = Math.max(pixelsPerDay, endX - x);

					let progressPercent = 0;
					if (task.subtasks && task.subtasks.length > 0) {
						const completed = task.subtasks.filter((s) => s.completed).length;
						progressPercent = completed / task.subtasks.length;
					} else {
						progressPercent = task.completed ? 1 : (task.progress || 0) / 100;
					}

					const progressX = x + width * progressPercent;
					layout.set(task.id, { x, endX, y: currentY, progressX });
				}
				currentY += ROW_HEIGHT;
			});
		});
		return layout;
	}, [groupedData, pixelsPerDay, getXForDate]);

	// 5. Generate Lines
	const dependencyLines = useMemo(() => {
		if (!showDependencies) return [];
		const lines: React.JSX.Element[] = [];

		groupedData.forEach((group) => {
			group.tasks.forEach((task) => {
				const target = taskLayout.get(task.id);
				if (!target || !task.dependencies) return;

				task.dependencies.forEach((depId) => {
					const source = taskLayout.get(depId);
					if (source) {
						const startX = source.endX;
						const startY = source.y + ROW_HEIGHT / 2;
						const endX = target.x;
						const endY = target.y + ROW_HEIGHT / 2;
						const path = `M ${startX} ${startY} C ${startX + 20} ${startY}, ${endX - 20} ${endY}, ${endX} ${endY}`;
						lines.push(
							<path
								key={`${depId}-${task.id}`}
								d={path}
								stroke="#999"
								strokeWidth="2"
								fill="none"
								markerEnd="url(#arrowhead)"
								opacity="0.6"
							/>,
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
		const sortedTasks = Array.from(taskLayout.entries()).sort(
			(a, b) => a[1].y - b[1].y,
		);

		if (sortedTasks.length === 0) return null;

		const todayX = getXForDate(new Date().toISOString(), pixelsPerDay);
		d += `M ${todayX} 0 `;

		sortedTasks.forEach(([_, layout]) => {
			d += `L ${layout.progressX} ${layout.y + ROW_HEIGHT / 2} `;
		});

		d += `L ${todayX} ${totalContentHeight}`;

		return (
			<path
				d={d}
				stroke="red"
				strokeWidth="2"
				fill="none"
				strokeDasharray="4 2"
			/>
		);
	}, [taskLayout, showInazuma, getXForDate, pixelsPerDay, totalContentHeight]);

	// Scroll Sync
	const handleChartScroll = (e: React.UIEvent<HTMLDivElement>) => {
		const { scrollTop, scrollLeft } = e.currentTarget;
		if (sidebarRef.current) sidebarRef.current.scrollTop = scrollTop;
		if (headerRef.current) headerRef.current.scrollLeft = scrollLeft;
	};

	// Handle link mode click
	const handleTaskClick = async (e: React.MouseEvent, task: Task) => {
		if (!linkMode) {
			handleMouseDown(e, task);
			return;
		}

		e.preventDefault();
		e.stopPropagation();
		if (!linkSource) {
			setLinkSource(task.id);
		} else {
			if (linkSource === task.id) {
				setLinkSource(null);
				return;
			}
			if (!task.dependencies?.includes(linkSource)) {
				const newDeps = [...(task.dependencies || []), linkSource];
				const updatedTask = { ...task, dependencies: newDeps };
				try {
					await updateTask(updatedTask);
					if (onRefresh) onRefresh();
					setLinkSource(null);
					setLinkMode(false);
				} catch (err) {
					console.error("Failed to add dependency", err);
					showError("依存関係の追加に失敗しました");
				}
			} else {
				const newDeps = task.dependencies.filter((id) => id !== linkSource);
				const updatedTask = { ...task, dependencies: newDeps };
				try {
					await updateTask(updatedTask);
					if (onRefresh) onRefresh();
					setLinkSource(null);
					setLinkMode(false);
				} catch (err) {
					console.error("Failed to remove dependency", err);
					showError("依存関係の削除に失敗しました");
				}
			}
		}
	};

	return (
		<div className="flex flex-col h-full w-full bg-bg-secondary text-text-primary overflow-hidden">
			{/* Toolbar */}
			<div className="flex items-center p-2 border-b border-border-primary bg-bg-primary gap-4">
				<div className="flex items-center gap-2">
					<span className="text-sm font-bold">表示倍率:</span>
					<button
						type="button"
						className="px-2 py-1 bg-bg-tertiary rounded hover:bg-bg-hover border border-border-secondary"
						onClick={() =>
							setPixelsPerDay(Math.max(MIN_PIXELS_PER_DAY, pixelsPerDay - 10))
						}
					>
						-
					</button>
					<span className="text-sm w-8 text-center">{pixelsPerDay}</span>
					<button
						type="button"
						className="px-2 py-1 bg-bg-tertiary rounded hover:bg-bg-hover border border-border-secondary"
						onClick={() =>
							setPixelsPerDay(Math.min(MAX_PIXELS_PER_DAY, pixelsPerDay + 10))
						}
					>
						+
					</button>
				</div>
				<label className="flex items-center gap-2 cursor-pointer select-none">
					<input
						type="checkbox"
						checked={showDependencies}
						onChange={(e) => setShowDependencies(e.target.checked)}
					/>
					<span className="text-sm">依存関係を表示</span>
				</label>
				<label className="flex items-center gap-2 cursor-pointer select-none">
					<input
						type="checkbox"
						checked={showInazuma}
						onChange={(e) => setShowInazuma(e.target.checked)}
					/>
					<span className="text-sm">イナズマ線を表示</span>
				</label>
				<button
					type="button"
					className={`px-3 py-1 rounded border text-sm ${linkMode ? "bg-accent-primary text-white border-accent-primary" : "bg-bg-tertiary border-border-secondary hover:bg-bg-hover"}`}
					onClick={() => {
						setLinkMode(!linkMode);
						setLinkSource(null);
					}}
				>
					{linkMode
						? linkSource
							? "Click Target"
							: "Select Source"
						: "Link Mode"}
				</button>
			</div>

			{/* Header */}
			<GanttHeader
				totalDays={totalDays}
				pixelsPerDay={pixelsPerDay}
				minDate={minDate}
				sidebarWidth={SIDEBAR_WIDTH}
				headerRef={headerRef}
				formatDate={formatDate}
			/>

			{/* Body */}
			<div className="flex flex-row flex-1 min-h-0 relative">
				{/* Sidebar */}
				<GanttSidebar
					groupedData={groupedData}
					sidebarWidth={SIDEBAR_WIDTH}
					sidebarRef={sidebarRef}
				/>

				{/* Chart */}
				<div
					className="flex-1 overflow-auto bg-bg-secondary relative"
					ref={chartRef}
					onScroll={handleChartScroll}
				>
					<div
						className="relative"
						style={{ width: chartWidth, minHeight: totalContentHeight }}
					>
						{/* Grid */}
						<div className="absolute top-0 left-0 bottom-0 right-0 flex pointer-events-none h-full">
							{Array.from({ length: totalDays }).map((_, i) => {
								const d = new Date(minDate);
								d.setDate(d.getDate() + i);
								const isToday = new Date().toDateString() === d.toDateString();
								return (
									<div
										key={i}
										className={`border-r border-border-secondary shrink-0 h-full ${isToday ? "bg-accent-light opacity-70" : ""}`}
										style={{ width: pixelsPerDay }}
									/>
								);
							})}
						</div>

						{/* SVG Layer */}
						<svg
							className="absolute top-0 left-0 w-full h-full pointer-events-none z-10"
							style={{ width: chartWidth, height: totalContentHeight }}
						>
							<defs>
								<marker
									id="arrowhead"
									markerWidth="10"
									markerHeight="7"
									refX="9"
									refY="3.5"
									orient="auto"
								>
									<polygon points="0 0, 10 3.5, 0 7" fill="#999" />
								</marker>
							</defs>
							{dependencyLines}
							{inazumaPath}
						</svg>

						{/* Content */}
						{groupedData.map((group) => (
							<div key={group.id}>
								<div
									className="bg-bg-tertiary border-b border-border-secondary opacity-50"
									style={{ height: ROW_HEIGHT, width: chartWidth }}
								/>
								{group.tasks.map((task) => {
									const isDragging = dragPreview?.taskId === task.id;
									const start = isDragging
										? dragPreview!.newStart
										: new Date(task.start_datetime!);
									const end = isDragging
										? dragPreview!.newEnd
										: new Date(task.end_datetime!);

									const x = getXForDate(start.toISOString(), pixelsPerDay);
									const endX =
										getXForDate(end.toISOString(), pixelsPerDay) + pixelsPerDay;
									const width = Math.max(pixelsPerDay, endX - x);

									let progressPercent = 0;
									if (task.subtasks && task.subtasks.length > 0) {
										const completed = task.subtasks.filter(
											(s) => s.completed,
										).length;
										progressPercent = (completed / task.subtasks.length) * 100;
									} else {
										progressPercent = task.completed
											? 100
											: task.progress || 0;
									}

									const isLinkSource = linkMode && linkSource === task.id;

									return (
										<GanttTaskBar
											key={task.id}
											task={task}
											x={x}
											width={width}
											progressPercent={progressPercent}
											isLinkSource={isLinkSource}
											linkMode={linkMode}
											onMouseDown={handleTaskClick}
											onResizeMouseDown={handleResizeMouseDown}
										/>
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
