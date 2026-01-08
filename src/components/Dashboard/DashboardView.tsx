import { invoke } from "@tauri-apps/api/core";
import { AlertTriangle } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import type { Task } from "../../type";
import type { Book } from "../../type/books";
import { getTasks } from "../../tauri/to_do_list_api";
import { type FileNode, getNotesTree } from "../../tauri/notes_api";
import { isOverdue, isThisWeek, isToday } from "../../utils/dateUtils";
import ReadingProgressWidget from "./ReadingProgressWidget";
import RecentNotesWidget from "./RecentNotesWidget";
import UpcomingTasksWidget from "./UpcomingTasksWidget";

interface DashboardViewProps {
	tasks?: Task[];
}

// ノートファイルをフラットに収集
const collectNotes = (nodes: FileNode[]): FileNode[] => {
	const notes: FileNode[] = [];
	const traverse = (items: FileNode[]) => {
		for (const item of items) {
			if (!item.is_dir && item.name.endsWith(".md")) {
				notes.push(item);
			}
			if (item.children) {
				traverse(item.children);
			}
		}
	};
	traverse(nodes);
	return notes;
};

const DashboardView: React.FC<DashboardViewProps> = ({ tasks: propTasks }) => {
	const [tasks, setTasks] = useState<Task[]>(propTasks || []);
	const [books, setBooks] = useState<Book[]>([]);
	const [recentNotes, setRecentNotes] = useState<FileNode[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchData = async () => {
			try {
				if (!propTasks || propTasks.length === 0) {
					const fetchedTasks = await getTasks();
					setTasks(fetchedTasks);
				}

				const fetchedBooks = await invoke<Book[]>("get_books");
				setBooks(fetchedBooks);

				const notesTree = await getNotesTree();
				const allNotes = collectNotes(notesTree);
				setRecentNotes(allNotes.slice(0, 5));
			} catch (error) {
				console.error("Dashboard data fetch error:", error);
			} finally {
				setLoading(false);
			}
		};
		fetchData();
	}, [propTasks]);

	// 統計計算
	const totalTasks = tasks.length;
	const completedTasks = tasks.filter((t) => t.completed).length;
	const pendingTasks = totalTasks - completedTasks;
	const progress =
		totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

	// 今日/今週のタスク
	const upcomingTasks = tasks
		.filter((t) => {
			if (t.completed) return false;
			const endDate = t.end_datetime || t.start_datetime;
			if (!endDate) return false;
			return isToday(endDate) || isThisWeek(endDate);
		})
		.sort((a, b) => {
			const dateA = a.end_datetime || a.start_datetime || "";
			const dateB = b.end_datetime || b.start_datetime || "";
			return new Date(dateA).getTime() - new Date(dateB).getTime();
		})
		.slice(0, 5);

	// 期限超過タスク
	const overdueTasks = tasks.filter((t) => {
		if (t.completed) return false;
		if (!t.end_datetime) return false;
		return isOverdue(t.end_datetime);
	});

	// 読書中の本
	const readingBooks = books.filter((b) => b.status === "Reading");

	if (loading) {
		return (
			<div className="h-full w-full p-8 bg-bg-secondary flex items-center justify-center">
				<div className="text-text-secondary">読み込み中...</div>
			</div>
		);
	}

	return (
		<div className="h-full w-full p-8 bg-bg-secondary overflow-auto">
			<h2 className="text-2xl font-bold text-text-primary mb-6">
				ダッシュボード
			</h2>

			{/* 統計カード */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
				<div className="bg-bg-primary p-6 rounded-lg shadow-md border border-border-primary">
					<h3 className="text-lg font-semibold text-text-secondary mb-2">
						全タスク
					</h3>
					<p className="text-3xl font-bold text-accent-primary">{totalTasks}</p>
				</div>
				<div className="bg-bg-primary p-6 rounded-lg shadow-md border border-border-primary">
					<h3 className="text-lg font-semibold text-text-secondary mb-2">
						完了
					</h3>
					<p className="text-3xl font-bold text-green-500">{completedTasks}</p>
				</div>
				<div className="bg-bg-primary p-6 rounded-lg shadow-md border border-border-primary">
					<h3 className="text-lg font-semibold text-text-secondary mb-2">
						未完了
					</h3>
					<p className="text-3xl font-bold text-yellow-500">{pendingTasks}</p>
				</div>
				<div className="bg-bg-primary p-6 rounded-lg shadow-md border border-border-primary">
					<h3 className="text-lg font-semibold text-text-secondary mb-2">
						進捗
					</h3>
					<p className="text-3xl font-bold text-blue-500">{progress}%</p>
				</div>
			</div>

			{/* 警告：期限超過タスク */}
			{overdueTasks.length > 0 && (
				<div className="mb-8 bg-red-900/20 border border-red-500/50 rounded-lg p-4">
					<div className="flex items-center gap-2 mb-3">
						<AlertTriangle className="text-red-500" size={20} />
						<h3 className="text-lg font-bold text-red-400">
							期限超過タスク ({overdueTasks.length}件)
						</h3>
					</div>
					<div className="space-y-2">
						{overdueTasks.slice(0, 5).map((task) => (
							<div
								key={task.id}
								className="flex justify-between items-center bg-bg-primary/50 p-3 rounded"
							>
								<span className="text-text-primary">{task.description}</span>
								<span className="text-sm text-red-400">
									{task.end_datetime
										? new Date(task.end_datetime).toLocaleDateString()
										: ""}
								</span>
							</div>
						))}
					</div>
				</div>
			)}

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<UpcomingTasksWidget tasks={upcomingTasks} />
				<ReadingProgressWidget books={readingBooks} />
				<RecentNotesWidget notes={recentNotes} />
			</div>
		</div>
	);
};

export default DashboardView;
