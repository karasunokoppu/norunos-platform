# biome

## フォーマット (format)

npx @biomejs/biome format --write ./src/*

## リント (lint)

npx @biomejs/biome lint --write ./src/*

## チェック (check)

npx @biomejs/biome check --write ./src/*

# NorunoContextMenu の使い方

1. コンテキストメニュー用のデータ管理設定

```tsx
const [contextMenu, setContextMenu] = React.useState<{
    x: number;
    y: number;
    items: string | null;
} | null>(null); 
```

1. コンテキストメニューの配置

```tsx
{contextMenu && (
    <NorunoContextMenu
        x={contextMenu.x}
        y={contextMenu.y}
        onClose={() => setContextMenu(null)}
        items={[
            {
                label: "Rename", // 名前変更
                onClick: () => {},
            },
            {
                label: "Delete", // 削除
                danger: true,
                onClick: () => {},
            },
        ]}
    />
)}
```

# NorunoDropdown の使い方

1. ドロップダウンメニュー用のデータ管理設定

```tsx
const tests = ["test01", "test02", "test03", "test04"];
const [hoge, setHoge] = React.useState(tests[1]);
```

1. ドロップダウンメニューの配置

```tsx
<NorunoDropdown
    value={hoge}
    onChange={setHoge}
    options={tests.map((test) => ({ value: test, label: test }))}
/>
```
