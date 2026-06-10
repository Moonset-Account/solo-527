use crate::models::TodoItem;
use std::collections::HashSet;

pub struct DedupResult {
    pub unique_items: Vec<TodoItem>,
    pub duplicates: Vec<TodoItem>,
}

pub fn deduplicate(items: Vec<TodoItem>) -> DedupResult {
    let mut seen_keys: HashSet<String> = HashSet::new();
    let mut unique = Vec::new();
    let mut duplicates = Vec::new();

    for item in items {
        let key = item.dedup_key();
        if seen_keys.contains(&key) {
            log::debug!(
                "发现重复任务: key={}, content='{}', source={}:{}",
                &key[..8],
                item.content,
                item.source.file.display(),
                item.source.line
            );
            duplicates.push(item);
        } else {
            seen_keys.insert(key);
            unique.push(item);
        }
    }

    DedupResult {
        unique_items: unique,
        duplicates,
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::{DueDate, SourceLocation, TaskStatus};
    use chrono::NaiveDate;
    use std::path::PathBuf;

    fn make_item(content: &str, project: Option<&str>, due: Option<DueDate>) -> TodoItem {
        TodoItem {
            id: "test".to_string(),
            content: content.to_string(),
            status: TaskStatus::Todo,
            project: project.map(|s| s.to_string()),
            tags: vec![],
            due_date: due,
            priority: None,
            source: SourceLocation {
                file: PathBuf::from("test.md"),
                line: 1,
                raw_text: String::new(),
            },
        }
    }

    #[test]
    fn test_dedup_same_content_same_project() {
        let items = vec![
            make_item("写报告", Some("工作"), None),
            make_item("写报告", Some("工作"), None),
        ];
        let result = deduplicate(items);
        assert_eq!(result.unique_items.len(), 1);
        assert_eq!(result.duplicates.len(), 1);
    }

    #[test]
    fn test_dedup_same_content_different_project() {
        let items = vec![
            make_item("写报告", Some("工作"), None),
            make_item("写报告", Some("个人"), None),
        ];
        let result = deduplicate(items);
        assert_eq!(result.unique_items.len(), 2);
        assert_eq!(result.duplicates.len(), 0);
    }

    #[test]
    fn test_dedup_same_content_different_due() {
        let d1 = DueDate::Date(NaiveDate::from_ymd_opt(2025, 1, 1).unwrap());
        let d2 = DueDate::Date(NaiveDate::from_ymd_opt(2025, 1, 2).unwrap());
        let items = vec![
            make_item("写报告", Some("工作"), Some(d1)),
            make_item("写报告", Some("工作"), Some(d2)),
        ];
        let result = deduplicate(items);
        assert_eq!(result.unique_items.len(), 2);
        assert_eq!(result.duplicates.len(), 0);
    }

    #[test]
    fn test_dedup_case_insensitive_content() {
        let items = vec![
            make_item("Write Report", Some("工作"), None),
            make_item("write report", Some("工作"), None),
        ];
        let result = deduplicate(items);
        assert_eq!(result.unique_items.len(), 1);
        assert_eq!(result.duplicates.len(), 1);
    }
}
