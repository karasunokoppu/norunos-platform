use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TaskDependency {
    pub task_id: String,
    pub depends_on_id: String,
    pub dependency_type: String, // e.g., "FS" (Finish-to-Start)
}
