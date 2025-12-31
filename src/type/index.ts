// export const contents = ["To Do List", "Calender", "Notes", "Settings"];
//Task
export interface Task {
	id: string;
	description: string;
	start_date?: string;
	end_date?: string;
	group: string;
	details: string;
	completed: boolean;
	subtasks: Subtask[];
}

export interface Subtask {
	id: string;
	description: string;
	completed: boolean;
}
