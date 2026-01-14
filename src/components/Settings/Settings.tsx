import { save, open } from "@tauri-apps/plugin-dialog";
import { relaunch } from "@tauri-apps/plugin-process";
import { exportBackup, importBackup } from "../../tauri/backup_api";
import { sendNotification } from "../../utils/notification";
import { getName, getVersion } from "@tauri-apps/api/app";
import { useEffect, useState } from "react";

const SettingsView = () => {
	const [statusMessage, setStatusMessage] = useState("");
	const [appVersion, setAppVersion] = useState("");
	const [appName, setAppName] = useState("");

	useEffect(() => {
		async function fetchAppInfo() {
			try {
				const v = await getVersion();
				const n = await getName();
				setAppVersion(v);
				setAppName(n);
			} catch (e) {
				console.error("Failed to get app info", e);
			}
		}
		fetchAppInfo();
	}, []);

	const handleExport = async () => {
		try {
			const path = await save({
				filters: [
					{
						name: "Norunos Backup",
						extensions: ["zip"],
					},
				],
				defaultPath: "norunos_backup.zip",
			});

			if (path) {
				setStatusMessage("Backing up...");
				await exportBackup(path);
				setStatusMessage(`Backup saved to: ${path} `);
			}
		} catch (e) {
			setStatusMessage(`Export failed: ${e} `);
		}
	};

	const handleImport = async () => {
		try {
			const path = await open({
				filters: [
					{
						name: "Norunos Backup",
						extensions: ["zip"],
					},
				],
			});

			if (path) {
				if (
					!confirm(
						"This will OVERWRITE your current data with the backup. Use with caution.\nAre you sure?",
					)
				)
					return;

				setStatusMessage("Restoring backup...");
				// cast path to string if needed, although open usually returns string or string[] | null
				// Assuming single selection
				const filePath = Array.isArray(path) ? path[0] : path;
				if (!filePath) return;

				await importBackup(filePath);

				if (import.meta.env.DEV) {
					setStatusMessage("Restore complete! Please restart the terminal manually (Dev Mode).");
					alert("Import successful.\n\nSince you are in Development Mode, please manually stop (Ctrl+C) and restart 'npm run tauri dev' to apply the database changes.");
				} else {
					setStatusMessage("Restore complete! Restarting app...");
					setTimeout(async () => {
						await relaunch();
					}, 1500);
				}
			}
		} catch (e) {
			setStatusMessage(`Import failed: ${e} `);
		}
	};

	const handleTestNotification = async () => {
		try {
			await sendNotification(
				"Test Notification",
				"This is a test message from settings!",
			);
		} catch (e) {
			alert(`Debug Error: ${e} `);
		}
	};

	return (
		<div className="p-4 bg-bg-primary text-text-primary h-full overflow-y-auto">
			<h2 className="text-xl font-bold mb-4">設定</h2>

			<section className="mb-8 border-b border-border-primary pb-6">
				<h3 className="text-lg font-semibold mb-4">Data Management</h3>

				<div className="flex flex-col gap-4 max-w-lg">
					<p className="text-sm text-text-secondary">
						Manually backup your data to a ZIP file or restore from an existing backup.
					</p>

					<div className="flex gap-4">
						<button
							type="button"
							onClick={handleExport}
							className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors shadow-sm font-medium"
						>
							Export Data
						</button>
						<button
							type="button"
							onClick={handleImport}
							className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors shadow-sm font-medium"
						>
							Import Data
						</button>
					</div>
				</div>

				{statusMessage && (
					<div className="mt-4 p-3 bg-bg-secondary rounded border border-border-primary text-sm whitespace-pre-wrap font-mono select-text">
						{statusMessage}
					</div>
				)}
			</section>

			<section className="mb-6">
				<h3 className="text-lg font-semibold mb-2">システム</h3>
				<div className="flex flex-col gap-2">
					<button
						type="button"
						onClick={handleTestNotification}
						className="px-4 py-2 bg-accent-secondary text-white rounded hover:bg-accent-hover w-fit transition-colors"
					>
						Test Notification
					</button>

					<p className="text-sm text-text-secondary">
						Click to send a test notification to your desktop.
					</p>
				</div>
			</section>

			<section className="mb-6">
				<h3 className="text-lg font-semibold mb-2">About App</h3>
				<div className="p-4 bg-bg-secondary rounded border border-border-primary">
					<div className="flex items-center justify-between">
						<div>
							<h4 className="font-bold text-text-primary">
								{appName || "Norunos Platform"}
							</h4>
							<p className="text-sm text-text-secondary">
								Version: {appVersion || "Loading..."}
							</p>
						</div>
					</div>
				</div>
			</section>
		</div>
	);
};

export default SettingsView;
