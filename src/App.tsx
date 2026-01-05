import "./App.css";
import { useEffect, useState } from "react";
import MainField from "./MainField";
import SideBar from "./SideBar";
import { Task } from "./type";
import { getTasks } from "./tauri/to_do_list_api";

import { getCurrentWindow } from '@tauri-apps/api/window';
import TitleBar from "./components/TitleBar";

function App() {
	const [currentContent, setContent] = useState<string>("To Do List");
	const [tasks, setTasks] = useState<Task[]>([]);
	const [isMaximized, setIsMaximized] = useState(false);
	const appWindow = getCurrentWindow();

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

	useEffect(() => {
		const checkMaximized = async () => {
			setIsMaximized(await appWindow.isMaximized());
		};
		checkMaximized();

		// Listen for resize events to update maximized state
		const unlisten = appWindow.listen('tauri://resize', checkMaximized);

		return () => {
			unlisten.then(f => f());
		};
	}, []);

	return (
		<div className={`h-svh w-full flex flex-col overflow-hidden ${isMaximized ? 'p-0 bg-bg-primary' : 'bg-transparent p-1'}`}>
			{/* p-1 allows space for the border/shadow if we weren't maximizing. 
                But with maximized: true by default, border-radius might be cut off.
                However, for "stylish" look for non-maximized, we add a frame.
                If maximized, we might want to remove rounding. 
                For now, let's just make the inner container the "window".
            */}
			<div className={`flex-1 flex flex-col shadow-2xl overflow-hidden bg-bg-primary ${isMaximized ? 'rounded-none border-0' : 'rounded-lg border border-border-primary'}`}>
				<TitleBar isMaximized={isMaximized} />
				<main className="flex-1 flex flex-row gap-0 overflow-hidden">
					<SideBar currentContent={currentContent} onSelectContent={setContent} />
					<MainField currentContent={currentContent} tasks={tasks} onRefresh={refreshTasks} />
				</main>
			</div>
		</div>
	);
}

export default App;
