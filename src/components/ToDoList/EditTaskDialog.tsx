import React, { useState, useEffect } from "react";
import { Task } from "../../type";
import NorunoDatePicker from "../../ui/NorunoDatePicker";

interface EditTaskDialogProps {
    task: Task;
    isOpen: boolean;
    onClose: () => void;
    onSave: (updatedTask: Task) => void;
}

const EditTaskDialog: React.FC<EditTaskDialogProps> = ({ task, isOpen, onClose, onSave }) => {
    const [description, setDescription] = useState(task.description);
    // Format: "YYYY-MM-DD HH:mm" for internal state and DatePicker
    const formatToPicker = (isoString?: string) => {
        if (!isoString) return "";
        return isoString.replace("T", " ").substring(0, 16); // "YYYY-MM-DD HH:mm"
    };

    const [startDate, setStartDate] = useState(formatToPicker(task.start_datetime));
    const [endDate, setEndDate] = useState(formatToPicker(task.end_datetime));
    const [isStartDatePickerOpen, setIsStartDatePickerOpen] = useState(false);
    const [isEndDatePickerOpen, setIsEndDatePickerOpen] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setDescription(task.description);
            setStartDate(formatToPicker(task.start_datetime));
            setEndDate(formatToPicker(task.end_datetime));
        }
    }, [isOpen, task]);

    const handleSave = () => {
        // Convert "YYYY-MM-DD HH:mm" (Local) to ISO 8601 with timezone (UTC) e.g. "2024-01-01T03:00:00.000Z"
        const formatToISO = (pickerDate: string) => {
            if (!pickerDate) return undefined;
            const date = new Date(pickerDate.replace(" ", "T"));
            if (isNaN(date.getTime())) return undefined; // Invalid date check
            return date.toISOString();
        };

        const updatedTask = {
            ...task,
            description,
            start_datetime: formatToISO(startDate),
            end_datetime: formatToISO(endDate),
        };
        onSave(updatedTask);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
            <div className="bg-bg-primary p-6 rounded-lg shadow-xl w-96 border border-border-primary text-text-primary">
                <h3 className="text-lg font-bold mb-4">Edit Task</h3>

                <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Task Name</label>
                    <input
                        type="text"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full bg-bg-secondary border border-border-primary rounded px-3 py-2 focus:outline-none focus:border-accent-primary"
                    />
                </div>

                <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Start Date</label>
                    <div
                        className="w-full bg-bg-secondary border border-border-primary rounded px-3 py-2 cursor-pointer"
                        onClick={() => setIsStartDatePickerOpen(true)}
                    >
                        {startDate || "Select Start Date"}
                    </div>
                    {isStartDatePickerOpen && (
                        <NorunoDatePicker
                            value={startDate}
                            onChange={(date) => setStartDate(date)}
                            onClose={() => setIsStartDatePickerOpen(false)}
                        />
                    )}
                </div>

                <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">End Date</label>
                    <div
                        className="w-full bg-bg-secondary border border-border-primary rounded px-3 py-2 cursor-pointer"
                        onClick={() => setIsEndDatePickerOpen(true)}
                    >
                        {endDate || "Select End Date"}
                    </div>
                    {isEndDatePickerOpen && (
                        <NorunoDatePicker
                            value={endDate}
                            onChange={(date) => setEndDate(date)}
                            onClose={() => setIsEndDatePickerOpen(false)}
                        />
                    )}
                </div>

                <div className="flex justify-end gap-2 mt-6">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm bg-bg-secondary hover:bg-bg-hover rounded"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-4 py-2 text-sm bg-accent-primary text-text-on-accent hover:bg-accent-primary/90 rounded"
                    >
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EditTaskDialog;
