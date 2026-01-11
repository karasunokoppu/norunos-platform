import { useState } from "react";
import type { MindMap } from "../../type/mindmap";
import MindMapEditor from "./MindMapEditor";
import MindMapList from "./MindMapList";

const MindMapView = () => {
	const [selectedMap, setSelectedMap] = useState<MindMap | null>(null);

	return (
		<div className="h-full w-full">
			{selectedMap ? (
				<MindMapEditor map={selectedMap} onBack={() => setSelectedMap(null)} />
			) : (
				<MindMapList onOpenMap={setSelectedMap} />
			)}
		</div>
	);
};

export default MindMapView;
