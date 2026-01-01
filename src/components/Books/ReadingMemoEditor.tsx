import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ReadingMemoEditorProps {
    initialContent?: string;
    onSave: (content: string, pageNumber: number) => void;
    onCancel: () => void;
    initialPage?: number;
}

const ReadingMemoEditor = ({ initialContent = "", onSave, onCancel, initialPage = 0 }: ReadingMemoEditorProps) => {
    const [content, setContent] = useState(initialContent);
    const [pageNumber, setPageNumber] = useState(initialPage);
    const [isPreview, setIsPreview] = useState(false);

    const handleSave = () => {
        onSave(content, pageNumber);
    };

    return (
        <div className="flex flex-col h-full border rounded-lg overflow-hidden bg-white">
            <div className="flex justify-between items-center bg-gray-100 p-2 border-b">
                <div className="flex items-center gap-4">
                    <span className="font-bold text-sm">Memo</span>
                    <div className="flex items-center gap-2">
                        <label className="text-xs text-gray-600">Page:</label>
                        <input
                            type="number"
                            value={pageNumber}
                            onChange={(e) => setPageNumber(parseInt(e.target.value))}
                            className="w-20 px-2 py-1 text-sm border rounded"
                        />
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        className={`px-3 py-1 text-sm rounded ${!isPreview ? 'bg-blue-100 text-blue-700' : 'text-gray-600'}`}
                        onClick={() => setIsPreview(false)}
                    >
                        Write
                    </button>
                    <button
                        className={`px-3 py-1 text-sm rounded ${isPreview ? 'bg-blue-100 text-blue-700' : 'text-gray-600'}`}
                        onClick={() => setIsPreview(true)}
                    >
                        Preview
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-auto p-4 min-h-[300px]">
                {!isPreview ? (
                    <textarea
                        className="w-full h-full p-2 border-none outline-none resize-none font-mono text-sm"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Write your memo here... (Markdown supported)"
                    />
                ) : (
                    <div className="prose prose-sm w-full max-w-none">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
                    </div>
                )}
            </div>

            <div className="p-3 border-t bg-gray-50 flex justify-end gap-2">
                <button onClick={onCancel} className="px-4 py-2 text-gray-600 text-sm hover:text-gray-800">
                    Cancel
                </button>
                <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">
                    Save Memo
                </button>
            </div>
        </div>
    );
};

export default ReadingMemoEditor;
