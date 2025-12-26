import React, { useLayoutEffect, useRef, useState, useEffect } from "react";
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

const NorunoContextMenu: React.FC<ContextMenuProps> = ({ x, y, items, onClose }) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = useState({ left: x, top: y });

  // キーボード操作（Escape）
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  // 【変更点1】 useEffect -> useLayoutEffect
  // ブラウザが画面を描画する「前」に位置計算を行うことで、位置ずれによるチラつきを防ぎます
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
  }, [x, y, items]);

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
      {/* 【変更点2】 外側クリック検知用の透明な背景 (Backdrop) */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          zIndex: 9998, // メニューより1つ下
          cursor: "default"
        }}
        // 左クリックで閉じる
        onClick={onClose}
        // 背景を右クリックしたときも閉じる（ブラウザ標準メニューを出さないため）
        onContextMenu={(e) => {
          e.preventDefault();
          onClose();
        }}
      />

      {/* コンテキストメニュー本体 */}
      <div
        ref={ref}
        style={{
          position: "fixed", // absoluteではなくfixed推奨（スクロール対策）
          left: pos.left,
          top: pos.top,
          zIndex: 9999,
        }}
        // Tailwindのクラス構成は維持しつつ、shadowを追加して浮遊感を強調
        className="bg-bg-primary text-text-primary py-1 border border-accent-secondary divide-y divide-accent-secondary rounded-sm shadow-lg min-w-[120px]"
        onClick={(e) => e.stopPropagation()} // メニュー内クリックが背景に伝播しないようにする
        onContextMenu={(e) => e.preventDefault()} // メニュー内での右クリックも無効化
      >
        {items.map((it, idx) => (
          <div
            className={`px-3 py-1.5 cursor-pointer text-sm hover:bg-bg-hover transition-colors ${
              it.danger ? "text-red-500 hover:bg-red-50" : ""
            }`}
            key={idx} // 可能なら it.label など一意なID推奨
            onClick={() => handleItemClick(it)}
          >
            {it.label}
          </div>
        ))}
      </div>
    </>
  );

  return createPortal(menuContent, document.body);
};

export default NorunoContextMenu;