# アーキテクチャと実装の概要

本書は、Norunos Platformに実装されている主要機能、特に最近追加された**グラフビュー (Graph View)** と **タスクグループ管理 (Task Group Management)**、および**カスタムウィンドウフレーム (Custom Window Frame)** と **状態管理のリファクタリング (State Management)** に焦点を当てた高レベルの概要を提供します。

## 1. グラフビュー (Notes機能)

グラフビューは、Obsidianのグラフビューに触発されたもので、システム内のMarkdownノート間の関係を可視化します。

### フロントエンド (`src/components/Notes/GraphView.tsx`)

- **ライブラリ**: インタラクティブな力指向グラフ（force-directed graph）の描画には `react-force-graph-2d` を使用しています。
- **Canvasレンダリング**: 多数のノードがある場合のパフォーマンスを確保するため、ラベルはDOM要素ではなく `nodeCanvasObject` を使用してCanvas上に直接描画されます。
- **ナビゲーション**: ノードをクリックすると `internal://NoteName` へのナビゲーションがトリガーされ、メインの `NotesView` がこれを捕捉して対応するファイルを開きます。

### バックエンド (`src-tauri/src/commands/notes/fs.rs`)

- **`get_graph_data`**: このTauriコマンドは `NorunosNotes` ディレクトリを再帰的にスキャンします。
  - **ノード**: すべての `.md` ファイルがノードになります。IDはファイル名の幹（拡張子なし）です。
  - **リンク**: ファイルの内容を解析し、Wikiリンクのパターン（`[[Target]]` または `[[Target|Alias]]`）を探します。現在のファイルからターゲットへのリンクが作成されます。

---

## 2. タスクグループ管理

この機能により、タスクをグループに整理し、グループ間で移動させることができます。

### データモデル (SQLite)

- **`tasks`**: 個々のタスクの詳細を保存します。IDはUUIDです。
- **`task_groups`**: グループのメタデータ（名前、作成日時）を保存します。
- **`rela_task_task_group`**: `task_id` と `task_group_id` をリンクする多対多（概念的には、現在は1対多として使用）の結合テーブルです。

### バックエンド (`src-tauri/src/commands/task/sql/task_group_commands.rs`)

- **`move_task_to_group(task_id, group_id)`**:
    1. 結合テーブル内の `task_id` に対する既存のエントリを削除します（古いグループから削除）。
    2. `task_id` を新しい `group_id` に接続する新しいエントリを挿入します。

### フロントエンド (`src/components/ToDoList`)

- **`TaskList.tsx`** & **`TaskCard.tsx`**: コンテキストに応じた操作を可能にするため、`TaskGroup` の完全なリストをpropsとして受け取ります。
- **`EditTaskDialog.tsx`**: タスクのグループを変更するためのUIを提供します。選択されたグループを初期グループと比較し、保存時に変更されていれば `moveTaskToGroup` を呼び出します。

## 3. ディレクトリ構成 (主要ファイル)

- `src-tauri/src/commands/`: Rustバックエンドのコマンドモジュール。
  - `notes/fs.rs`: ノートのファイルシステムおよびグラフロジック。
  - `task/`: タスク管理ロジック。
    - `sql/`: SQLxを使用したデータベース対話レイヤー。
- `src/components/`: Reactフロントエンドコンポーネント。
  - `Notes/`: ノートエディタおよびグラフの可視化。
  - `ToDoList/`: タスク管理UI。

---

## 4. カスタムウィンドウフレーム

モダンでシームレスな美観を実現するため、OS標準のウィンドウ装飾を無効にし、独自の実装を行いました。

### 設定 (`src-tauri/tauri.conf.json`)

- **`decorations`**: 標準のタイトルバーを削除するため `false` に設定。
- **`transparent`**: 角丸やカスタム背景を可能にするため `true` に設定。

### フロントエンド (`src/components/TitleBar.tsx`)

- カスタム **TitleBar** コンポーネントがアプリ上部に描画されます。
- **ドラッグ領域**: `data-tauri-drag-region` 属性を持つ `div` により、ユーザーはウィンドウを移動できます。
- **ウィンドウ操作**: カスタムの最小化、最大化/復元、閉じるボタンが Tauriの `Window` APIと直接対話します。

---

## 5. 状態管理のリファクタリング

アプリケーションのアーキテクチャを見直し、重要な状態管理をRustバックエンドに移行するTauriの推奨パターンに合わせました。

### バックエンド状態 (`src-tauri/src/lib.rs`)

- **`AppState`**: `Mutex` で保護されたRustの構造体で、タスクとタスクグループのインメモリ状態を保持します。
- **永続化**: 実行時の状態はメモリ内にありますが、変更は粒度の細かいコマンドを通じてSQLiteデータベース（またはレガシーサポート用のJSONファイル）にコミットされます。

### 粒度の細かいコマンド

状態全体をやり取りするのではなく、特定のコマンドを使用します：

- `create_task`, `update_task`, `delete_task`
- `create_task_group`, `move_task_to_group`

このアプローチにより、データの一貫性が保たれ、オーバーヘッドが削減されます。
