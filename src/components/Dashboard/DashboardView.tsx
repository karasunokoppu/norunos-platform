import type React from "react";
import { Task } from "../../type";

interface DashboardViewProps {
	tasks?: Task[];
}

const DashboardView: React.FC<DashboardViewProps> = ({ tasks = [] }) => {
	const totalTasks = tasks.length;
	const completedTasks = tasks.filter((t) => t.completed).length;
	const pendingTasks = totalTasks - completedTasks;
	const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

	return (
		<div className="h-full w-full p-8 bg-bg-secondary overflow-auto">
			<h2 className="text-2xl font-bold text-text-primary mb-6">Dashboard</h2>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
				{/* Summary Cards */}
				<div className="bg-bg-primary p-6 rounded-lg shadow-md border border-border-primary">
					<h3 className="text-lg font-semibold text-text-secondary mb-2">Total Tasks</h3>
					<p className="text-3xl font-bold text-accent-primary">{totalTasks}</p>
				</div>
				<div className="bg-bg-primary p-6 rounded-lg shadow-md border border-border-primary">
					<h3 className="text-lg font-semibold text-text-secondary mb-2">Completed</h3>
					<p className="text-3xl font-bold text-green-500">{completedTasks}</p>
				</div>
				<div className="bg-bg-primary p-6 rounded-lg shadow-md border border-border-primary">
					<h3 className="text-lg font-semibold text-text-secondary mb-2">Pending</h3>
					<p className="text-3xl font-bold text-yellow-500">{pendingTasks}</p>
				</div>
				<div className="bg-bg-primary p-6 rounded-lg shadow-md border border-border-primary">
					<h3 className="text-lg font-semibold text-text-secondary mb-2">Progress</h3>
					<p className="text-3xl font-bold text-blue-500">{progress}%</p>
				</div>
			</div>

			{/* Recent Tasks? Maybe later */}
		</div>
	);
};

export default DashboardView;
