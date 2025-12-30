import type React from "react";
import { useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export type ContextMenuItem = {
	label: string;
	onClick: () => void;
	danger?: boolean;
};

interface ContextMenuProps {
	x: number;
	y: number;
	items: ContextMenuItem[];
	onClose: () => void;
}

const NorunoContextMenu: React.FC<ContextMenuProps> = ({
	x,
	y,
	items,
	onClose,
}) => {
	const ref = useRef<HTMLDivElement | null>(null);
	const [pos, setPos] = useState({ left: x, top: y });
	useLayoutEffect(() => {
		const el = ref.current;
		if (!el) return; // setPosは初期値ですでに設定されているのでここではリターンでOK

		const rect = el.getBoundingClientRect();
		const vw = window.innerWidth;
		const vh = window.innerHeight;

		let left = x;
		let top = y;

		// 画面からはみ出す場合の補正
		if (left + rect.width > vw) left = Math.max(8, vw - rect.width - 8);
		if (top + rect.height > vh) top = Math.max(8, vh - rect.height - 8);

		setPos({ left, top });
	}, [x, y]);

	const handleItemClick = (it: ContextMenuItem) => {
		try {
			it.onClick();
		} catch (e) {
			console.error("ContextMenu item error", e);
		}
		onClose();
	};

	const menuContent = (
		<>
			<div
				role="menu"
				className="fixed top-0 left-0 w-dvw h-dvh z-9998 cursor-default"
				onClick={onClose}
				onKeyDown={(e) => {
					if (e.key === "Escape") {
						e.preventDefault();
						onClose();
					}
				}}
			/>

			<div
				ref={ref}
				style={{
					left: pos.left,
					top: pos.top,
				}}
				// Tailwindのクラス構成は維持しつつ、shadowを追加して浮遊感を強調
				className={
					"flex flex-col min-w-120px divide-y divide-accent-secondary rounded-md border border-accent-secondary bg-bg-primary py-1 text-text-primary shadow-xl z-50 fixed animate-in fade-in zoom-in-95 duration-150"
				}
				// 1. ARIA ロールを追加して、これがメニューのコンテナであることを明示 (例として、一般的なメニューの場合は role="menu" を使用)
				role="menu"
				// 2. Tabキーでのコンテナ自体のフォーカスを避けるために -1 に設定する (メニュー内のアイテムがフォーカスを持つべきであり、コンテナ自体はフォーカス不要なため)
				tabIndex={-1}
				// 3. マウスイベント（伝播の停止）
				onClick={(e) => e.stopPropagation()}
				// 4. Lint要件を満たすために onKeyDown を追加し、キー操作が行われたときも伝播を停止させる
				onKeyDown={(e) => e.stopPropagation()}
			>
				{items.map((it) => (
					<button
						type="button"
						className={`cursor-pointer px-3 py-1.5 text-sm transition-colors hover:bg-bg-hover focus:bg-bg-hover focus:outline-none rounded-sm ${
							it.danger ? "text-danger hover:bg-danger-light focus:bg-danger-light" : ""
						}`}
						key={it.label} // 可能なら it.label など一意なID推奨
						onClick={() => handleItemClick(it)}
					>
						{it.label}
					</button>
				))}
			</div>
		</>
	);

	return createPortal(menuContent, document.body);
};

export default NorunoContextMenu;
