import { useState, useEffect, useCallback } from "react";
import { getTaskGroups, createTaskGroup as apiCreateTaskGroup } from "../../../tauri/to_do_list_api";
import type { Task, TaskGroup } from "../../../type";
import { useToast } from "../../../context/ToastContext";

export const useTaskGroups = (tasks: Task[]) => {
    const [taskGroups, setTaskGroups] = useState<TaskGroup[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { showError, showSuccess } = useToast();

    const fetchGroups = useCallback(() => {
        setIsLoading(true);
        getTaskGroups()
            .then(setTaskGroups)
            .catch((e) => {
                console.error(e);
                showError("グループの取得に失敗しました");
            })
            .finally(() => setIsLoading(false));
    }, [showError]);

    useEffect(() => {
        fetchGroups();
    }, [tasks, fetchGroups]);

    const createTaskGroup = async (name: string) => {
        if (!name.trim()) return false;
        try {
            await apiCreateTaskGroup(name);
            fetchGroups();
            showSuccess("グループを作成しました");
            return true;
        } catch (e) {
            console.error("Failed to create group", e);
            showError("グループの作成に失敗しました");
            return false;
        }
    };

    return { taskGroups, isLoading, fetchGroups, createTaskGroup };
};
