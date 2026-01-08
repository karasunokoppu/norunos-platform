import type React from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import wikiLinkPlugin from "remark-wiki-link";

interface MarkdownRendererProps {
    content: string;
    className?: string;
    onNavigate?: (href: string) => void;
}

const MarkdownRenderer = ({
    content,
    className = "",
    onNavigate,
}: MarkdownRendererProps) => {
    // Pre-process content to improve spacing
    const processedContent = content
        .replace(/([^\n])\n---/g, "$1\n\n---")
        .replace(/\n(?=\n)/g, "\n&nbsp;");

    return (
        <div className={`prose prose-sm prose-invert max-w-none ${className}`}>
            <ReactMarkdown
                remarkPlugins={[
                    remarkGfm,
                    remarkBreaks,
                    [
                        wikiLinkPlugin,
                        {
                            hrefTemplate: (permalink: string) => `internal://${permalink}`,
                        },
                    ],
                ]}
                components={{
                    code({ node, inline, className, children, ...props }: any) {
                        const match = /language-(\w+)/.exec(className || "");
                        return !inline && match ? (
                            <SyntaxHighlighter
                                style={vscDarkPlus}
                                language={match[1]}
                                PreTag="div"
                                {...props}
                            >
                                {String(children).replace(/\n$/, "")}
                            </SyntaxHighlighter>
                        ) : (
                            <code
                                className={
                                    className
                                        ? className
                                        : "bg-bg-tertiary px-1 py-0.5 rounded text-sm text-accent-secondary"
                                }
                                {...props}
                            >
                                {children}
                            </code>
                        );
                    },
                    table({ children }: any) {
                        return (
                            <table className="border-collapse border border-border-secondary w-full my-4">
                                {children}
                            </table>
                        );
                    },
                    th({ children }: any) {
                        return (
                            <th className="border border-border-secondary px-2 py-1 bg-bg-tertiary text-left">
                                {children}
                            </th>
                        );
                    },
                    td({ children }: any) {
                        return (
                            <td className="border border-border-secondary px-2 py-1">
                                {children}
                            </td>
                        );
                    },
                    h1({ children }: any) {
                        return (
                            <h1 className="text-2xl font-bold border-b border-border-secondary pb-2 mb-4 mt-6 text-text-primary">
                                {children}
                            </h1>
                        );
                    },
                    h2({ children }: any) {
                        return (
                            <h2 className="text-xl font-bold border-b border-border-secondary pb-1 mb-3 mt-5 text-text-primary">
                                {children}
                            </h2>
                        );
                    },
                    h3({ children }: any) {
                        return (
                            <h3 className="text-lg font-bold mb-2 mt-4 text-text-primary">
                                {children}
                            </h3>
                        );
                    },
                    ul({ children }: any) {
                        return (
                            <ul className="list-disc list-inside mb-4 text-text-primary">
                                {children}
                            </ul>
                        );
                    },
                    ol({ children }: any) {
                        return (
                            <ol className="list-decimal list-inside mb-4 text-text-primary">
                                {children}
                            </ol>
                        );
                    },
                    blockquote({ children }: any) {
                        return (
                            <blockquote className="border-l-4 border-accent-secondary pl-4 italic bg-bg-tertiary py-2 my-4 rounded-r text-text-secondary">
                                {children}
                            </blockquote>
                        );
                    },
                    p({ children }: any) {
                        return (
                            <p className="mb-4 text-text-primary leading-relaxed">{children}</p>
                        );
                    },
                    a({ href, children }: any) {
                        const isInternal = href && href.startsWith("internal://");

                        const handleClick = (e: React.MouseEvent) => {
                            if (isInternal && onNavigate) {
                                e.preventDefault();
                                onNavigate(href);
                            }
                        };

                        return (
                            <a
                                href={href}
                                onClick={handleClick}
                                className={`text-accent-secondary hover:underline ${isInternal ? "cursor-alias font-semibold" : ""}`}
                                target={isInternal ? undefined : "_blank"}
                                rel={isInternal ? undefined : "noopener noreferrer"}
                            >
                                {children}
                                {isInternal && (
                                    <span className="text-xs ml-1 opacity-50">↗</span>
                                )}
                            </a>
                        );
                    },
                }}
            >
                {processedContent}
            </ReactMarkdown>
        </div>
    );
};

export default MarkdownRenderer;
