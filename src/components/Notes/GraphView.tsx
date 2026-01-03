import React, { useEffect, useRef, useState, useCallback } from "react";
import ForceGraph2D, { ForceGraphMethods } from "react-force-graph-2d";
import { getGraphData, GraphData, GraphNode } from "../../tauri/notes_api";

interface GraphViewProps {
    onNavigate: (path: string) => void;
}

const GraphView: React.FC<GraphViewProps> = ({ onNavigate }) => {
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
        // Node id is the filename (or path)
        const target = node.id;
        // Construct internal link format - backend provides ID as file stem
        // but handleNavigate usually takes internal://Name or internal://Path
        // Let's assume onNavigate can handle strict names if we formatted ID correctly in backend.
        // In fs.rs, we used file_stem as ID.
        // So passing `internal://${target}` should work if target is the note name.
        onNavigate(`internal://${target}`);
    }, [onNavigate]);

    return (
        <div ref={containerRef} className="flex-1 w-full h-full bg-bg-secondary overflow-hidden">
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
                    const label = node.name;
                    const fontSize = 12 / globalScale;
                    ctx.font = `${fontSize}px Sans-Serif`;

                    // Draw Node
                    const r = 4;
                    ctx.beginPath();
                    ctx.arc(node.x, node.y, r, 0, 2 * Math.PI, false);
                    ctx.fillStyle = "#5abbf7";
                    ctx.fill();

                    // Draw Label
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'top';
                    ctx.fillStyle = "rgba(255, 255, 255, 0.8)"; // Light text
                    ctx.fillText(label, node.x, node.y + r + 1);
                }}
                nodeCanvasObjectMode={() => 'replace'}
            />
        </div>
    );
};

export default GraphView;
