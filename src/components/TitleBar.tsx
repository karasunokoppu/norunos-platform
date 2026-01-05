import React from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { Minus, Square, X, Copy } from 'lucide-react';

interface TitleBarProps {
    isMaximized: boolean;
}

const TitleBar: React.FC<TitleBarProps> = ({ isMaximized }) => {
    const appWindow = getCurrentWindow();

    const handleMinimize = () => {
        appWindow.minimize();
    };

    const handleMaximize = async () => {
        // Explicitly check current state and toggle
        // We can use the prop 'isMaximized' directly or check appWindow again for safety.
        // Checking appWindow is safer for the action logic.
        const isMax = await appWindow.isMaximized();
        if (isMax) {
            await appWindow.unmaximize();
        } else {
            await appWindow.maximize();
        }
        // State update will happen via parent's event listener
    };

    const handleClose = () => {
        appWindow.close();
    };

    return (
        <div className={`h-10 bg-bg-primary border-b border-border-primary flex justify-between items-center select-none flex-shrink-0 ${isMaximized ? '' : 'rounded-t-lg'}`}>
            {/* Drag Region - Takes up available space */}
            <div data-tauri-drag-region className="flex-1 flex items-center h-full px-4 text-sm font-medium text-text-secondary">
                {/* <span className="mr-2 pointer-events-none">Noruno Platform</span> */}
            </div>

            {/* Window Controls - No drag region */}
            <div className="flex h-full z-10">
                <button
                    onClick={handleMinimize}
                    className="w-12 h-full inline-flex justify-center items-center hover:bg-bg-tertiary text-text-secondary transition-colors focus:outline-none"
                    tabIndex={-1}
                >
                    <Minus size={16} />
                </button>
                <button
                    onClick={handleMaximize}
                    className="w-12 h-full inline-flex justify-center items-center hover:bg-bg-tertiary text-text-secondary transition-colors focus:outline-none"
                    tabIndex={-1}
                >
                    {isMaximized ? <Copy size={14} className="transform rotate-180" /> : <Square size={14} />}
                    {/* Copy icon rotated somewhat resembles restore icon */}
                </button>
                <button
                    onClick={handleClose}
                    className={`w-12 h-full inline-flex justify-center items-center hover:bg-red-500 hover:text-white text-text-secondary transition-colors focus:outline-none ${isMaximized ? '' : 'rounded-tr-lg'}`}
                    tabIndex={-1}
                >
                    <X size={16} />
                </button>
            </div>
        </div>
    );
};

export default TitleBar;
