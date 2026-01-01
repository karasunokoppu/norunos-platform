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
<<<<<<< HEAD
	onRefresh: () => void;
}

const MainField: React.FC<MainFieldProps> = ({ currentContent, tasks, onRefresh }) => {
=======
	onCreateTask: (task: Task) => void;
	onUpdateTask: (task: Task) => void;
	onDeleteTask: (task: Task) => void;
	onUpdateTasks: (tasks: Task[]) => void;
}

const MainField: React.FC<MainFieldProps> = ({ currentContent, tasks, onCreateTask, onUpdateTask, onDeleteTask, onUpdateTasks }) => {
>>>>>>> 050c4bf92ad55825b52c8128619d1e1e296e04d2
	return (
		<div className="h-full flex-1 overflow-hidden bg-bg-secondary">
			{currentContent === "To Do List" ? (
<<<<<<< HEAD
				<ToDoListView tasks={tasks} onRefresh={onRefresh} />
=======
				<ToDoListView tasks={tasks} onCreateTask={onCreateTask} onUpdateTask={onUpdateTask} onDeleteTask={onDeleteTask} onUpdateTasks={onUpdateTasks} />
>>>>>>> 050c4bf92ad55825b52c8128619d1e1e296e04d2
			) : currentContent === "Dashboard" ? (
				<DashboardView tasks={tasks} />
			) : currentContent === "Calender" ? (
				<CalenderView tasks={tasks} />
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
