# Architecture & Implementation Overview

This document provides a high-level overview of key features implemented in the Norunos Platform, specifically focusing on the recent additions of **Graph View** and **Task Group Management**.

## 1. Graph View (Notes Feature)

The Graph View visualizes the relationships between Markdown notes in the system, inspired by Obsidian's graph view.

### Frontend (`src/components/Notes/GraphView.tsx`)

- **Library**: `react-force-graph-2d` is used for rendering the interactive force-directed graph.
- **Canvas Rendering**: To ensure performance with many nodes, labels are drawn directly on the canvas using `nodeCanvasObject` rather than DOM elements.
- **Navigation**: Clicking a node triggers navigation to `internal://NoteName`, which the main `NotesView` intercepts to open the corresponding file.

### Backend (`src-tauri/src/commands/notes/fs.rs`)

- **`get_graph_data`**: This Tauri command recursively scans the `NorunosNotes` directory.
  - **Nodes**: Every `.md` file becomes a node. The ID is the filename stem (without extension).
  - **Links**: The file content is parsed for wiki-link patterns (`[[Target]]` or `[[Target|Alias]]`). A link is created from the current file to the target.

---

## 2. Task Group Management

This feature allows organizing tasks into groups and moving them between groups.

### Data Model (SQLite)

- **`tasks`**: Stores individual task details. IDs are UUIDs.
- **`task_groups`**: Stores group metadata (name, created_at).
- **`rela_task_task_group`**: A many-to-many (conceptually, though currently used as one-to-many) join table linking `task_id` and `task_group_id`.

### Backend (`src-tauri/src/commands/task/sql/task_group_commands.rs`)

- **`move_task_to_group(task_id, group_id)`**:
    1. Deletes existing entries for the `task_id` in the relationship table (removing it from old group).
    2. Inserts a new entry connecting `task_id` to the new `group_id`.

### Frontend (`src/components/ToDoList`)

- **`TaskList.tsx`** & **`TaskCard.tsx`**: Receive the full list of `TaskGroup`s as props to enable context-aware operations.
- **`EditTaskDialog.tsx`**: Provides the UI for changing a task's group. It compares the selected group with the initial group and calls `moveTaskToGroup` if changed upon saving.

## 3. Directory Structure (Key Files)

- `src-tauri/src/commands/`: Rust backend command modules.
  - `notes/fs.rs`: File system and graph logic for notes.
  - `task/`: Task management logic.
    - `sql/`: Database interaction layers using SQLx.
- `src/components/`: React frontend components.
  - `Notes/`: Note editor and graph visualization.
  - `ToDoList/`: Task management UI.
