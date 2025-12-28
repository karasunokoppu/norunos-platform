use crate::commands::Task::{
    gantt_element::GanttElement, sub_task::Subtask, task_element::TaskElement,
};
use uuid::Uuid;

pub struct Task {
    id: Uuid,
    completed: bool,
    task_element: TaskElement,
    gantt_element: GanttElement,
    subtasks: Vec<Subtask>,
}

impl Task {
    pub fn default() -> Self {
        Task {
            id: Uuid::new_v4(),
            completed: false,
            task_element: TaskElement::default(),
            gantt_element: GanttElement::default(),
            subtasks: Vec::new(),
        }
    }

    pub fn update_completed(self, completed: bool) -> Self {
        Task {
            id: Uuid::new_v4(),
            completed: completed,
            task_element: self.task_element,
            gantt_element: self.gantt_element,
            subtasks: self.subtasks,
        }
    }

    pub fn update_task_element(self, task_element: TaskElement) -> Self {
        Task {
            id: Uuid::new_v4(),
            completed: self.completed,
            task_element: task_element,
            gantt_element: self.gantt_element,
            subtasks: self.subtasks,
        }
    }

    pub fn update_gantt_element(self, gantt_element: GanttElement) -> Self {
        Task {
            id: Uuid::new_v4(),
            completed: self.completed,
            task_element: self.task_element,
            gantt_element: gantt_element,
            subtasks: self.subtasks,
        }
    }

    pub fn push_subtask(mut self, subtask: Subtask) -> Self {
        self.subtasks.push(subtask);

        Task {
            id: self.id,
            completed: self.completed,
            task_element: self.task_element,
            gantt_element: self.gantt_element,
            subtasks: self.subtasks,
        }
    }
    pub fn removed_subtask(mut self, subtask: Subtask) -> Self {
        let removed_index = self
            .subtasks
            .iter()
            .enumerate()
            .find(|&x| x.1.id == subtask.id)
            .unwrap();
        self.subtasks.remove(removed_index.0);

        Task {
            id: self.id,
            completed: self.completed,
            task_element: self.task_element,
            gantt_element: self.gantt_element,
            subtasks: self.subtasks,
        }
    }
}
