import "./App.css";
import MainField from "./MainField";
import SideBar from "./SideBar";
import { useState, useEffect } from "react";

function App() {
	const [currentContent, setContent] = useState<string>("To Do List");

	useEffect(() => {
		const handler = (e: MouseEvent) => e.preventDefault();
		document.addEventListener("contextmenu", handler);
		return () => document.removeEventListener("contextmenu", handler);
	}, []);

	return (
		<main className="flex flex-row">
			<SideBar currentContent={currentContent} onSelectContent={setContent} />
			<MainField currentContent={currentContent} />
		</main>
	);
}

export default App;
