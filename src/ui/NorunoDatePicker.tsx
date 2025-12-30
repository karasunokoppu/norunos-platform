import React, { useState } from "react";

interface NorunoDatePickerProps {
	value: string;
	onChange: (date: string) => void;
	onClose: () => void;
}

const NorunoDatePicker: React.FC<NorunoDatePickerProps> = ({
	value,
	onChange,
	onClose,
}) => {
	const [currentDate, setCurrentDate] = useState(
		value ? new Date(value) : new Date(),
	);
	const [selectedDate, setSelectedDate] = useState(
		value ? value.split(" ")[0] : "",
	);
	const [selectedTime, setSelectedTime] = useState(
		value && value.includes(" ") ? value.split(" ")[1] : "12:00",
	);

	// Helper to get days in month
	const getDaysInMonth = (year: number, month: number) => {
		return new Date(year, month + 1, 0).getDate();
	};

	// Helper to get day of week for first day (0 = Sunday)
	const getFirstDayOfMonth = (year: number, month: number) => {
		return new Date(year, month, 1).getDay();
	};

	const year = currentDate.getFullYear();
	const month = currentDate.getMonth();
	const daysInMonth = getDaysInMonth(year, month);
	const firstDay = getFirstDayOfMonth(year, month);

	const handlePrevMonth = () => {
		setCurrentDate(new Date(year, month - 1, 1));
	};

	const handleNextMonth = () => {
		setCurrentDate(new Date(year, month + 1, 1));
	};

	const handleDateClick = (day: number) => {
		const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
		setSelectedDate(dateStr);
	};

	const handleOk = () => {
		if (selectedDate) {
			onChange(`${selectedDate} ${selectedTime}`);
		}
		onClose();
	};

	const renderCalendarDays = () => {
		const days = [];
		// Empty slots for days before start of month
		for (let i = 0; i < firstDay; i++) {
			days.push(<div key={`empty-${i}`} className="h-8"></div>);
		}
		// Days of month
		for (let day = 1; day <= daysInMonth; day++) {
			const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
			const isSelected = selectedDate === dateStr;
			const isToday =
				new Date().toDateString() === new Date(year, month, day).toDateString();

			days.push(
				<div
					key={day}
					className={`h-8 flex items-center justify-center rounded cursor-pointer text-sm hover:bg-bg-hover transition-colors ${
						isSelected
							? "bg-accent-primary text-white font-bold"
							: isToday
								? "border border-accent-primary font-bold text-accent-primary"
								: "text-text-primary"
					}`}
					onClick={() => handleDateClick(day)}
				>
					{day}
				</div>,
			);
		}
		return days;
	};

	return (
		<div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm">
			<div className="bg-bg-secondary rounded-xl shadow-strong border border-border-primary min-w-[320px] p-5 animate-in fade-in zoom-in duration-200">
				<div className="flex justify-between items-center mb-5">
					<button
						onClick={handlePrevMonth}
						className="p-2 text-text-secondary hover:text-text-primary bg-transparent border-none cursor-pointer text-lg font-bold transition-colors"
					>
						&lt;
					</button>
					<h3 className="text-lg font-bold text-text-primary m-0">
						{year}/{String(month + 1).padStart(2, "0")}
					</h3>
					<button
						onClick={handleNextMonth}
						className="p-2 text-text-secondary hover:text-text-primary bg-transparent border-none cursor-pointer text-lg font-bold transition-colors"
					>
						&gt;
					</button>
				</div>

				<div className="grid grid-cols-7 gap-1 mb-2 text-center text-xs font-bold text-text-tertiary uppercase">
					<div>Sun</div>
					<div>Mon</div>
					<div>Tue</div>
					<div>Wed</div>
					<div>Thu</div>
					<div>Fri</div>
					<div>Sat</div>
				</div>

				<div className="grid grid-cols-7 gap-1 mb-5">
					{renderCalendarDays()}
				</div>

				<div className="m-5 flex justify-center items-center gap-2.5">
					<label className="text-sm font-bold text-text-secondary">Time:</label>
					<input
						type="time"
						value={selectedTime}
						onChange={(e) => setSelectedTime(e.target.value)}
						className="p-1.5 rounded border border-border-secondary bg-bg-primary text-text-primary text-sm focus:outline-none focus:border-accent-primary transition-colors"
					/>
				</div>

				<div className="flex justify-end gap-2.5 mt-5">
					<button
						className="px-4 py-2 rounded bg-bg-active text-text-primary font-bold border-none cursor-pointer hover:bg-bg-hover transition-colors"
						onClick={onClose}
					>
						Cancel
					</button>
					<button
						className="px-4 py-2 rounded bg-accent-primary text-white font-bold border-none cursor-pointer hover:bg-accent-hover transition-colors shadow-sm"
						onClick={handleOk}
					>
						OK
					</button>
				</div>
			</div>
		</div>
	);
};

export default NorunoDatePicker;
