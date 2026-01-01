import type React from "react";
import BooksView from "./components/Books/BooksView";
import CalenderView from "./components/Calender/CalenderView";
import DashboardView from "./components/Dashboard/DashboardView";
import GanttChartView from "./components/GanttChart/GanttChartView";
import NotesView from "./components/Notes/NotesView";
import SettingsView from "./components/Settings/Settings";
import ToDoListView from "./components/ToDoList/ToDoList";
import MindMapView from "./components/MindMap/MindMap";
import { Task } from "./type";

interface MainFieldProps {
	currentContent: string;
	tasks: Task[];
	onRefresh: () => void;
}

const MainField: React.FC<MainFieldProps> = ({ currentContent, tasks, onRefresh }) => {
	return (
		<div className="h-full flex-1 overflow-hidden bg-bg-secondary">
			{currentContent === "To Do List" ? (
				<ToDoListView tasks={tasks} onRefresh={onRefresh} />
			) : currentContent === "Dashboard" ? (
				<DashboardView tasks={tasks} />
			) : currentContent === "Calender" ? (
				<CalenderView />
			) : currentContent === "Gantt Chart" ? (
				<GanttChartView tasks={tasks} />
			) : currentContent === "Notes" ? (
				<NotesView />
			) : currentContent === "Books" ? (
				<BooksView />
			) : currentContent === "MindMap" ? (
				<MindMapView />
			) : currentContent === "Settings" ? (
				<SettingsView />
			) : (
				<div className="bg-danger">Error: currentContent is undefined.</div>
			)}
		</div>
	);
};

export default MainField;
