import "./App.css";
import { useEffect, useState } from "react";
import MainField from "./MainField";
import SideBar from "./SideBar";
import { Task } from "./type";
import { getTasks } from "./tauri/to_do_list_api";

function App() {
	const [currentContent, setContent] = useState<string>("To Do List");
	const [tasks, setTasks] = useState<Task[]>([]);

	const refreshTasks = () => {
		getTasks().then(setTasks).catch(console.error);
	};

	useEffect(() => {
		refreshTasks();
	}, []);

	useEffect(() => {
		const handler = (e: MouseEvent) => e.preventDefault();
		document.addEventListener("contextmenu", handler);
		return () => document.removeEventListener("contextmenu", handler);
	}, []);

	return (
		<main className="h-full w-full flex flex-row gap-0">
			<SideBar currentContent={currentContent} onSelectContent={setContent} />
			<MainField currentContent={currentContent} tasks={tasks} onRefresh={refreshTasks} />
		</main>
	);
}

export default App;
