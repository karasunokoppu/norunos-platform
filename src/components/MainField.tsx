import React from "react";
import NorunoDropdown from "../ui/NorunoDropdown";
import NorunoContextMenu from "../ui/NorunoContextMenu";

interface MainFieldProps {
    currentContent: string;
}

const MainField: React.FC<MainFieldProps> = ({
    currentContent
}) => {
    const tests = ["test01", "test02", "test03", "test04"];
    const [hoge, setHoge] = React.useState(tests[1]);
      const [contextMenu, setContextMenu] = React.useState<{
        x: number;
        y: number;
        items: string | null;
    } | null>(null);


    return(
        <div
            className="bg-bg-secondary h-svh w-full text-text-secondary flow flow-col"
            onContextMenu={(e) => {
            e.preventDefault();
            setContextMenu({ x: e.clientX, y: e.clientY, items:"MainField"});
          }}
        >
            <p>main field</p>
            <p>Current Content: {currentContent}</p>

            <NorunoDropdown
                value={hoge}
                onChange={setHoge}
                options={tests.map((test) => ({ value: test, label: test }))} 
            />

            {contextMenu && (
                <NorunoContextMenu
                x={contextMenu.x}
                y={contextMenu.y}
                onClose={() => setContextMenu(null)}
                items={[
                    {
                    label: "Rename",
                    onClick: () => {},
                    },
                    {
                    label: "Delete",
                    danger: true,
                    onClick: () => {},
                    },
                ]}
                />
            )}
        </div>
    )
}

export default MainField;