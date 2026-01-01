import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { saveNote } from "../../tauri/notes_api";

interface NoteEditorProps {
    path: string | null;
    initialContent: string;
    onSaveSuccess: () => void;
}

const NoteEditor: React.FC<NoteEditorProps> = ({ path, initialContent, onSaveSuccess }) => {
    const [content, setContent] = useState(initialContent);
    const [isDirty, setIsDirty] = useState(false);

    // Reset content when path changes
    useEffect(() => {
        setContent(initialContent);
        setIsDirty(false);
    }, [path, initialContent]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setContent(e.target.value);
        setIsDirty(true);
    };

    const handleSave = async () => {
        if (!path) return;
        try {
            await saveNote(path, content);
            setIsDirty(false);
            onSaveSuccess();
        } catch (e) {
            console.error("Failed to save note:", e);
            alert("Failed to save note");
        }
    };

    // Auto-save or Shortcut (Ctrl+S)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                handleSave();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [path, content]);

    if (!path) {
        return (
            <div className="flex-1 flex justify-center items-center text-text-tertiary bg-bg-secondary h-full">
                Select a note to edit
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col h-full bg-bg-secondary text-text-primary">
            {/* Toolbar */}
            <div className="h-10 border-b border-border-primary bg-bg-primary flex items-center px-4 justify-between">
                <span className="text-xs text-text-secondary truncate">{path}</span>
                <div className="flex items-center gap-4">
                    <span className={`text-xs ${isDirty ? "text-yellow-500" : "text-green-500"}`}>
                        {isDirty ? "Unsaved" : "Saved"}
                    </span>
                    <button onClick={handleSave} className="bg-accent-secondary text-white px-3 py-1 rounded text-xs hover:bg-opacity-80">Save</button>
                </div>
            </div>

            {/* Split View */}
            <div className="flex-1 flex flex-row overflow-hidden">
                {/* Editor */}
                <div className="flex-1 h-full border-r border-border-primary">
                    <textarea
                        className="w-full h-full bg-bg-secondary text-text-primary p-4 outline-none resize-none font-mono text-sm leading-relaxed"
                        value={content}
                        onChange={handleChange}
                        placeholder="# Write your markdown here..."
                    />
                </div>

                {/* Preview */}
                <div className="flex-1 h-full overflow-y-auto p-4 prose prose-invert max-w-none">
                    {/* Tailwind typography plugin required for 'prose' class to work beautifully, 
                        or manual styling. Assuming raw styles for now if plugin absent. 
                        User migrated to standard CSS/Tailwind recently. 
                        Let's verify logic. remark-gfm adds table support.
                     */}
                    <ReactMarkdown remarkPlugins={[remarkGfm]}
                        components={{
                            code({ node, inline, className, children, ...props }: any) {
                                return !inline ? (
                                    <pre className="bg-bg-tertiary p-2 rounded my-2 overflow-x-auto text-sm">
                                        <code className={className} {...props}>
                                            {children}
                                        </code>
                                    </pre>
                                ) : (
                                    <code className="bg-bg-tertiary px-1 py-0.5 rounded text-sm text-accent-secondary" {...props}>
                                        {children}
                                    </code>
                                )
                            },
                            table({ children }: any) {
                                return <table className="border-collapse border border-border-secondary w-full my-4">{children}</table>
                            },
                            th({ children }: any) {
                                return <th className="border border-border-secondary px-2 py-1 bg-bg-tertiary text-left">{children}</th>
                            },
                            td({ children }: any) {
                                return <td className="border border-border-secondary px-2 py-1">{children}</td>
                            },
                            a({ href, children }: any) {
                                return <a href={href} className="text-accent-secondary hover:underline" target="_blank" rel="noopener noreferrer">{children}</a>
                            },
                            h1({ children }: any) { return <h1 className="text-2xl font-bold border-b border-border-secondary pb-2 mb-4 mt-6">{children}</h1> },
                            h2({ children }: any) { return <h2 className="text-xl font-bold border-b border-border-secondary pb-1 mb-3 mt-5">{children}</h2> },
                            h3({ children }: any) { return <h3 className="text-lg font-bold mb-2 mt-4">{children}</h3> },
                            ul({ children }: any) { return <ul className="list-disc list-inside mb-4">{children}</ul> },
                            ol({ children }: any) { return <ol className="list-decimal list-inside mb-4">{children}</ol> },
                            blockquote({ children }: any) { return <blockquote className="border-l-4 border-accent-secondary pl-4 italic bg-bg-tertiary py-2 my-4 rounded-r">{children}</blockquote> }
                        }}
                    >
                        {content}
                    </ReactMarkdown>
                </div>
            </div>
        </div>
    );
};

export default NoteEditor;
