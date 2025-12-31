import "./App.css";
import { useEffect, useState } from "react";
import MainField from "./MainField";
import SideBar from "./SideBar";
import { Task } from "./type";

function App() {
	const [currentContent, setContent] = useState<string>("To Do List");
	const [tasks, setTasks] = useState<Task[]>([
		{
			id: "xxxxxx",
			description: "test",
			details: "test details",
			start_date: "yyyy/mm/dd",
			end_date: "yyyy/mm/dd",
			group: "test group",
			completed: false,
			subtasks: [{
				id:"subtask id",
				description: "subtask description",
				completed: false,
			}]
		},
	]);

	useEffect(() => {
		const handler = (e: MouseEvent) => e.preventDefault();
		document.addEventListener("contextmenu", handler);
		return () => document.removeEventListener("contextmenu", handler);
	}, []);

	return (
		<main className="h-full w-full flex flex-row gap-0">
			<SideBar currentContent={currentContent} onSelectContent={setContent} />
			<MainField currentContent={currentContent} tasks={tasks} />
		</main>
	);
}

export default App;
