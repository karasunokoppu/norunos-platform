# 技術仕様書 (Technical Specifications) - Final

## 1. システム構成・技術選定

### 1.1 サーバーサイド (Raspberry Pi 5)
*   **フレームワーク**: **Axum** (Rust)
    *   **選定理由**: 高速、堅牢、Tauri (Rust) との親和性が高い。
*   **ランタイム**: Docker Container
*   **データベース**: SQLite (`norunos.db` on Volume) - サーバーサイドで管理。
*   **ファイルストレージ**: Markdownメモや画像をファイルシステムで管理。

### 1.2 クライアントサイド (Desktop)
*   **フレームワーク**: **Tauri** (Existing)
    *   **選定理由 (他候補との比較)**:
        *   **コード共有**: サーバー(Axum)とクライアント(Tauri)が共にRustであるため、APIの型定義（Request/ResponseのStruct）を `shared` クレートとして共有できます。これにより、API仕様変更時の追従が非常に容易になります。
        *   **移行コスト**: 既存のReactフロントエンドをそのまま利用でき、Rust側のCommandの中身を「DB操作」から「APIコール」に書き換えるだけで済むため、最も低コストで移行可能です。
        *   **パフォーマンス**: Electron等と比較して軽量です。

---

## 2. API仕様概要

REST API形式 (JSON)

### 2.1 認証
*   **Bearer Token**: クライアント設定画面でAPIキーを入力・保持。

### 2.2 エンドポイント構成 (Axum Router)

#### Resource: Tasks
*   `GET /api/tasks`
*   `POST /api/tasks`
*   `PATCH /api/tasks/:id`
*   `DELETE /api/tasks/:id`

#### Resource: Notes (File System)
*   `GET /api/notes/tree` -> ディレクトリ構造 (JSON)
*   `GET /api/notes/content/*path` -> ファイル本文 (Text)
*   `PUT /api/notes/content/*path` -> ファイル保存 (Text)

#### Resource: Books (Hybrid)
*   `GET /api/books` -> DB情報
*   `GET /api/books/:id/memos` -> メモ一覧
*   `GET /api/books/memos/:memo_id` -> メモ本文 (File)

---

## 3. 推奨プロジェクト構成 (Workspace)

RustのWorkspace機能を用いて、以下のように構成することを推奨します。

```text
/
├── Cargo.toml (Workspace)
├── shared/             # [New] 共通の型定義 (Domain Models, DTOs)
│   ├── src/lib.rs
│   └── Cargo.toml
├── server/             # [New] Axum API Server
│   ├── src/main.rs
│   ├── Dockerfile
│   └── Cargo.toml
├── app/ (or src-tauri) # [Existing] Desktop Client
    ├── src/lib.rs      # Command実装をAPI Client化
    └── Cargo.toml
```

## 4. 開発ロードマップ

1.  **Refactor**: 既存コードからデータモデル (`struct Task` 等) を抜き出し、`shared` クレートを作成。
2.  **Server**: `server` クレートを作成し、AxumでAPIエンドポイントを実装。`shared` の型を利用。
3.  **Client**: Tauriのコマンド実装を修正し、`reqwest` で `server` を叩くように変更。
