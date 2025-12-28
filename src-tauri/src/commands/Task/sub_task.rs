use uuid::Uuid;

#[derive(PartialEq)]
pub struct Subtask {
    pub id: Uuid,
    description: String,
    completed: bool,
}

impl Subtask {
    fn default(self) -> Self {
        Subtask {
            id: Uuid::new_v4(),
            description: "".to_string(),
            completed: false,
        }
    }
}
