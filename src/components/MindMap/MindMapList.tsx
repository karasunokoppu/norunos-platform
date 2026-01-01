import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { MindMap } from "../../type/mindmap";
import { Plus, Trash2 } from "lucide-react";

interface MindMapViewProps {
    onOpenMap: (map: MindMap) => void;
}

const MindMapList = ({ onOpenMap }: MindMapViewProps) => {
    const [maps, setMaps] = useState<MindMap[]>([]);
    const [isCreating, setIsCreating] = useState(false);
    const [newTitle, setNewTitle] = useState("");

    const fetchMaps = async () => {
        try {
            const data = await invoke<MindMap[]>("get_mind_maps");
            setMaps(data);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        fetchMaps();
    }, []);

    const handleCreate = async () => {
        if (!newTitle.trim()) return;
        try {
            const initialContent = JSON.stringify({ nodes: [], edges: [] });
            const newMap = await invoke<MindMap>("create_mind_map", {
                title: newTitle,
                content: initialContent,
            });
            setNewTitle("");
            setIsCreating(false);
            fetchMaps();
            onOpenMap(newMap);
        } catch (error) {
            console.error(error);
        }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm("Delete this mind map?")) return;
        try {
            await invoke("delete_mind_map", { id });
            fetchMaps();
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="p-4 h-full bg-bg-secondary w-full text-text-primary">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-text-primary">Mind Maps</h1>
                <button
                    onClick={() => setIsCreating(true)}
                    className="flex items-center gap-2 bg-accent-secondary text-white px-4 py-2 rounded hover:bg-accent-hover"
                >
                    <Plus size={20} /> New Map
                </button>
            </div>

            {isCreating && (
                <div className="mb-4 flex gap-2">
                    <input
                        type="text"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        placeholder="Map Title"
                        className="flex-1 p-2 bg-bg-tertiary border border-border-secondary rounded text-text-primary outline-none focus:border-accent-secondary"
                        autoFocus
                    />
                    <button onClick={handleCreate} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                        Create
                    </button>
                    <button onClick={() => setIsCreating(false)} className="bg-bg-tertiary text-text-primary border border-border-secondary px-4 py-2 rounded hover:bg-bg-hover">
                        Cancel
                    </button>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {maps.map((map) => (
                    <div
                        key={map.id}
                        onClick={() => onOpenMap(map)}
                        className="bg-bg-tertiary p-4 rounded shadow border border-border-primary cursor-pointer hover:shadow-md hover:border-accent-secondary transition-all relative group h-32 flex flex-col justify-between"
                    >
                        <h3 className="font-semibold text-lg truncate text-text-primary">{map.title}</h3>
                        <div className="flex justify-between items-end text-sm text-text-secondary">
                            <span>{new Date(map.created_at).toLocaleDateString()}</span>
                            <button
                                onClick={(e) => handleDelete(map.id, e)}
                                className="text-text-tertiary hover:text-danger opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MindMapList;
