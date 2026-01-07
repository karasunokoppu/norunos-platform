import { Component, type ErrorInfo, type ReactNode } from "react";
import { XCircle, RefreshCw } from "lucide-react";

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

export class GlobalErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
        };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error, errorInfo: null };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ errorInfo });
    }

    handleReload = () => {
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex h-screen w-full flex-col items-center justify-center bg-bg-primary p-8 text-text-primary" data-tauri-drag-region>
                    <div className="flex flex-col items-center gap-4 text-center">
                        <XCircle className="h-16 w-16 text-red-500" />
                        <h1 className="text-2xl font-bold">予期せぬエラーが発生しました</h1>
                        <p className="max-w-md text-text-secondary">
                            申し訳ありません。アプリケーションで問題が発生しました。
                        </p>
                        {this.state.error && (
                            <div className="mt-4 w-full max-w-lg overflow-auto rounded-lg bg-bg-secondary p-4 text-left font-mono text-sm text-red-400 border border-border-primary">
                                <p className="font-bold mb-2">Error Details:</p>
                                {this.state.error.toString()}
                                {this.state.errorInfo && (
                                    <pre className="mt-2 text-xs opacity-75 whitespace-pre-wrap">
                                        {this.state.errorInfo.componentStack}
                                    </pre>
                                )}
                            </div>
                        )}
                        <button
                            onClick={this.handleReload}
                            className="mt-6 flex items-center gap-2 rounded-md bg-accent-primary px-4 py-2 font-bold text-white transition hover:bg-accent-secondary shadow-lg hover:shadow-xl"
                        >
                            <RefreshCw className="h-4 w-4" />
                            アプリケーションを再読み込み
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
