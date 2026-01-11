import { FileText } from "lucide-react";
import type React from "react";
import type { FileNode } from "../../tauri/notes_api";

interface RecentNotesWidgetProps {
    notes: FileNode[];
}

const RecentNotesWidget: React.FC<RecentNotesWidgetProps> = ({ notes }) => {
    return (
        <div className="bg-bg-primary p-6 rounded-lg shadow-md border border-border-primary lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
                <FileText className="text-accent-secondary" size={20} />
                <h3 className="text-lg font-bold text-text-primary">最近のノート</h3>
            </div>
            {notes.length === 0 ? (
                <p className="text-text-tertiary text-sm">ノートがありません</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {notes.map((note) => (
                        <div
                            key={note.path}
                            className="flex items-center gap-2 p-3 bg-bg-secondary rounded hover:bg-bg-tertiary transition-colors cursor-pointer"
                        >
                            <FileText className="text-text-tertiary" size={16} />
                            <span className="text-text-primary text-sm truncate">
                                {note.name.replace(".md", "")}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default RecentNotesWidget;
