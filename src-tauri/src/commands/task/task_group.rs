use uuid::Uuid;

use crate::commands::task::task::Task;

pub struct TaskGroup {
    pub id: Uuid,
    pub name: String,
    pub tasks: Vec<Task>,
}

impl TaskGroup {
    fn default() -> Self {
        TaskGroup {
            id: Uuid::new_v4(),
            name: "".to_string(),
            tasks: Vec::new(),
        }
    }
}
