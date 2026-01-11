import type React from "react";
import type { Task } from "../../type";

const ROW_HEIGHT = 40;

interface GanttTaskBarProps {
    task: Task;
    x: number;
    width: number;
    progressPercent: number;
    isLinkSource: boolean;
    linkMode: boolean;
    onMouseDown: (e: React.MouseEvent, task: Task) => void;
    onResizeMouseDown: (e: React.MouseEvent, task: Task) => void;
}

const GanttTaskBar: React.FC<GanttTaskBarProps> = ({
    task,
    x,
    width,
    progressPercent,
    isLinkSource,
    linkMode,
    onMouseDown,
    onResizeMouseDown,
}) => {
    return (
        <div
            className="relative border-b border-transparent hover:bg-black/5"
            style={{ height: ROW_HEIGHT }}
        >
            <div
                className={`absolute ml-1 rounded-md shadow-sm overflow-hidden bg-bg-tertiary top-1 ${linkMode ? "cursor-crosshair" : "cursor-grab active:cursor-grabbing"} ${isLinkSource ? "ring-2 ring-accent-primary" : ""}`}
                style={{
                    left: x,
                    width: width - 4,
                    height: ROW_HEIGHT - 8,
                }}
                title={`${task.description} (${Math.round(progressPercent)}%)`}
                onMouseDown={(e) => onMouseDown(e, task)}
            >
                <div
                    className="h-full bg-accent-primary opacity-80"
                    style={{ width: `${progressPercent}%` }}
                />
                <div
                    className={`absolute right-0 top-0 bottom-0 w-2 z-20 hover:bg-black/20 ${linkMode ? "" : "cursor-e-resize"}`}
                    onMouseDown={(e) => {
                        if (!linkMode) onResizeMouseDown(e, task);
                    }}
                />
            </div>
        </div>
    );
};

export default GanttTaskBar;
