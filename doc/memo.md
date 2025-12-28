# biome 
## format
npx @biomejs/biome format --write ./src/*

## lint
npx @biomejs/biome lint --write ./src/*

## check
npx @biomejs/biome check --write ./src/*

# How to use NorunoContextMenu

1. コンテキストメニュー用のデータ管理設定

```tsx
const [contextMenu, setContextMenu] = React.useState<{
    x: number;
    y: number;
    items: string | null;
} | null>(null); 
```

2. コンテキストメニューの配置

```tsx
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
```

# How to use NorunoDropdown

1. ドロップダウンメニュー用のデータ管理設定

```tsx
const tests = ["test01", "test02", "test03", "test04"];
const [hoge, setHoge] = React.useState(tests[1]);
```

2. ドロップダウンメニューの配置

```tsx
<NorunoDropdown
    value={hoge}
    onChange={setHoge}
    options={tests.map((test) => ({ value: test, label: test }))}
/>
```