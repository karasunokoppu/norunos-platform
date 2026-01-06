import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NorunoContextMenu from './NorunoContextMenu';

describe('NorunoContextMenu', () => {
    const mockOnClose = vi.fn();
    const mockItems = [
        { label: 'Edit', onClick: vi.fn() },
        { label: 'Delete', onClick: vi.fn(), danger: true },
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        // Reset item click handlers
        mockItems.forEach(item => {
            (item.onClick as ReturnType<typeof vi.fn>).mockClear();
        });
    });

    it('renders menu items', () => {
        render(
            <NorunoContextMenu
                x={100}
                y={100}
                items={mockItems}
                onClose={mockOnClose}
            />
        );

        expect(screen.getByText('Edit')).toBeInTheDocument();
        expect(screen.getByText('Delete')).toBeInTheDocument();
    });

    it('applies danger styling to danger items', () => {
        render(
            <NorunoContextMenu
                x={100}
                y={100}
                items={mockItems}
                onClose={mockOnClose}
            />
        );

        const deleteButton = screen.getByText('Delete');
        expect(deleteButton).toHaveClass('text-danger');
    });

    it('calls onClick handler when item is clicked', async () => {
        const user = userEvent.setup();
        render(
            <NorunoContextMenu
                x={100}
                y={100}
                items={mockItems}
                onClose={mockOnClose}
            />
        );

        await user.click(screen.getByText('Edit'));

        expect(mockItems[0].onClick).toHaveBeenCalled();
    });

    it('calls onClose after item click', async () => {
        const user = userEvent.setup();
        render(
            <NorunoContextMenu
                x={100}
                y={100}
                items={mockItems}
                onClose={mockOnClose}
            />
        );

        await user.click(screen.getByText('Edit'));

        expect(mockOnClose).toHaveBeenCalled();
    });

    it('calls onClose when clicking the overlay', async () => {
        const user = userEvent.setup();
        render(
            <NorunoContextMenu
                x={100}
                y={100}
                items={mockItems}
                onClose={mockOnClose}
            />
        );

        // Find and click the overlay (the first menu role element which is the backdrop)
        const menus = screen.getAllByRole('menu');
        const overlay = menus[0]; // First one is the overlay
        await user.click(overlay);

        expect(mockOnClose).toHaveBeenCalled();
    });

    it('renders at specified position', () => {
        render(
            <NorunoContextMenu
                x={150}
                y={200}
                items={mockItems}
                onClose={mockOnClose}
            />
        );

        // Find the menu container (the one with style)
        const menus = screen.getAllByRole('menu');
        const menuContainer = menus[1]; // Second one is the actual menu

        expect(menuContainer).toHaveStyle({ left: '150px', top: '200px' });
    });
});
