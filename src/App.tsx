import "./App.css";

import { getCurrentWindow } from "@tauri-apps/api/window";
import { useEffect, useState } from "react";
import TitleBar from "./components/TitleBar";
import { GlobalErrorBoundary } from "./components/Error/GlobalErrorBoundary";
import { ToastProvider, useToast } from "./context/ToastContext";
import MainField from "./MainField";
import SideBar from "./SideBar";
import { getTasks } from "./tauri/to_do_list_api";
import type { Task } from "./type";

function AppContent() {
	const [currentContent, setContent] = useState<string>("Dashboard");
	const [tasks, setTasks] = useState<Task[]>([]);
	const [isMaximized, setIsMaximized] = useState(false);
	const appWindow = getCurrentWindow();
	const { showError } = useToast();

	const refreshTasks = () => {
		getTasks()
			.then(setTasks)
			.catch((e) => {
				console.error(e);
				showError("タスクの取得に失敗しました");
			});
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
		const unlisten = appWindow.listen("tauri://resize", checkMaximized);

		return () => {
			unlisten.then((f) => f());
		};
	}, []);

	return (
		<div
			className={`h-svh w-full flex flex-col overflow-hidden ${isMaximized ? "p-0 bg-bg-primary" : "bg-transparent p-1"}`}
		>
			<div
				className={`flex-1 flex flex-col shadow-2xl overflow-hidden bg-bg-primary ${isMaximized ? "rounded-none border-0" : "rounded-lg border border-border-primary"}`}
			>
				<TitleBar isMaximized={isMaximized} />
				<main className="flex-1 flex flex-row gap-0 overflow-hidden">
					<SideBar
						currentContent={currentContent}
						onSelectContent={setContent}
					/>
					<MainField
						currentContent={currentContent}
						tasks={tasks}
						onRefresh={refreshTasks}
					/>
				</main>
			</div>
		</div>
	);
}

function App() {
	return (
		<GlobalErrorBoundary>
			<ToastProvider>
				<AppContent />
			</ToastProvider>
		</GlobalErrorBoundary>
	);
}

export default App;
