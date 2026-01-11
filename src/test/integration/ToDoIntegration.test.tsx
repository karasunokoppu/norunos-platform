import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import App from "../../App";
import { invoke } from "@tauri-apps/api/core";

// Mock invoke globally for this test suite
vi.mock("@tauri-apps/api/core", () => ({
    invoke: vi.fn(),
}));

describe("ToDo Integration Test", () => {

    beforeEach(() => {
        vi.resetAllMocks();
    });

    it("loads and displays tasks on startup", async () => {
        const mockTasks = [
            {
                id: "1",
                description: "Integration Test Task 1",
                completed: false,
                subtasks: [],
                group_id: "default",
                created_at: new Date().toISOString(),
            },
            {
                id: "2",
                description: "Integration Test Task 2",
                completed: true,
                subtasks: [],
                group_id: "default",
                created_at: new Date().toISOString(),
            },
        ];

        // Mock the backend implementations
        (invoke as any).mockImplementation((cmd: string, _args: any) => {
            if (cmd === "get_tasks") {
                return Promise.resolve(mockTasks);
            }
            if (cmd === "get_task_groups") {
                return Promise.resolve([{ id: "default", name: "Default Group", tasks: ["1", "2"] }])
            }
            return Promise.resolve(null);
        });

        render(<App />);

        // Wait for tasks to load
        await waitFor(() => {
            expect(screen.getByText("Integration Test Task 1")).toBeInTheDocument();
            expect(screen.getByText("Integration Test Task 2")).toBeInTheDocument();
        });

        // Verify task completion status logic (if visible in UI, e.g. checked checkbox)
        // Note: Depends on actual UI implementation, here we just check presence
    });

    it("adds a new task", async () => {
        const initialTasks: any[] = [];
        const newTask = {
            id: "3",
            title: "New Integration Task",
            completed: false,
            subtasks: [],
            group_id: "default",
            created_at: new Date().toISOString(),
        };

        (invoke as any).mockImplementation((cmd: string, _args: any) => {
            if (cmd === "get_tasks") {
                // First call returns empty, subsequent calls could return the new task if we refetch
                // But App usually updates optimistic or refetches. 
                // Let's assume refetch pattern for simplicity in this mock or local state update.
                return Promise.resolve(initialTasks);
            }
            if (cmd === "create_task") {
                initialTasks.push(newTask);
                return Promise.resolve([...initialTasks]); // Return updated list
            }
            if (cmd === "get_task_groups") {
                return Promise.resolve([{ id: "default", name: "Default Group", tasks: ["3"] }])
            }
            return Promise.resolve(null);
        });

        render(<App />);

        // Find input and add task
        // Note: Adjust selector based on actual App UI. Assuming there is a reachable input.
        // If "To Do List" is default view:
        const input = await screen.findByPlaceholderText("タスクの説明を入力...");
        fireEvent.change(input, { target: { value: "New Integration Task" } });
        // TaskInput requires clicking the button, no Enter key handler on input visible
        const addButton = screen.getByText("タスク追加");
        fireEvent.click(addButton);

        // Wait for the new task to appear
        // This implies the App component re-fetches or updates state after create_task
        await waitFor(() => {
            expect(invoke).toHaveBeenCalledWith("create_task", expect.objectContaining({
                taskDto: expect.objectContaining({ description: "New Integration Task" })
            }));
        });
    });
});
