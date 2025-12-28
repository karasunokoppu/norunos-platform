use chrono::{DateTime, Local};

pub struct GanttElement {
    start_datetime: Option<DateTime<Local>>,
    end_datetime: Option<DateTime<Local>>,
    progress: u32, //進捗率
}

impl GanttElement {
    pub fn default() -> Self {
        GanttElement {
            start_datetime: None,
            end_datetime: None,
            progress: 0,
        }
    }

    pub fn update_start_time(self, start_datetime: DateTime<Local>) -> Self {
        GanttElement {
            start_datetime: Some(start_datetime),
            end_datetime: self.end_datetime,
            progress: self.progress,
        }
    }

    pub fn update_end_time(self, end_datetime: DateTime<Local>) -> Self {
        GanttElement {
            start_datetime: self.start_datetime,
            end_datetime: Some(end_datetime),
            progress: self.progress,
        }
    }

    pub fn update_progress(self, progress: u32) -> Self {
        GanttElement {
            start_datetime: self.start_datetime,
            end_datetime: self.end_datetime,
            progress: progress,
        }
    }
}
