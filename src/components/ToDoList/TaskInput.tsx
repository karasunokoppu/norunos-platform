import React from "react";
import NorunoDatePicker from "../../ui/NorunoDatePicker";
import NorunoDropdown from "../../ui/NorunoDropdown";

type TaskInputProps = {};

const TaskInput: React.FC<TaskInputProps> = () => {
	const [isInputOpen, setIsInputOpen] = React.useState(false);
	const [description, setDescription] = React.useState("");
	const [details, setDetails] = React.useState("");
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
		"bg-accent-secondary text-text-on-accent hover:bg-accent-hover px-4 py-2 rounded-md font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-accent-secondary";
	const inputCss =
		"border border-border-primary bg-bg-active text-text-secondary px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-accent-secondary focus:border-accent-secondary transition-colors duration-200";
	const datePickerContainer = "flex flex-col sm:flex-row sm:items-center gap-2";

	return (
		<div className="w-full bg-bg-primary border border-border-primary rounded-lg shadow-md overflow-visible">
			<div className="p-4">
				<div className="flex gap-3">
					<input
						type="text"
						placeholder="タスクの説明を入力..."
						value={description}
						onChange={(e) => setDescription(e.target.value)}
						onFocus={() => setIsInputOpen(true)}
						className={`${inputCss} flex-1`}
					/>
					<button type="button" className={buttonCss}>
						タスク追加
					</button>
				</div>
			</div>

			{isInputOpen && (
				<div>
					<div className="border-t border-border-primary bg-bg-secondary p-4 animate-in slide-in-from-top-2 duration-300">
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
							<div className={datePickerContainer}>
								<label className="w-16 text-text-primary font-medium text-sm">
									開始日:
								</label>
								<button
									className={`${inputCss} w-full text-left`}
									onClick={() => setIsSDPOpen(true)}
								>
									{startDate ? startDate.replace(/-/g, "/") : "開始日を選択"}
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
								<label className="w-16 text-text-primary font-medium text-sm">
									終了日:
								</label>
								<button
									className={`${inputCss} w-full text-left`}
									onClick={() => setIsEDPOpen(true)}
								>
									{endDate ? endDate.replace(/-/g, "/") : "終了日を選択"}
								</button>
								{isEDPOpen && (
									<NorunoDatePicker
										value={endDate}
										onChange={setEndDate}
										onClose={() => setIsEDPOpen(false)}
									/>
								)}
							</div>
						</div>

						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
							<div className={datePickerContainer}>
								<label className="w-16 text-text-primary font-medium text-sm">
									グループ:
								</label>
								<NorunoDropdown
									value={taskGroup}
									onChange={setTaskGroup}
									options={testGroup.map((group) => ({
										value: group,
										label: group,
									}))}
								/>
							</div>
							{/* ここに通知日時設定用のUIを実装予定 */}
						</div>
						<input
							type="text"
							placeholder="タスクの詳細を入力(オプション)..."
							value={details}
							onChange={(e) => setDetails(e.target.value)}
							className={`${inputCss} w-full`}
						/>
					</div>
					<div className="flex justify-center">
						<button
							type="button"
							onClick={() => setIsInputOpen(false)}
							className="w-full flex justify-center text-text-secondary hover:text-text-primary rounded-md hover:bg-bg-hover transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-accent-secondary"
						>
							<svg
								className="w-5 h-5"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M5 15l7-7 7 7"
								/>
							</svg>
						</button>
					</div>
				</div>
			)}
		</div>
	);
};

export default TaskInput;
