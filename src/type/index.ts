// export const contents = ["To Do List", "Calender", "Notes", "Settings"];
//Task
//Task
export interface Task {
	id: string;
	description: string;
	details?: string;
	completed: boolean;
	subtasks: Subtask[];
	start_datetime?: string;
	end_datetime?: string;
	progress: number;
	created_at: string;
	updated_at?: string;
	deleted_at?: string;
	// group: string; // Removed as it is not in the current Rust struct
}

export interface CreateTaskPayload {
	description: string;
	details?: string;
	start_datetime?: string;
	end_datetime?: string;
	group_id?: string;
}

export interface TaskGroup {
	id: string;
	name: string;
	tasks: string[];
	created_at: string;
	updated_at?: string;
	deleted_at?: string;
}

export interface Subtask {
	id: string;
	order: number;
	description: string;
	completed: boolean;
	created_at: string;
	updated_at?: string;
	deleted_at?: string;
}
