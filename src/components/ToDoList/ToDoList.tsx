import TaskInput from "./TaskInput";

const ToDoListView = () => {
	return (
		<div className="h-full w-full flex justify-center">
			<div className="h-full w-4/5 flex flex-col justify-baseline items-center">
				<TaskInput />
			</div>
		</div>
	);
};

export default ToDoListView;
