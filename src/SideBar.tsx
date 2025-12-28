import React from "react";

// import { contents } from "../type";

interface SideBarProps {
	currentContent: string;
	onSelectContent: (content: string) => void;
}

const SideBar: React.FC<SideBarProps> = ({
	currentContent,
	onSelectContent,
}) => {
	const [isSideBarOpened, setIsSideBarOpened] = React.useState(true);
	const contents = [
		"To Do List",
		"Dashboard",
		"Calender",
		"Gantt Chart",
		"Notes",
		"Books",
		"MindMap",
		"Settings",
	]; //TODO Sample contents[Content管理用の方とかを実装する]

	const mainCss =
		"bg-bg-primary h-svh border-r-2 border-r-accent-primary text-text-primary flex flex-col justify-content-center px-2 pb-2" +
		(isSideBarOpened ? " w-40" : " w-fit");
	const buttonCss =
		" h-10 w-full flex flex-row justify-start items-center hover:bg-bg-hover hover:text-text-secondary " +
		(isSideBarOpened ? "" : "px-0");

	return (
		<div className={mainCss}>
			<button
				type="button"
				className={buttonCss}
				onClick={() => setIsSideBarOpened(!isSideBarOpened)}
			>
				<div className="px-2">☰</div>
				<div>{isSideBarOpened ? "Button01" : ""}</div>
			</button>

			<div className="h-px w-full bg-bg-tertiary"></div>

			{contents.map((content) => (
				<button
					type="button"
					key={content}
					className={
						buttonCss +
						(currentContent === content
							? "bg-bg-hover text-text-secondary"
							: "")
					}
					onClick={() => onSelectContent(content)}
				>
					<div className="px-2">
						{content === "To Do List" && "📋"}
						{content === "Dashboard" && "📊"}
						{content === "Calender" && "📅"}
						{content === "Gantt Chart" && "🕓"}
						{content === "Notes" && "📝"}
						{content === "Books" && "📚"}
						{content === "MindMap" && "🧠"}
						{content === "Settings" && "⚙️"}
					</div>
					<div>{isSideBarOpened ? content : ""}</div>
				</button>
			))}
		</div>
	);
};

export default SideBar;
