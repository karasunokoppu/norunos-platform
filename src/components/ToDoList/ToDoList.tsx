import TaskInput from "./TaskInput";
import TaskList from "./TaskList";

const ToDoListView = () => {
	return (
		<div className="h-full w-full flex justify-center items-start py-8">
			<div className="h-full w-full max-w-4xl flex flex-col justify-start items-center space-y-6">
				<TaskInput />
				<TaskList />
			</div>
		</div>
	);
};

export default ToDoListView;
