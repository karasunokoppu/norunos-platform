use uuid::Uuid;

pub struct TaskElement {
    description: String,
    details: Option<String>,
}

impl TaskElement {
    pub fn default() -> Self {
        TaskElement {
            description: "No description.".to_string(),
            details: None,
        }
    }

    pub fn update_description(self, description: String) -> Self {
        TaskElement {
            description,
            details: self.details,
        }
    }

    pub fn update_group(self, group: Uuid) -> Self {
        TaskElement {
            description: self.description,
            details: self.details,
        }
    }

    pub fn update_details(self, details: String) -> Self {
        TaskElement {
            description: self.description,
            details: Some(details),
        }
    }
}
