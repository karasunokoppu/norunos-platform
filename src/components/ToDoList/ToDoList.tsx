import TaskInput from "./TaskInput";

const ToDoListView = () => {
	return (
		<div className="h-full w-full flex justify-center items-start py-8">
			<div className="h-full w-full max-w-2xl flex flex-col justify-start items-center space-y-6">
				<h1 className="text-2xl font-bold text-text-primary mb-4">ToDo List</h1>
				<TaskInput />
			</div>
		</div>
	);
};

export default ToDoListView;
