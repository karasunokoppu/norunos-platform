import {
	Book,
	Brain,
	Calendar,
	ChartGantt,
	Command,
	LayoutDashboard,
	ListTodo,
	Notebook,
	Settings,
} from "lucide-react";
import React from "react";

interface SideBarProps {
	currentContent: string;
	onSelectContent: (content: string) => void;
}

const SideBar: React.FC<SideBarProps> = ({
	currentContent,
	onSelectContent,
}) => {
	const [isSideBarOpened, setIsSideBarOpened] = React.useState(true);

	const mainItems = [
		{ id: "To Do List", icon: ListTodo, label: "To Do List" },
		{ id: "Gantt Chart", icon: ChartGantt, label: "Gantt Chart" },
		{ id: "Dashboard", icon: LayoutDashboard, label: "Dashboard" },
		{ id: "Calender", icon: Calendar, label: "Calender" },
		{ id: "Notes", icon: Notebook, label: "Notes" },
		{ id: "Books", icon: Book, label: "Books" },
		{ id: "MindMap", icon: Brain, label: "MindMap" },
	];

	// CSS classes
	const mainCss =
		"bg-bg-primary h-full border-r border-border-primary text-text-secondary flex flex-col justify-content-center pb-2 shrink-0 transition-all duration-300 z-50 " +
		(isSideBarOpened ? " w-60" : " w-[70px]");

	const buttonCss =
		"flex flex-row items-center cursor-pointer transition-colors duration-200 outline-none rounded-lg min-h-[44px] " +
		(isSideBarOpened ? "px-3 mx-2.5" : "px-0 mx-3 justify-center");

	const getLinkClass = (active: boolean) => {
		return (
			buttonCss +
			" " +
			(active
				? "bg-accent-primary/10 text-accent-primary font-medium"
				: "hover:bg-bg-hover text-text-secondary hover:text-text-primary")
		);
	};

	return (
		<div className={mainCss}>
			{/* Header / Brand */}
			<button
				type="button"
				className={`flex flex-row items-center mx-2.5 mt-3 mb-6 p-2 rounded-xl hover:bg-bg-hover transition-colors text-left group outline-none ${isSideBarOpened ? "" : "justify-center"}`}
				onClick={() => setIsSideBarOpened(!isSideBarOpened)}
				title={isSideBarOpened ? "Collapse Sidebar" : "Expand Sidebar"}
			>
				<div
					className={`flex items-center justify-center p-2 rounded-lg bg-accent-primary/10 text-accent-primary transition-all duration-300 group-hover:bg-accent-primary/20 shrink-0`}
				>
					<Command size={22} />
				</div>

				<div
					className={`flex flex-col overflow-hidden transition-all duration-300 ${isSideBarOpened ? "ml-3 opacity-100 max-w-[150px]" : "opacity-0 max-w-0"}`}
				>
					<span className="font-bold text-base tracking-tight leading-none text-text-primary whitespace-nowrap">
						Noruno
					</span>
					<span className="text-[10px] font-semibold text-text-tertiary uppercase tracking-widest mt-1">
						Platform
					</span>
				</div>
			</button>

			{/* Main Navigation */}
			<div className="flex-1 flex flex-col gap-1 overflow-y-auto overflow-x-hidden scrollbar-thin">
				{mainItems.map((item) => (
					<button
						key={item.id}
						type="button"
						className={getLinkClass(currentContent === item.id)}
						onClick={() => onSelectContent(item.id)}
						title={!isSideBarOpened ? item.label : undefined}
					>
						<item.icon size={20} className="shrink-0" />
						<span
							className={`text-sm whitespace-nowrap transition-all duration-300 ${isSideBarOpened ? "ml-3 opacity-100" : "opacity-0 w-0 overflow-hidden"}`}
						>
							{item.label}
						</span>
					</button>
				))}
			</div>

			{/* Bottom Section (Settings) */}
			<div className="mt-auto px-0 pt-2 border-t border-border-primary/40 flex flex-col gap-1">
				<button
					type="button"
					className={getLinkClass(currentContent === "Settings")}
					onClick={() => onSelectContent("Settings")}
					title={!isSideBarOpened ? "Settings" : undefined}
				>
					<Settings size={20} className="shrink-0" />
					<span
						className={`ml-3 text-sm whitespace-nowrap transition-all duration-300 ${isSideBarOpened ? "opacity-100" : "opacity-0 w-0 overflow-hidden"}`}
					>
						Settings
					</span>
				</button>
			</div>
		</div>
	);
};

export default SideBar;
