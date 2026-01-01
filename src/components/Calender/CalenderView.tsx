import React, { useState, useEffect, useMemo } from "react";
import { Task } from "../../type";
import { getMemos, saveMemo, deleteMemo, CalendarMemo } from "../../tauri/calendar_api";

interface CalenderViewProps {
	tasks?: Task[];
}

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const CalenderView: React.FC<CalenderViewProps> = ({ tasks = [] }) => {
	const [currentDate, setCurrentDate] = useState(new Date());
	const [memos, setMemos] = useState<CalendarMemo[]>([]);

	// Memo Dialog State
	const [selectedDate, setSelectedDate] = useState<string | null>(null); // "YYYY-MM-DD"
	const [memoContent, setMemoContent] = useState("");
	const [isDialogOpen, setIsDialogOpen] = useState(false);

	const year = currentDate.getFullYear();
	const month = currentDate.getMonth();

	// Fetch memos when month changes
	useEffect(() => {
		// Range: First day of month to last day of month
		// Actually, grid might show days from prev/next months. 
		// For simplicity, let's fetch strictly for this month or a bit wider range.
		// Let's grab entire month range.
		const start = new Date(year, month, 1);
		const end = new Date(year, month + 1, 0);
		// Format to YYYY-MM-DD
		const startStr = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`;
		const endStr = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}`;

		getMemos(startStr, endStr).then(setMemos).catch(console.error);
	}, [year, month]);

	const calendarGrid = useMemo(() => {
		const daysInMonth = new Date(year, month + 1, 0).getDate();
		const firstDayOfWeek = new Date(year, month, 1).getDay();

		const grid: { day: number | null; dateStr?: string; isToday?: boolean }[] = [];

		// Empty slots
		for (let i = 0; i < firstDayOfWeek; i++) {
			grid.push({ day: null });
		}

		// Days
		for (let day = 1; day <= daysInMonth; day++) {
			const d = new Date(year, month, day);
			const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
			const isToday = new Date().toDateString() === d.toDateString();
			grid.push({ day, dateStr, isToday });
		}
		return grid;
	}, [year, month]);

	const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
	const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
	const handleToday = () => setCurrentDate(new Date());

	const openMemoDialog = (dateStr: string) => {
		const memo = memos.find(m => m.date === dateStr);
		setSelectedDate(dateStr);
		setMemoContent(memo ? memo.content : "");
		setIsDialogOpen(true);
	};

	const handleSaveMemo = async () => {
		if (!selectedDate) return;
		await saveMemo(selectedDate, memoContent);
		// Refresh local state (optimistic or re-fetch)
		// Simple re-fetch or manual update
		const newMemo: CalendarMemo = { date: selectedDate, content: memoContent };
		setMemos(prev => {
			const idx = prev.findIndex(m => m.date === selectedDate);
			if (idx >= 0) {
				// Update
				if (memoContent.trim() === "") return prev.filter(m => m.date !== selectedDate); // remove if empty
				const next = [...prev];
				next[idx] = newMemo;
				return next;
			} else {
				if (memoContent.trim() === "") return prev;
				return [...prev, newMemo];
			}
		});
		setIsDialogOpen(false);
	};

	return (
		<div className="flex flex-col h-full w-full bg-bg-secondary text-text-primary p-4">
			{/* Header */}
			<div className="flex justify-between items-center mb-4">
				<div className="flex items-center gap-4">
					<h2 className="text-2xl font-bold">{year} / {String(month + 1).padStart(2, '0')}</h2>
					<button onClick={handleToday} className="px-3 py-1 bg-bg-tertiary rounded hover:bg-bg-hover text-sm border border-border-secondary">Today</button>
				</div>
				<div className="flex gap-2">
					<button onClick={handlePrevMonth} className="p-2 bg-bg-tertiary rounded hover:bg-bg-hover border border-border-secondary">&lt;</button>
					<button onClick={handleNextMonth} className="p-2 bg-bg-tertiary rounded hover:bg-bg-hover border border-border-secondary">&gt;</button>
				</div>
			</div>

			{/* Days of Week */}
			<div className="grid grid-cols-7 gap-1 mb-1">
				{DAYS_OF_WEEK.map(d => (
					<div key={d} className="text-center font-bold text-text-secondary py-2">
						{d}
					</div>
				))}
			</div>

			{/* Grid */}
			<div className="flex-1 grid grid-cols-7 grid-rows-6 gap-1 overflow-hidden min-h-0">
				{calendarGrid.map((cell, i) => {
					if (!cell.day) return <div key={i} className="bg-transparent" />;

					// Find tasks due this day
					const dayTasks = tasks.filter(t => {
						if (!t.end_datetime) return false;
						// Compare YYYY-MM-DD
						return t.end_datetime.startsWith(cell.dateStr!); // ISO String YYYY-MM-DD...
					});

					// Find memo
					const memo = memos.find(m => m.date === cell.dateStr);

					return (
						<div
							key={i}
							onClick={() => openMemoDialog(cell.dateStr!)}
							className={`
                                relative p-2 bg-bg-primary border border-border-secondary rounded cursor-pointer hover:bg-bg-hover overflow-hidden flex flex-col gap-1
                                ${cell.isToday ? "border-accent-secondary border-2" : ""}
                            `}
						>
							<div className={`text-sm font-bold flex justify-between ${cell.isToday ? "text-accent-secondary" : "text-text-primary"}`}>
								<span>{cell.day}</span>
							</div>

							<div className="flex-1 overflow-y-auto overflow-x-hidden text-xs flex flex-col gap-1 scrollbar-hide">
								{memo && (
									<div className="bg-bg-tertiary text-text-primary px-1 rounded truncate shadow-sm italic border-l-2 border-accent-secondary" title={memo.content}>
										{memo.content}
									</div>
								)}
								{dayTasks.map(t => (
									<div key={t.id} className="bg-accent-light text-accent-secondary px-1 rounded truncate shadow-sm" title={t.description}>
										{t.description}
									</div>
								))}
							</div>
						</div>
					);
				})}
			</div>

			{/* Memo Dialog */}
			{isDialogOpen && (
				<div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
					<div className="bg-bg-primary p-6 rounded-lg shadow-xl w-96 border border-border-primary">
						<h3 className="text-lg font-bold mb-4">Memo: {selectedDate}</h3>
						<textarea
							className="w-full h-32 bg-bg-secondary text-text-primary border border-border-primary rounded p-2 mb-4 focus:outline-none focus:border-accent-primary resize-none"
							value={memoContent}
							onChange={e => setMemoContent(e.target.value)}
							placeholder="Enter memo..."
						/>
						<div className="flex justify-end gap-2">
							<button onClick={() => setIsDialogOpen(false)} className="px-4 py-2 bg-bg-secondary rounded hover:bg-bg-hover border border-border-secondary">Cancel</button>
							<button onClick={handleSaveMemo} className="px-4 py-2 bg-accent-secondary text-text-on-accent rounded hover:opacity-90">Save</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default CalenderView;
