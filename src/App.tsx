import "./App.css";
import { useEffect, useState } from "react";
import MainField from "./MainField";
import SideBar from "./SideBar";
import { Task } from "./type";
import { getTasks, createTask, updateTask, deleteTask } from "./tauri/to_do_list_api";

function App() {
	const [currentContent, setContent] = useState<string>("To Do List");
	const [tasks, setTasks] = useState<Task[]>([]);

	useEffect(() => {
		const loadTasks = async () => {
			try {
				const loadedTasks = await getTasks();
				setTasks(loadedTasks);
			} catch (error) {
				console.error("Failed to load tasks:", error);
			}
		};
		loadTasks();
	}, []);

	const handleCreateTask = async (task: Task) => {
		try {
			const updatedTasks = await createTask(task);
			setTasks(updatedTasks);
		} catch (error) {
			console.error("Failed to create task:", error);
		}
	};

	const handleUpdateTask = async (task: Task) => {
		try {
			const updatedTasks = await updateTask(task);
			setTasks(updatedTasks);
		} catch (error) {
			console.error("Failed to update task:", error);
		}
	};

	const handleDeleteTask = async (task: Task) => {
		try {
			const updatedTasks = await deleteTask(task);
			setTasks(updatedTasks);
		} catch (error) {
			console.error("Failed to delete task:", error);
		}
	};

	const handleUpdateTasks = (tasks: Task[]) => {
		setTasks(tasks);
	};

	useEffect(() => {
		const handler = (e: MouseEvent) => e.preventDefault();
		document.addEventListener("contextmenu", handler);
		return () => document.removeEventListener("contextmenu", handler);
	}, []);

	return (
		<main className="h-full w-full flex flex-row gap-0">
			<SideBar currentContent={currentContent} onSelectContent={setContent} />
			<MainField
				currentContent={currentContent}
				tasks={tasks}
				onCreateTask={handleCreateTask}
				onUpdateTask={handleUpdateTask}
				onDeleteTask={handleDeleteTask}
				onUpdateTasks={handleUpdateTasks}
			/>
		</main>
	);
}

export default App;
