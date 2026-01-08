import { invoke } from "@tauri-apps/api/core";
import { AlertTriangle, BookOpen, Clock, FileText } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import type { Task } from "../../type";
import type { Book } from "../../type/books";
import { getTasks } from "../../tauri/to_do_list_api";
import { type FileNode, getNotesTree } from "../../tauri/notes_api";

interface DashboardViewProps {
	tasks?: Task[];
}

// 日付ユーティリティ関数
const isToday = (dateStr: string): boolean => {
	const date = new Date(dateStr);
	const today = new Date();
	return date.toDateString() === today.toDateString();
};

const isThisWeek = (dateStr: string): boolean => {
	const date = new Date(dateStr);
	const today = new Date();
	const startOfWeek = new Date(today);
	startOfWeek.setDate(today.getDate() - today.getDay());
	startOfWeek.setHours(0, 0, 0, 0);
	const endOfWeek = new Date(startOfWeek);
	endOfWeek.setDate(startOfWeek.getDate() + 7);
	return date >= startOfWeek && date < endOfWeek;
};

const isOverdue = (dateStr: string): boolean => {
	const date = new Date(dateStr);
	const now = new Date();
	return date < now;
};

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
				// タスクが渡されていない場合は取得
				if (!propTasks || propTasks.length === 0) {
					const fetchedTasks = await getTasks();
					setTasks(fetchedTasks);
				}

				// 本を取得
				const fetchedBooks = await invoke<Book[]>("get_books");
				setBooks(fetchedBooks);

				// ノートを取得
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
	const upcomingTasks = tasks.filter((t) => {
		if (t.completed) return false;
		const endDate = t.end_datetime || t.start_datetime;
		if (!endDate) return false;
		return isToday(endDate) || isThisWeek(endDate);
	}).sort((a, b) => {
		const dateA = a.end_datetime || a.start_datetime || "";
		const dateB = b.end_datetime || b.start_datetime || "";
		return new Date(dateA).getTime() - new Date(dateB).getTime();
	}).slice(0, 5);

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
			<h2 className="text-2xl font-bold text-text-primary mb-6">ダッシュボード</h2>

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
				{/* 今日/今週の予定タスク */}
				<div className="bg-bg-primary p-6 rounded-lg shadow-md border border-border-primary">
					<div className="flex items-center gap-2 mb-4">
						<Clock className="text-accent-secondary" size={20} />
						<h3 className="text-lg font-bold text-text-primary">
							今日/今週の予定
						</h3>
					</div>
					{upcomingTasks.length === 0 ? (
						<p className="text-text-tertiary text-sm">
							今週の予定タスクはありません
						</p>
					) : (
						<div className="space-y-2">
							{upcomingTasks.map((task) => {
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

				{/* 読書進捗 */}
				<div className="bg-bg-primary p-6 rounded-lg shadow-md border border-border-primary">
					<div className="flex items-center gap-2 mb-4">
						<BookOpen className="text-accent-secondary" size={20} />
						<h3 className="text-lg font-bold text-text-primary">読書中の本</h3>
					</div>
					{readingBooks.length === 0 ? (
						<p className="text-text-tertiary text-sm">
							現在読んでいる本はありません
						</p>
					) : (
						<div className="space-y-4">
							{readingBooks.slice(0, 3).map((book) => {
								const progressPercent =
									book.total_pages > 0
										? Math.round((book.current_page / book.total_pages) * 100)
										: 0;
								return (
									<div key={book.id} className="p-3 bg-bg-secondary rounded">
										<div className="flex justify-between items-center mb-2">
											<span className="text-text-primary text-sm font-medium truncate max-w-[70%]">
												{book.title}
											</span>
											<span className="text-xs text-accent-primary">
												{progressPercent}%
											</span>
										</div>
										<div className="w-full bg-bg-tertiary rounded-full h-2">
											<div
												className="bg-accent-primary h-2 rounded-full transition-all"
												style={{ width: `${progressPercent}%` }}
											/>
										</div>
										<div className="text-xs text-text-tertiary mt-1">
											{book.current_page} / {book.total_pages} ページ
										</div>
									</div>
								);
							})}
						</div>
					)}
				</div>

				{/* 最近のノート */}
				<div className="bg-bg-primary p-6 rounded-lg shadow-md border border-border-primary lg:col-span-2">
					<div className="flex items-center gap-2 mb-4">
						<FileText className="text-accent-secondary" size={20} />
						<h3 className="text-lg font-bold text-text-primary">
							最近のノート
						</h3>
					</div>
					{recentNotes.length === 0 ? (
						<p className="text-text-tertiary text-sm">ノートがありません</p>
					) : (
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
							{recentNotes.map((note) => (
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
			</div>
		</div>
	);
};

export default DashboardView;
