import "@testing-library/jest-dom";
import { vi } from "vitest";

// Tauri APIのモック
vi.mock("@tauri-apps/api/core", () => ({
	invoke: vi.fn(),
}));

vi.mock("@tauri-apps/api/window", () => ({
	getCurrentWindow: vi.fn(() => ({
		minimize: vi.fn(),
		maximize: vi.fn(),
		unmaximize: vi.fn(),
		close: vi.fn(),
		isMaximized: vi.fn(() => Promise.resolve(false)),
		listen: vi.fn(() => Promise.resolve(() => { })),
	})),
}));

vi.mock("@tauri-apps/plugin-notification", () => ({
	sendNotification: vi.fn(),
	isPermissionGranted: vi.fn(() => Promise.resolve(true)),
	requestPermission: vi.fn(() => Promise.resolve("granted")),
}));

// ToastContextのモック
vi.mock("./context/ToastContext", () => ({
	useToast: () => ({
		showToast: vi.fn(),
		showError: vi.fn(),
		showSuccess: vi.fn(),
	}),
	ToastProvider: ({ children }: { children: React.ReactNode }) => children,
}));
