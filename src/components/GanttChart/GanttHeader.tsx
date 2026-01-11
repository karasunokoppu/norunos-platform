import type React from "react";

interface GanttHeaderProps {
    totalDays: number;
    pixelsPerDay: number;
    minDate: Date;
    sidebarWidth: number;
    headerRef: React.RefObject<HTMLDivElement | null>;
    formatDate: (date: Date) => string;
}

const GanttHeader: React.FC<GanttHeaderProps> = ({
    totalDays,
    pixelsPerDay,
    minDate,
    sidebarWidth,
    headerRef,
    formatDate,
}) => {
    const chartWidth = totalDays * pixelsPerDay;

    return (
        <div className="flex flex-row border-b border-border-primary bg-bg-primary z-20 shrink-0 h-[40px]">
            <div
                className="shrink-0 flex items-center pl-4 font-bold border-r border-border-primary"
                style={{ width: sidebarWidth }}
            >
                Task Name
            </div>
            <div className="flex-1 overflow-hidden" ref={headerRef}>
                <div className="flex h-full" style={{ width: chartWidth }}>
                    {Array.from({ length: totalDays }).map((_, i) => {
                        const d = new Date(minDate);
                        d.setDate(d.getDate() + i);
                        const isToday = new Date().toDateString() === d.toDateString();
                        return (
                            <div
                                key={i}
                                className={`shrink-0 flex justify-center items-center border-r border-border-secondary text-xs ${isToday ? "bg-accent-light text-accent-secondary font-bold" : ""}`}
                                style={{ width: pixelsPerDay }}
                            >
                                {formatDate(d)}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default GanttHeader;
