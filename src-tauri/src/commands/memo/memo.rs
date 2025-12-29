use chrono::{DateTime, Local};
use uuid::Uuid;

//TODO Serde
pub struct MemoContent {
    pub meta_data_id: Uuid,
    pub content: Option<String>,
}

impl MemoContent {
    fn default() -> Self {
        MemoContent {
            meta_data_id: Uuid::new_v4(), //メタデータのid
            content: None,
        }
    }
}

//TODO SQLiteに保存
pub struct MemoMeta {
    pub id: Uuid,
    pub title: String,
    pub tags: Vec<String>,
    pub path: String,
    //メタ情報
    pub created_at: DateTime<Local>,
    pub updated_at: DateTime<Local>,
    pub deleted_at: DateTime<Local>,
}

impl MemoMeta {
    fn default() -> Self {
        MemoMeta {
            id: Uuid::new_v4(),
            title: "".to_string(),
            tags: Vec::new(),
            path: "".to_string(),
            created_at: DateTime::default(),
            updated_at: DateTime::default(),
            deleted_at: DateTime::default(),
        }
    }
}
