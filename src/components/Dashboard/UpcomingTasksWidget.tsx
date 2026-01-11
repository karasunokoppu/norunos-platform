import { Clock } from "lucide-react";
import type React from "react";
import type { Task } from "../../type";
import { isToday } from "../../utils/dateUtils";

interface UpcomingTasksWidgetProps {
    tasks: Task[];
}

const UpcomingTasksWidget: React.FC<UpcomingTasksWidgetProps> = ({ tasks }) => {
    return (
        <div className="bg-bg-primary p-6 rounded-lg shadow-md border border-border-primary">
            <div className="flex items-center gap-2 mb-4">
                <Clock className="text-accent-secondary" size={20} />
                <h3 className="text-lg font-bold text-text-primary">今日/今週の予定</h3>
            </div>
            {tasks.length === 0 ? (
                <p className="text-text-tertiary text-sm">
                    今週の予定タスクはありません
                </p>
            ) : (
                <div className="space-y-2">
                    {tasks.map((task) => {
                        const dateStr = task.end_datetime || task.start_datetime || "";
                        const isTaskToday = dateStr && isToday(dateStr);
                        return (
                            <div
                                key={task.id}
                                className="flex justify-between items-center p-3 bg-bg-secondary rounded"
                            >
                                <span className="text-text-primary text-sm">
                                    {task.description}
                                </span>
                                <span
                                    className={`text-xs px-2 py-1 rounded ${isTaskToday
                                            ? "bg-accent-primary/20 text-accent-primary"
                                            : "bg-bg-tertiary text-text-secondary"
                                        }`}
                                >
                                    {dateStr ? new Date(dateStr).toLocaleDateString() : ""}
                                </span>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default UpcomingTasksWidget;
