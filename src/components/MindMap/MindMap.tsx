import { useState } from "react";
import MindMapList from "./MindMapList";
import MindMapEditor from "./MindMapEditor";
import { MindMap } from "../../type/mindmap";

const MindMapView = () => {
	const [selectedMap, setSelectedMap] = useState<MindMap | null>(null);

	return (
		<div className="h-full w-full">
			{selectedMap ? (
				<MindMapEditor
					map={selectedMap}
					onBack={() => setSelectedMap(null)}
				/>
			) : (
				<MindMapList onOpenMap={setSelectedMap} />
			)}
		</div>
	);
};

export default MindMapView;
