import { sendNotification } from "../../utils/notification";

const SettingsView = () => {
	const handleTestNotification = async () => {
		try {
			await sendNotification("Test Notification", "This is a test message from settings!");
		} catch (e) {
			alert(`Debug Error: ${e}`);
		}
	};

	return (
		<div className="p-4 bg-bg-primary text-text-primary h-full">
			<h2 className="text-xl font-bold mb-4">Settings</h2>

			<section className="mb-6">
				<h3 className="text-lg font-semibold mb-2">System</h3>
				<div className="flex flex-col gap-2">
					<button
						onClick={handleTestNotification}
						className="px-4 py-2 bg-accent-primary text-white rounded hover:bg-accent-hover w-fit transition-colors"
					>
						Test Notification
					</button>
					<p className="text-sm text-text-secondary">Click to send a test notification to your desktop.</p>
				</div>
			</section>
		</div>
	);
};

export default SettingsView;
