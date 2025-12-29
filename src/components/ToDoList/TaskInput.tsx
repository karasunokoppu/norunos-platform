import React from "react";

interface TaskInputProps {}

const TaskInput: React.FC<TaskInputProps> = () => {
	const [isInputOpen, setIsInputOpen] = React.useState(false);
	const [description, setDescription] = React.useState("");

	const buttonCss = "bg-accent-hover text-accent-primary h-fit w-fit px-3 py-2 flex-none rounded-md";

	return (
		<div className="w-full bg-bg-primary pt-3 rounded-md flex flex-col justify-center items-center gap-2">
			<div className="w-full flex gap-3 px-5 pb-3">
				<input
					type="text"
					placeholder="input task description"
					value={description}
					onChange={(e) => setDescription(e.target.value)}
					onFocus={() => setIsInputOpen(true)}
					
					className="h-fitborder-2 border-border-primary flex-1 rounded-md bg-bg-active text-text-secondary px-4"
					
				/>
				<button
					type="button"
					className={buttonCss}
				>
					Add Task
				</button>
			</div>
			{isInputOpen && (
				<div className="w-full flex flex-col justify-between items-center gap-3">
					<div className="text-text-on-accent">somebuttons</div>
					<button
						type="button"
						onClick={() => setIsInputOpen(false)}
						className="text-text-secondary text-sm w-full bg-border-primary hover:bg-border-secondary rounded-b-md"
					>
						Λ
					</button>
				</div>
				
			)}
		</div>
	);
};

export default TaskInput;
