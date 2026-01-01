import { useCallback, useState, useRef, useEffect } from "react";
import {
    ReactFlow,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    addEdge,
    Connection,
    Edge,
    Node,
    MiniMap,
    ReactFlowProvider,
    Handle,
    Position,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { invoke } from "@tauri-apps/api/core";
import { MindMap } from "../../type/mindmap";
import { ArrowLeft, Save } from "lucide-react";

// Custom Node Component with handles on all sides
const CustomNode = ({ data }: { data: { label: string } }) => {
    return (
        <div className="px-4 py-2 shadow-md rounded-md bg-bg-secondary border-2 border-border-secondary text-text-primary hover:border-accent-secondary transition-colors">
            <div className="font-bold text-sm text-center">{data.label}</div>

            <Handle type="target" position={Position.Top} id="top" className="w-16 !bg-accent-secondary" />
            <Handle type="source" position={Position.Top} id="top" className="w-16 !bg-accent-secondary" />

            <Handle type="target" position={Position.Bottom} id="bottom" className="w-16 !bg-accent-secondary" />
            <Handle type="source" position={Position.Bottom} id="bottom" className="w-16 !bg-accent-secondary" />

            <Handle type="target" position={Position.Left} id="left" className="w-16 !bg-accent-secondary" />
            <Handle type="source" position={Position.Left} id="left" className="w-16 !bg-accent-secondary" />

            <Handle type="target" position={Position.Right} id="right" className="w-16 !bg-accent-secondary" />
            <Handle type="source" position={Position.Right} id="right" className="w-16 !bg-accent-secondary" />
        </div>
    );
};

const nodeTypes = {
    custom: CustomNode,
};


interface MindMapEditorProps {
    map: MindMap;
    onBack: () => void;
}

const MindMapEditor = ({ map, onBack }: MindMapEditorProps) => {
    const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
    const [title, setTitle] = useState(map.title);

    // Node Editing State
    const [editingNode, setEditingNode] = useState<Node | null>(null);
    const [editLabel, setEditLabel] = useState("");
    const [isEditOpen, setIsEditOpen] = useState(false);

    useEffect(() => {
        try {
            const content = JSON.parse(map.content);
            setNodes(content.nodes || []);
            setEdges(content.edges || []);
        } catch (e) {
            console.error("Failed to parse map content", e);
        }
    }, [map]);

    const onConnect = useCallback(
        (params: Connection) => setEdges((eds) => addEdge(params, eds)),
        [setEdges]
    );

    const onSave = async () => {
        try {
            const content = JSON.stringify({ nodes, edges });
            await invoke("update_mind_map", {
                id: map.id,
                title,
                content,
            });
            // Optional: Show toast
        } catch (error) {
            console.error("Failed to save map", error);
        }
    };

    const wrapperRef = useRef<HTMLDivElement>(null);

    // Global shortcut for Save (Ctrl+S)
    useEffect(() => {
        const handleGlobalKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                onSave();
            }
        };

        window.addEventListener('keydown', handleGlobalKeyDown);
        return () => window.removeEventListener('keydown', handleGlobalKeyDown);
    }, [nodes, edges, title]); // Re-bind when state changes so onSave has latest data

    // Simple drag-to-add node helper (optional) or context menu to add node could go here.
    // For MVP: Double click to add node.
    const onNodeDoubleClick = useCallback((_event: React.MouseEvent, node: Node) => {
        setEditingNode(node);
        setEditLabel(typeof node.data.label === 'string' ? node.data.label : "");
        setIsEditOpen(true);
    }, []);

    const saveNodeLabel = () => {
        if (!editingNode) return;
        setNodes((nds) =>
            nds.map((node) => {
                if (node.id === editingNode.id) {
                    return {
                        ...node,
                        data: { ...node.data, label: editLabel },
                    };
                }
                return node;
            })
        );
        setIsEditOpen(false);
        setEditingNode(null);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            saveNodeLabel();
        }
    };


    return (
        <div className="h-full flex flex-col w-full">
            <div className="h-12 bg-bg-secondary border-b border-border-primary flex items-center justify-between px-4 text-text-primary">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 hover:bg-bg-hover rounded">
                        <ArrowLeft size={20} />
                    </button>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="bg-transparent font-bold text-lg outline-none border-b border-transparent focus:border-accent-secondary text-text-primary"
                    />
                </div>
                <button
                    onClick={onSave}
                    className="flex items-center gap-2 bg-accent-secondary text-white px-4 py-1.5 rounded hover:bg-accent-hover text-sm"
                >
                    <Save size={16} /> Save
                </button>
            </div>
            <div className="flex-1 bg-bg-primary" ref={wrapperRef}>
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    nodeTypes={nodeTypes}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    onNodeDoubleClick={onNodeDoubleClick}
                    deleteKeyCode={['Backspace', 'Delete']}
                    colorMode="dark"
                    fitView
                >
                    <Background color="#414868" gap={16} />
                    <Controls className="bg-bg-secondary border-border-primary text-text-primary" />
                    <MiniMap className="bg-bg-secondary border-border-primary" nodeColor="#5f86d8" maskColor="rgba(26, 27, 38, 0.6)" />
                    <PanelToAddNode setNodes={setNodes} />
                </ReactFlow>

                {/* Edit Node Dialog */}
                {isEditOpen && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-overlay" onClick={() => setIsEditOpen(false)}>
                        <div className="bg-bg-secondary border border-border-primary p-4 rounded shadow-lg w-64" onClick={e => e.stopPropagation()}>
                            <h3 className="font-bold mb-2 text-sm text-text-primary">Edit Node</h3>
                            <input
                                type="text"
                                value={editLabel}
                                onChange={(e) => setEditLabel(e.target.value)}
                                onKeyDown={handleKeyDown}
                                className="w-full bg-bg-tertiary border border-border-secondary p-1 rounded mb-2 text-sm text-text-primary outline-none focus:border-accent-secondary"
                                autoFocus
                            />
                            <div className="flex justify-end gap-2">
                                <button onClick={() => setIsEditOpen(false)} className="px-2 py-1 text-xs text-text-secondary hover:text-text-primary">Cancel</button>
                                <button onClick={saveNodeLabel} className="px-2 py-1 text-xs bg-accent-secondary text-white rounded hover:bg-accent-hover">Save</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// Helper component to access ReactFlow instance for adding nodes
import { Panel } from '@xyflow/react';

const PanelToAddNode = ({ setNodes }: { setNodes: any }) => {
    const addNode = () => {
        const id = crypto.randomUUID();
        const newNode: Node = {
            id,
            position: { x: Math.random() * 200 + 100, y: Math.random() * 200 + 100 },
            data: { label: `Node` },
            type: 'custom',
        };
        setNodes((nds: Node[]) => nds.concat(newNode));
    };

    return (
        <Panel position="top-right">
            <button onClick={addNode} className="bg-bg-secondary text-text-primary p-2 rounded shadow border border-border-primary text-sm hover:bg-bg-hover">
                + Add Node
            </button>
        </Panel>
    );
};

const WrappedMindMapEditor = (props: MindMapEditorProps) => (
    <ReactFlowProvider>
        <MindMapEditor {...props} />
    </ReactFlowProvider>
);

export default WrappedMindMapEditor;
