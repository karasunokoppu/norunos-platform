import type React from "react";
import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useState,
} from "react";

export type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
	id: string;
	message: string;
	type: ToastType;
}

interface ToastContextType {
	showToast: (message: string, type?: ToastType) => void;
	showError: (message: string) => void;
	showSuccess: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = (): ToastContextType => {
	const context = useContext(ToastContext);
	if (!context) {
		throw new Error("useToast must be used within a ToastProvider");
	}
	return context;
};

interface ToastProviderProps {
	children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
	const [toasts, setToasts] = useState<Toast[]>([]);

	const removeToast = useCallback((id: string) => {
		setToasts((prev) => prev.filter((toast) => toast.id !== id));
	}, []);

	const showToast = useCallback(
		(message: string, type: ToastType = "info") => {
			const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
			setToasts((prev) => [...prev, { id, message, type }]);

			// 自動的に3秒後に削除
			setTimeout(() => {
				removeToast(id);
			}, 3000);
		},
		[removeToast],
	);

	const showError = useCallback(
		(message: string) => {
			showToast(message, "error");
		},
		[showToast],
	);

	const showSuccess = useCallback(
		(message: string) => {
			showToast(message, "success");
		},
		[showToast],
	);

	const getToastStyles = (type: ToastType): string => {
		switch (type) {
			case "success":
				return "bg-green-600 text-white";
			case "error":
				return "bg-red-600 text-white";
			case "warning":
				return "bg-yellow-500 text-black";
			case "info":
			default:
				return "bg-blue-600 text-white";
		}
	};

	const getIcon = (type: ToastType): string => {
		switch (type) {
			case "success":
				return "✓";
			case "error":
				return "✕";
			case "warning":
				return "⚠";
			case "info":
			default:
				return "ⓘ";
		}
	};

	return (
		<ToastContext.Provider value={{ showToast, showError, showSuccess }}>
			{children}

			{/* Toast Container */}
			<div className="fixed bottom-4 right-4 z-[10000] flex flex-col gap-2 pointer-events-none">
				{toasts.map((toast) => (
					<div
						key={toast.id}
						className={`flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg pointer-events-auto animate-in slide-in-from-right-5 fade-in duration-300 ${getToastStyles(toast.type)}`}
						onClick={() => removeToast(toast.id)}
						role="alert"
					>
						<span className="text-lg font-bold">{getIcon(toast.type)}</span>
						<span className="text-sm font-medium">{toast.message}</span>
						<button
							type="button"
							className="ml-2 opacity-70 hover:opacity-100 transition-opacity"
							onClick={(e) => {
								e.stopPropagation();
								removeToast(toast.id);
							}}
						>
							✕
						</button>
					</div>
				))}
			</div>
		</ToastContext.Provider>
	);
};

export default ToastProvider;
