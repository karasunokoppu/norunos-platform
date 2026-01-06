import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TaskInput from './TaskInput';

// Mock the Tauri API
vi.mock('../../tauri/to_do_list_api', () => ({
    createTask: vi.fn(() => Promise.resolve()),
}));

describe('TaskInput', () => {
    const mockOnRefresh = vi.fn();
    const mockTaskGroups = [
        { id: 'group-1', name: 'Work' },
        { id: 'group-2', name: 'Personal' },
    ];

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders the input field and button', () => {
        render(<TaskInput onRefresh={mockOnRefresh} taskGroups={mockTaskGroups} />);

        expect(screen.getByPlaceholderText('タスクの説明を入力...')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'タスク追加' })).toBeInTheDocument();
    });

    it('expands the form when input is focused', async () => {
        const user = userEvent.setup();
        render(<TaskInput onRefresh={mockOnRefresh} taskGroups={mockTaskGroups} />);

        const input = screen.getByPlaceholderText('タスクの説明を入力...');
        await user.click(input);

        // Check that expanded content is visible
        expect(screen.getByText('開始日:')).toBeInTheDocument();
        expect(screen.getByText('終了日:')).toBeInTheDocument();
        expect(screen.getByText('グループ:')).toBeInTheDocument();
    });

    it('updates description value when typing', async () => {
        const user = userEvent.setup();
        render(<TaskInput onRefresh={mockOnRefresh} taskGroups={mockTaskGroups} />);

        const input = screen.getByPlaceholderText('タスクの説明を入力...');
        await user.type(input, 'New Task');

        expect(input).toHaveValue('New Task');
    });

    it('collapses the form when collapse button is clicked', async () => {
        const user = userEvent.setup();
        render(<TaskInput onRefresh={mockOnRefresh} taskGroups={mockTaskGroups} />);

        // Expand
        const input = screen.getByPlaceholderText('タスクの説明を入力...');
        await user.click(input);
        expect(screen.getByText('開始日:')).toBeInTheDocument();

        // Find and click collapse button (the one with the up arrow SVG)
        const buttons = screen.getAllByRole('button');
        const collapseButton = buttons.find(btn => btn.querySelector('svg path[d="M5 15l7-7 7 7"]'));
        if (collapseButton) {
            await user.click(collapseButton);
        }

        // Check collapsed - the date labels should not be visible
        expect(screen.queryByText('開始日:')).not.toBeInTheDocument();
    });

    it('does not create task when description is empty', async () => {
        const { createTask } = await import('../../tauri/to_do_list_api');
        const user = userEvent.setup();
        render(<TaskInput onRefresh={mockOnRefresh} taskGroups={mockTaskGroups} />);

        const addButton = screen.getByRole('button', { name: 'タスク追加' });
        await user.click(addButton);

        expect(createTask).not.toHaveBeenCalled();
        expect(mockOnRefresh).not.toHaveBeenCalled();
    });
});
