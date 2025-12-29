use std::collections::HashMap;

use crate::commands::{
    memo::memo::{MemoContent, MemoMeta},
    task::task_group::TaskGroup,
};

pub struct AppDatas {
    pub task_groups: Vec<TaskGroup>,
    pub memo: HashMap<MemoContent, MemoMeta>,
}
