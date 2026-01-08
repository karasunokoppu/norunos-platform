import type React from "react";
import type { Task } from "../../type";

const ROW_HEIGHT = 40;

interface GroupData {
    id: string;
    name: string;
    tasks: Task[];
}

interface GanttSidebarProps {
    groupedData: GroupData[];
    sidebarWidth: number;
    sidebarRef: React.RefObject<HTMLDivElement | null>;
}

const GanttSidebar: React.FC<GanttSidebarProps> = ({
    groupedData,
    sidebarWidth,
    sidebarRef,
}) => {
    return (
        <div
            className="shrink-0 overflow-hidden border-r border-border-primary bg-bg-primary"
            style={{ width: sidebarWidth }}
            ref={sidebarRef}
        >
            {groupedData.map((group) => (
                <div key={group.id}>
                    {/* Group Header */}
                    <div
                        className="flex items-center pl-2 font-bold bg-bg-tertiary border-b border-border-secondary text-text-secondary sticky"
                        style={{ height: ROW_HEIGHT }}
                    >
                        {group.name}
                    </div>
                    {/* Tasks */}
                    {group.tasks.map((task) => (
                        <div
                            key={task.id}
                            className="flex items-center pl-6 border-b border-border-secondary truncate pr-2 hover:bg-bg-hover text-sm"
                            style={{ height: ROW_HEIGHT }}
                            title={task.description}
                        >
                            {task.description}
                        </div>
                    ))}
                </div>
            ))}
            {groupedData.length === 0 && (
                <div className="p-4 text-text-secondary">
                    スケジュールされたタスクはありません
                </div>
            )}
        </div>
    );
};

export default GanttSidebar;
