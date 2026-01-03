import React, { useEffect, useRef, useState, useCallback } from "react";
import ForceGraph2D, { ForceGraphMethods } from "react-force-graph-2d";
import { getGraphData, GraphData, GraphNode } from "../../tauri/notes_api";
import { X } from "lucide-react";

interface GraphViewProps {
    onNavigate: (path: string) => void;
    onClose?: () => void;
}

const GraphView: React.FC<GraphViewProps> = ({ onNavigate, onClose }) => {
    const [data, setData] = useState<GraphData>({ nodes: [], links: [] });
    const graphRef = useRef<ForceGraphMethods | undefined>(undefined);
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

    useEffect(() => {
        getGraphData().then(setData).catch(console.error);
    }, []);

    useEffect(() => {
        if (containerRef.current) {
            setDimensions({
                width: containerRef.current.clientWidth,
                height: containerRef.current.clientHeight,
            });

            // Resize observer?
            const ro = new ResizeObserver(entries => {
                for (let entry of entries) {
                    setDimensions({
                        width: entry.contentRect.width,
                        height: entry.contentRect.height,
                    });
                }
            });
            ro.observe(containerRef.current);
            return () => ro.disconnect();
        }
    }, []);

    const handleNodeClick = useCallback((node: any) => {
        // Cast to GraphNode to access known properties safely
        const graphNode = node as GraphNode;
        // Node id is the filename (or path)
        const target = graphNode.id;
        // Construct internal link format - backend provides ID as file stem
        // but handleNavigate usually takes internal://Name or internal://Path
        // Let's assume onNavigate can handle strict names if we formatted ID correctly in backend.
        // In fs.rs, we used file_stem as ID.
        // So passing `internal://${target}` should work if target is the note name.
        onNavigate(`internal://${target}`);
    }, [onNavigate]);

    return (
        <div ref={containerRef} className="flex-1 w-full h-full bg-bg-secondary overflow-hidden relative">
            {onClose && (
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 p-2 rounded-full bg-bg-tertiary text-text-primary shadow-lg hover:bg-bg-hover"
                    title="Close Graph"
                >
                    <X size={20} />
                </button>
            )}
            <ForceGraph2D
                ref={graphRef}
                width={dimensions.width}
                height={dimensions.height}
                graphData={data}
                nodeLabel="name"
                nodeColor={() => "#5abbf7"}
                linkColor={() => "#4a4a4a"}
                backgroundColor="#1e1e1e"
                onNodeClick={handleNodeClick}
                cooldownTicks={100}
                onEngineStop={() => graphRef.current?.zoomToFit(400)}
                nodeCanvasObject={(node: any, ctx, globalScale) => {
                    // node comes from the library's internal simulation node which extends our GraphNode
                    // We treat it as any or intersection type, but essential props like x, y, name are there.
                    const graphNode = node as GraphNode & { x: number, y: number };
                    const label = graphNode.name;
                    const fontSize = 12 / globalScale;
                    ctx.font = `${fontSize}px Sans-Serif`;

                    // Draw Node
                    const r = 4;
                    ctx.beginPath();
                    ctx.arc(graphNode.x, graphNode.y, r, 0, 2 * Math.PI, false);
                    ctx.fillStyle = "#5abbf7";
                    ctx.fill();

                    // Draw Label
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'top';
                    ctx.fillStyle = "rgba(255, 255, 255, 0.8)"; // Light text
                    ctx.fillText(label, graphNode.x, graphNode.y + r + 1);
                }}
                nodeCanvasObjectMode={() => 'replace'}
            />
        </div>
    );
};

export default GraphView;
