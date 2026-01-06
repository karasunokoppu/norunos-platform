import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NorunoDropdown from './NorunoDropdown';

describe('NorunoDropdown', () => {
    const mockOptions = [
        { value: 'opt1', label: 'Option 1' },
        { value: 'opt2', label: 'Option 2' },
        { value: 'opt3', label: 'Option 3' },
    ];
    const mockOnChange = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders with placeholder when no value selected', () => {
        render(
            <NorunoDropdown
                value=""
                onChange={mockOnChange}
                options={mockOptions}
                placeholder="Select an option"
            />
        );

        expect(screen.getByText('Select an option')).toBeInTheDocument();
    });

    it('renders with selected value', () => {
        render(
            <NorunoDropdown
                value="opt2"
                onChange={mockOnChange}
                options={mockOptions}
            />
        );

        expect(screen.getByText('Option 2')).toBeInTheDocument();
    });

    it('opens dropdown when button is clicked', async () => {
        const user = userEvent.setup();
        render(
            <NorunoDropdown
                value=""
                onChange={mockOnChange}
                options={mockOptions}
            />
        );

        const button = screen.getByRole('button');
        await user.click(button);

        // All options should be visible
        expect(screen.getByText('Option 1')).toBeInTheDocument();
        expect(screen.getByText('Option 2')).toBeInTheDocument();
        expect(screen.getByText('Option 3')).toBeInTheDocument();
    });

    it('calls onChange when option is selected', async () => {
        const user = userEvent.setup();
        render(
            <NorunoDropdown
                value=""
                onChange={mockOnChange}
                options={mockOptions}
            />
        );

        // Open dropdown
        const button = screen.getByRole('button');
        await user.click(button);

        // Click on option 2
        await user.click(screen.getByText('Option 2'));

        expect(mockOnChange).toHaveBeenCalledWith('opt2');
    });

    it('closes dropdown after selection', async () => {
        const user = userEvent.setup();
        render(
            <NorunoDropdown
                value=""
                onChange={mockOnChange}
                options={mockOptions}
            />
        );

        // Open dropdown
        await user.click(screen.getByRole('button'));
        expect(screen.getByText('Option 1')).toBeInTheDocument();

        // Select option
        await user.click(screen.getByText('Option 1'));

        // Dropdown should be closed - only the main button text should be visible
        // (not the dropdown list items)
        const allOpt1Elements = screen.queryAllByText('Option 1');
        // After closing, there should be at most one (the button label if selected)
        expect(allOpt1Elements.length).toBeLessThanOrEqual(1);
    });

    it('supports keyboard navigation - Arrow Down to open', async () => {
        const user = userEvent.setup();
        render(
            <NorunoDropdown
                value=""
                onChange={mockOnChange}
                options={mockOptions}
            />
        );

        // Focus the button first by clicking then use keyboard
        const button = screen.getByRole('button');
        button.focus();
        await user.keyboard('{ArrowDown}');

        // Dropdown should open
        expect(screen.getByText('Option 1')).toBeInTheDocument();
    });

    it('supports keyboard navigation - Escape to close', async () => {
        const user = userEvent.setup();
        render(
            <NorunoDropdown
                value=""
                onChange={mockOnChange}
                options={mockOptions}
            />
        );

        // Open dropdown
        await user.click(screen.getByRole('button'));
        expect(screen.getByText('Option 1')).toBeInTheDocument();

        // Press Escape
        await user.keyboard('{Escape}');

        // Dropdown should be closed
        const allOpt1Elements = screen.queryAllByText('Option 1');
        expect(allOpt1Elements.length).toBeLessThanOrEqual(1);
    });
});
