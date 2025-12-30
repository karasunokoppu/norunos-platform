import React from "react";
import NorunoDatePicker from "../../ui/NorunoDatePicker";
import NorunoDropdown from "../../ui/NorunoDropdown";

interface TaskInputProps {}

const TaskInput: React.FC<TaskInputProps> = () => {
	const [isInputOpen, setIsInputOpen] = React.useState(false);
	const [description, setDescription] = React.useState("");
	//Start Date
	const [isSDPOpen, setIsSDPOpen] = React.useState(false);
	const [startDate, setStartDate] = React.useState("");
	//End Date
	const [isEDPOpen, setIsEDPOpen] = React.useState(false);
	const [endDate, setEndDate] = React.useState("");
	//Group
	const testGroup = ["TG01", "TG02", "TG03", "TG04", "TG05"];
	const [taskGroup, setTaskGroup] = React.useState(testGroup[1]);

	const buttonCss =
		"bg-accent-hover text-accent-primary h-fit w-fit px-3 py-2 flex-none rounded-md";
	const inputCss =
		"border-2 border-border-primary flex-1 rounded-md bg-bg-active text-text-secondary px-4";
	const datePickerContainer = "flex flex-row gap-2";

	return (
		<div className="w-full bg-bg-primary pt-3 rounded-md flex flex-col justify-center items-center gap-2">
			<div className="w-full flex gap-3 px-5 pb-3">
				<input
					type="text"
					placeholder="input task description"
					value={description}
					onChange={(e) => setDescription(e.target.value)}
					onFocus={() => setIsInputOpen(true)}
					className={inputCss}
				/>
				<button type="button" className={buttonCss}>
					Add Task
				</button>
			</div>
			{isInputOpen && (
				<div className="w-full flex flex-col justify-between items-center gap-3">
					<div className="text-text-on-accent">somebuttons</div>

					<div className={datePickerContainer}>
						<label className="text-text-primary">Start Date:</label>
						<button className={inputCss} onClick={() => setIsSDPOpen(true)}>
							{startDate ? startDate.replace(/-/g, "/") : "Select Start Date"}
						</button>
						{isSDPOpen && (
							<NorunoDatePicker
								value={startDate}
								onChange={setStartDate}
								onClose={() => setIsSDPOpen(false)}
							/>
						)}
					</div>
					<div className={datePickerContainer}>
						<label className="text-text-primary">End Date:</label>
						<button className={inputCss} onClick={() => setIsEDPOpen(true)}>
							{endDate ? endDate.replace(/-/g, "/") : "Select End Date"}
						</button>
						{isEDPOpen && (
							<NorunoDatePicker
								value={endDate}
								onChange={setEndDate}
								onClose={() => setIsEDPOpen(false)}
							/>
						)}
					</div>

					<NorunoDropdown
						value={taskGroup}
						onChange={setTaskGroup}
						options={testGroup.map((group) => ({ value: group, label: group }))}
					/>

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
