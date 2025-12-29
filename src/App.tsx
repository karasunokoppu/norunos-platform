import "./App.css";
import { useEffect, useState } from "react";
import MainField from "./MainField";
import SideBar from "./SideBar";

function App() {
	const [currentContent, setContent] = useState<string>("To Do List");

	useEffect(() => {
		const handler = (e: MouseEvent) => e.preventDefault();
		document.addEventListener("contextmenu", handler);
		return () => document.removeEventListener("contextmenu", handler);
	}, []);

	return (
		<main className="h-full w-full flex flex-row gap-0">
			<SideBar currentContent={currentContent} onSelectContent={setContent} />
			<MainField currentContent={currentContent} />
		</main>
	);
}

export default App;
