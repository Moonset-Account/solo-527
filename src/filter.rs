use crate::cli::StatusFilter;
use crate::models::{DueDateFilter, Tag, TaskStatus, TodoItem};
use chrono::NaiveDate;

pub struct FilterCriteria {
    pub tags_any: Vec<String>,
    pub tags_all: Vec<String>,
    pub due: Option<DueDateFilter>,
    pub status: Vec<StatusFilter>,
    pub projects: Vec<String>,
    pub priority: Option<u8>,
    pub today: NaiveDate,
}

impl FilterCriteria {
    pub fn matches(&self, item: &TodoItem) -> bool {
        if !self.matches_tags_all(item) {
            return false;
        }
        if !self.matches_due(item) {
            return false;
        }
        if !self.matches_status(item) {
            return false;
        }
        if !self.matches_project(item) {
            return false;
        }
        if !self.matches_priority(item) {
            return false;
        }
        true
    }

    fn matches_tags_all(&self, item: &TodoItem) -> bool {
        if self.tags_all.is_empty() {
            return true;
        }
        let item_tags: Vec<&str> = item.tags.iter().map(|t: &Tag| t.as_str()).collect();
        self.tags_all
            .iter()
            .all(|t| item_tags.contains(&t.to_lowercase().as_str()))
    }

    fn matches_due(&self, item: &TodoItem) -> bool {
        match &self.due {
            None => true,
            Some(filter) => filter.matches(&item.due_date, self.today),
        }
    }

    fn matches_status(&self, item: &TodoItem) -> bool {
        if self.status.is_empty()
            || self
                .status
                .iter()
                .any(|s| matches!(s, StatusFilter::All))
        {
            return true;
        }
        self.status.iter().any(|s| match s {
            StatusFilter::Todo => item.status == TaskStatus::Todo,
            StatusFilter::Done => item.status == TaskStatus::Done,
            StatusFilter::InProgress => item.status == TaskStatus::InProgress,
            StatusFilter::Cancelled => item.status == TaskStatus::Cancelled,
            StatusFilter::All => true,
        })
    }

    fn matches_project(&self, item: &TodoItem) -> bool {
        if self.projects.is_empty() {
            return true;
        }
        let proj = match &item.project {
            Some(p) => p.to_lowercase(),
            None => return false,
        };
        self.projects
            .iter()
            .any(|p| proj.contains(&p.to_lowercase()))
    }

    fn matches_priority(&self, item: &TodoItem) -> bool {
        match self.priority {
            None => true,
            Some(p) => item.priority.map_or(false, |ip| ip == p),
        }
    }
}

pub fn apply_filters(items: Vec<TodoItem>, criteria: &FilterCriteria) -> Vec<TodoItem> {
    items
        .into_iter()
        .filter(|item| criteria.matches(item))
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::{DueDate, SourceLocation, TaskStatus};
    use chrono::NaiveDate;
    use std::path::PathBuf;

    fn make_item(
        content: &str,
        project: Option<&str>,
        tags: Vec<&str>,
        due: Option<DueDate>,
        status: TaskStatus,
        priority: Option<u8>,
    ) -> TodoItem {
        TodoItem {
            id: "test".to_string(),
            content: content.to_string(),
            status,
            project: project.map(|s| s.to_string()),
            tags: tags.into_iter().map(|t| Tag::new(t).unwrap()).collect(),
            due_date: due,
            priority,
            source: SourceLocation {
                file: PathBuf::from("test.md"),
                line: 1,
                raw_text: String::new(),
            },
        }
    }

    fn today() -> NaiveDate {
        NaiveDate::from_ymd_opt(2025, 1, 15).unwrap()
    }

    #[test]
    fn test_filter_by_tag() {
        let items = vec![
            make_item("t1", None, vec!["bug", "urgent"], None, TaskStatus::Todo, None),
            make_item("t2", None, vec!["feature"], None, TaskStatus::Todo, None),
        ];
        let criteria = FilterCriteria {
            tags_all: vec!["bug".to_string()],
            tags_any: vec![],
            due: None,
            status: vec![],
            projects: vec![],
            priority: None,
            today: today(),
        };
        let r = apply_filters(items, &criteria);
        assert_eq!(r.len(), 1);
        assert_eq!(r[0].content, "t1");
    }

    #[test]
    fn test_filter_by_status() {
        let items = vec![
            make_item("t1", None, vec![], None, TaskStatus::Todo, None),
            make_item("t2", None, vec![], None, TaskStatus::Done, None),
        ];
        let criteria = FilterCriteria {
            tags_all: vec![],
            tags_any: vec![],
            due: None,
            status: vec![StatusFilter::Done],
            projects: vec![],
            priority: None,
            today: today(),
        };
        let r = apply_filters(items, &criteria);
        assert_eq!(r.len(), 1);
        assert_eq!(r[0].content, "t2");
    }

    #[test]
    fn test_filter_by_project() {
        let items = vec![
            make_item("t1", Some("Alpha"), vec![], None, TaskStatus::Todo, None),
            make_item("t2", Some("Beta"), vec![], None, TaskStatus::Todo, None),
        ];
        let criteria = FilterCriteria {
            tags_all: vec![],
            tags_any: vec![],
            due: None,
            status: vec![],
            projects: vec!["alpha".to_string()],
            priority: None,
            today: today(),
        };
        let r = apply_filters(items, &criteria);
        assert_eq!(r.len(), 1);
    }

    #[test]
    fn test_filter_by_priority() {
        let items = vec![
            make_item("t1", None, vec![], None, TaskStatus::Todo, Some(1)),
            make_item("t2", None, vec![], None, TaskStatus::Todo, Some(3)),
        ];
        let criteria = FilterCriteria {
            tags_all: vec![],
            tags_any: vec![],
            due: None,
            status: vec![],
            projects: vec![],
            priority: Some(1),
            today: today(),
        };
        let r = apply_filters(items, &criteria);
        assert_eq!(r.len(), 1);
    }

    #[test]
    fn test_filter_by_due_date() {
        let d1 = DueDate::Date(NaiveDate::from_ymd_opt(2025, 1, 10).unwrap());
        let d2 = DueDate::Date(NaiveDate::from_ymd_opt(2025, 1, 20).unwrap());
        let items = vec![
            make_item("t1", None, vec![], Some(d1), TaskStatus::Todo, None),
            make_item("t2", None, vec![], Some(d2), TaskStatus::Todo, None),
        ];
        let criteria = FilterCriteria {
            tags_all: vec![],
            tags_any: vec![],
            due: Some(DueDateFilter {
                before: Some(NaiveDate::from_ymd_opt(2025, 1, 15).unwrap()),
                after: None,
                exactly: None,
            }),
            status: vec![],
            projects: vec![],
            priority: None,
            today: today(),
        };
        let r = apply_filters(items, &criteria);
        assert_eq!(r.len(), 1);
    }
}
