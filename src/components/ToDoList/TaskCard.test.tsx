import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock ToastContext
vi.mock("../../context/ToastContext", () => ({
	useToast: () => ({
		showToast: vi.fn(),
		showError: vi.fn(),
		showSuccess: vi.fn(),
	}),
}));

import type { Task, TaskGroup } from "../../type";
import TaskCard from "./TaskCard";

// Mock the Tauri API
vi.mock("../../tauri/to_do_list_api", () => ({
	updateTask: vi.fn(() => Promise.resolve()),
	deleteTask: vi.fn(() => Promise.resolve()),
}));

// Mock window.confirm
vi.stubGlobal(
	"confirm",
	vi.fn(() => true),
);

describe("TaskCard", () => {
	const mockOnRefresh = vi.fn();
	const mockTaskGroups: TaskGroup[] = [
		{ id: "group-1", name: "Work", tasks: [], created_at: "" },
	];

	const createMockTask = (overrides: Partial<Task> = {}): Task => ({
		id: "task-1",
		description: "Test Task",
		details: "",
		completed: false,
		subtasks: [],
		progress: 0,
		start_datetime: undefined,
		end_datetime: undefined,
		created_at: new Date().toISOString(),
		updated_at: undefined,
		deleted_at: undefined,
		dependencies: undefined,
		...overrides,
	});

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("renders task description", () => {
		const task = createMockTask({ description: "My Important Task" });
		render(
			<TaskCard
				task={task}
				onRefresh={mockOnRefresh}
				taskGroups={mockTaskGroups}
			/>,
		);

		expect(screen.getByText("My Important Task")).toBeInTheDocument();
	});

	it("shows completed styling when task is completed", () => {
		const task = createMockTask({ completed: true });
		render(
			<TaskCard
				task={task}
				onRefresh={mockOnRefresh}
				taskGroups={mockTaskGroups}
			/>,
		);

		const label = screen.getByText("Test Task");
		expect(label).toHaveClass("line-through");
	});

	it("renders checkbox with correct checked state", () => {
		const task = createMockTask({ completed: true });
		render(
			<TaskCard
				task={task}
				onRefresh={mockOnRefresh}
				taskGroups={mockTaskGroups}
			/>,
		);

		const checkbox = screen.getByRole("checkbox");
		expect(checkbox).toBeChecked();
	});

	it("calls updateTask when checkbox is clicked", async () => {
		const { updateTask } = await import("../../tauri/to_do_list_api");
		const user = userEvent.setup();
		const task = createMockTask({ completed: false });
		render(
			<TaskCard
				task={task}
				onRefresh={mockOnRefresh}
				taskGroups={mockTaskGroups}
			/>,
		);

		const checkbox = screen.getByRole("checkbox");
		await user.click(checkbox);

		expect(updateTask).toHaveBeenCalledWith(
			expect.objectContaining({
				id: "task-1",
				completed: true,
			}),
		);
	});

	it("shows subtask count badge when subtasks exist", () => {
		const task = createMockTask({
			subtasks: [
				{
					id: "sub-1",
					description: "Subtask 1",
					completed: true,
					created_at: "",
					order: 0,
				},
				{
					id: "sub-2",
					description: "Subtask 2",
					completed: false,
					created_at: "",
					order: 1,
				},
			],
		});
		render(
			<TaskCard
				task={task}
				onRefresh={mockOnRefresh}
				taskGroups={mockTaskGroups}
			/>,
		);

		expect(screen.getByText("1/2")).toBeInTheDocument();
	});

	it("shows end date badge when end_datetime is set", () => {
		const task = createMockTask({
			end_datetime: "2026-01-15T00:00:00.000Z",
		});
		render(
			<TaskCard
				task={task}
				onRefresh={mockOnRefresh}
				taskGroups={mockTaskGroups}
			/>,
		);

		// Should show date in some format (1/15 or similar)
		expect(screen.getByText(/1\/15|15/)).toBeInTheDocument();
	});

	it("expands subtasks when card content is clicked", async () => {
		const user = userEvent.setup();
		const task = createMockTask({
			subtasks: [
				{
					id: "sub-1",
					description: "Subtask 1",
					completed: false,
					created_at: "",
					order: 0,
				},
			],
		});
		render(
			<TaskCard
				task={task}
				onRefresh={mockOnRefresh}
				taskGroups={mockTaskGroups}
			/>,
		);

		// Click on description area to expand
		await user.click(screen.getByText("Test Task"));

		// SubTaskCard should now be visible (contains input for new subtask)
		expect(
			screen.getByPlaceholderText(/サブタスク|subtask/i),
		).toBeInTheDocument();
	});
});
