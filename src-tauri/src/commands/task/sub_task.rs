use uuid::Uuid;

#[derive(PartialEq)]
pub struct Subtask {
    pub id: Uuid,
    pub order: i32,
    pub description: String,
    pub completed: bool,
}

impl Subtask {
    fn default(self) -> Self {
        Subtask {
            id: Uuid::new_v4(),
            order: 0,
            description: "".to_string(),
            completed: false,
        }
    }
}
