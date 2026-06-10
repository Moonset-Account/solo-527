use crate::errors::{Note2TaskError, Result};
use crate::models::{DueDate, SourceLocation, Tag, TaskStatus, TodoItem};
use chrono::NaiveDate;
use regex::Regex;
use std::path::{Path, PathBuf};
use std::sync::OnceLock;

fn todo_line_re() -> &'static Regex {
    static RE: OnceLock<Regex> = OnceLock::new();
    RE.get_or_init(|| Regex::new(r"^\s*[-*+]\s+\[([ xX/-])\]\s+(.*)$").unwrap())
}

fn heading_re() -> &'static Regex {
    static RE: OnceLock<Regex> = OnceLock::new();
    RE.get_or_init(|| Regex::new(r"^(#{2,6})\s+(.+)$").unwrap())
}

fn tag_re() -> &'static Regex {
    static RE: OnceLock<Regex> = OnceLock::new();
    RE.get_or_init(|| Regex::new(r"#([A-Za-z0-9_\u{4e00}-\u{9fff}-]+)").unwrap())
}

fn due_date_re() -> &'static Regex {
    static RE: OnceLock<Regex> = OnceLock::new();
    RE.get_or_init(|| {
        Regex::new(r"@due\((\d{4}-\d{2}-\d{2}|today|tomorrow|this.?week|next.?week|overdue)\)")
            .unwrap()
    })
}

fn priority_re() -> &'static Regex {
    static RE: OnceLock<Regex> = OnceLock::new();
    RE.get_or_init(|| Regex::new(r"!([1-5])").unwrap())
}

fn date_pattern_re() -> &'static Regex {
    static RE: OnceLock<Regex> = OnceLock::new();
    RE.get_or_init(|| Regex::new(r"^(\d{4})-(\d{2})-(\d{2})$").unwrap())
}

pub struct MarkdownParser {
    strict: bool,
    today: NaiveDate,
}

impl MarkdownParser {
    pub fn new(today: NaiveDate) -> Self {
        Self {
            strict: false,
            today,
        }
    }

    pub fn with_strict(mut self, strict: bool) -> Self {
        self.strict = strict;
        self
    }

    pub fn parse_file(&self, path: &Path) -> Result<Vec<TodoItem>> {
        let content = std::fs::read_to_string(path).map_err(|e| Note2TaskError::ReadError {
            path: path.display().to_string(),
            reason: e.to_string(),
        })?;
        self.parse_content(&content, path.to_path_buf())
    }

    pub fn parse_content(&self, content: &str, file: PathBuf) -> Result<Vec<TodoItem>> {
        let mut items = Vec::new();
        let mut current_project: Option<String> = None;
        let mut id_counter: usize = 0;

        for (line_idx, raw_line) in content.lines().enumerate() {
            let line_num = line_idx + 1;
            let line = raw_line.trim_end();

            if let Some(caps) = heading_re().captures(line) {
                let _level = caps[1].len();
                let title = caps[2].trim().to_string();
                log::debug!(
                    "发现标题: 级别={}, 标题='{}' (文件: {}, 行: {})",
                    _level,
                    title,
                    file.display(),
                    line_num
                );
                current_project = Some(title);
                continue;
            }

            if let Some(caps) = todo_line_re().captures(line) {
                let symbol = &caps[1];
                let rest = caps[2].to_string();

                let status = match TaskStatus::from_symbol(symbol) {
                    Some(s) => s,
                    None => {
                        if self.strict {
                            return Err(Note2TaskError::ParseError {
                                message: format!("未知的待办状态符号: '{}'", symbol),
                                file: file.display().to_string(),
                                line: line_num,
                            });
                        } else {
                            log::warn!(
                                "跳过未知待办状态 '{}': {} (文件: {}, 行: {})",
                                symbol,
                                line,
                                file.display(),
                                line_num
                            );
                            continue;
                        }
                    }
                };

                let (content, tags) = Self::extract_tags(&rest);
                let (content, due_date) = Self::extract_due_date(&content, self.today);
                let (content, priority) = Self::extract_priority(&content);
                let content = content.trim().to_string();

                if content.is_empty() {
                    log::debug!(
                        "跳过空内容待办项 (文件: {}, 行: {})",
                        file.display(),
                        line_num
                    );
                    continue;
                }

                id_counter += 1;
                let raw_id = format!(
                    "{}-{}-{}",
                    file.to_string_lossy()
                        .replace(|c: char| !c.is_alphanumeric(), "_"),
                    line_num,
                    id_counter
                );
                let id = Self::make_short_id(&raw_id);

                items.push(TodoItem {
                    id,
                    content,
                    status,
                    project: current_project.clone(),
                    tags,
                    due_date,
                    priority,
                    source: SourceLocation {
                        file: file.clone(),
                        line: line_num,
                        raw_text: line.to_string(),
                    },
                });
            }
        }

        log::debug!("从 {} 解析到 {} 个待办项", file.display(), items.len());
        Ok(items)
    }

    fn extract_tags(input: &str) -> (String, Vec<Tag>) {
        let mut tags = Vec::new();
        let mut positions = Vec::new();

        for caps in tag_re().captures_iter(input) {
            let tag_name = &caps[1];
            match Tag::new(tag_name) {
                Ok(tag) => {
                    if !tags.iter().any(|t: &Tag| t.as_str() == tag.as_str()) {
                        tags.push(tag);
                    }
                }
                Err(e) => log::warn!("跳过无效标签 '{}': {}", tag_name, e),
            }
            if let Some(m) = caps.get(0) {
                positions.push((m.start(), m.end()));
            }
        }

        positions.sort_by_key(|(s, _)| *s);
        let mut result = String::with_capacity(input.len());
        let mut last_end = 0;
        for (s, e) in &positions {
            result.push_str(&input[last_end..*s]);
            last_end = *e;
        }
        result.push_str(&input[last_end..]);

        (result.trim().to_string(), tags)
    }

    fn extract_due_date(input: &str, _today: NaiveDate) -> (String, Option<DueDate>) {
        if let Some(caps) = due_date_re().captures(input) {
            let raw = &caps[1];
            let due = match raw.to_lowercase().as_str() {
                "today" => Some(DueDate::Today),
                "tomorrow" => Some(DueDate::Tomorrow),
                s if s.contains("week") && s.contains("this") => Some(DueDate::ThisWeek),
                s if s.contains("week") && s.contains("next") => Some(DueDate::NextWeek),
                "overdue" => Some(DueDate::Overdue),
                date_str if date_pattern_re().is_match(date_str) => {
                    let caps = date_pattern_re().captures(date_str).unwrap();
                    let y: i32 = caps[1].parse().unwrap();
                    let m: u32 = caps[2].parse().unwrap();
                    let d: u32 = caps[3].parse().unwrap();
                    match NaiveDate::from_ymd_opt(y, m, d) {
                        Some(nd) => Some(DueDate::Date(nd)),
                        None => {
                            log::warn!("无效的日期值: {}", date_str);
                            None
                        }
                    }
                }
                _ => {
                    log::warn!("无法识别的日期格式: {}", raw);
                    None
                }
            };

            if let Some(m) = caps.get(0) {
                let mut result = String::new();
                result.push_str(&input[..m.start()]);
                result.push_str(&input[m.end()..]);
                return (result.trim().to_string(), due);
            }
        }
        (input.to_string(), None)
    }

    fn extract_priority(input: &str) -> (String, Option<u8>) {
        if let Some(caps) = priority_re().captures(input) {
            let prio: u8 = caps[1].parse().unwrap();
            if let Some(m) = caps.get(0) {
                let mut result = String::new();
                result.push_str(&input[..m.start()]);
                result.push_str(&input[m.end()..]);
                return (result.trim().to_string(), Some(prio));
            }
        }
        (input.to_string(), None)
    }

    fn make_short_id(s: &str) -> String {
        use sha2::{Digest, Sha256};
        let mut hasher = Sha256::new();
        hasher.update(s.as_bytes());
        let result = hasher.finalize();
        hex::encode(&result[..10])
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn sample_today() -> NaiveDate {
        NaiveDate::from_ymd_opt(2025, 1, 15).unwrap()
    }

    #[test]
    fn test_parse_simple_todo() {
        let parser = MarkdownParser::new(sample_today());
        let content = "- [ ] 买牛奶\n- [x] 写文档\n";
        let items = parser.parse_content(content, PathBuf::from("test.md")).unwrap();
        assert_eq!(items.len(), 2);
        assert_eq!(items[0].content, "买牛奶");
        assert_eq!(items[0].status, TaskStatus::Todo);
        assert_eq!(items[1].content, "写文档");
        assert_eq!(items[1].status, TaskStatus::Done);
    }

    #[test]
    fn test_parse_with_project() {
        let parser = MarkdownParser::new(sample_today());
        let content = "## 工作项目\n- [ ] 完成代码审查\n";
        let items = parser.parse_content(content, PathBuf::from("test.md")).unwrap();
        assert_eq!(items.len(), 1);
        assert_eq!(items[0].project, Some("工作项目".to_string()));
    }

    #[test]
    fn test_parse_with_tags() {
        let parser = MarkdownParser::new(sample_today());
        let content = "- [ ] 修复登录问题 #bug #urgent\n";
        let items = parser.parse_content(content, PathBuf::from("test.md")).unwrap();
        assert_eq!(items.len(), 1);
        assert_eq!(items[0].tags.len(), 2);
        assert_eq!(items[0].tags[0].as_str(), "bug");
        assert_eq!(items[0].tags[1].as_str(), "urgent");
        assert_eq!(items[0].content, "修复登录问题");
    }

    #[test]
    fn test_parse_with_due_date() {
        let parser = MarkdownParser::new(sample_today());
        let content = "- [ ] 提交周报 @due(2025-01-20)\n";
        let items = parser.parse_content(content, PathBuf::from("test.md")).unwrap();
        assert_eq!(items.len(), 1);
        match &items[0].due_date {
            Some(DueDate::Date(d)) => {
                assert_eq!(d, &NaiveDate::from_ymd_opt(2025, 1, 20).unwrap())
            }
            _ => panic!("日期解析错误"),
        }
    }

    #[test]
    fn test_parse_with_priority() {
        let parser = MarkdownParser::new(sample_today());
        let content = "- [ ] 服务器告警 !2\n";
        let items = parser.parse_content(content, PathBuf::from("test.md")).unwrap();
        assert_eq!(items[0].priority, Some(2));
    }

    #[test]
    fn test_parse_in_progress_and_cancelled() {
        let parser = MarkdownParser::new(sample_today());
        let content = "- [/] 进行中的任务\n- [-] 取消的任务\n";
        let items = parser.parse_content(content, PathBuf::from("test.md")).unwrap();
        assert_eq!(items[0].status, TaskStatus::InProgress);
        assert_eq!(items[1].status, TaskStatus::Cancelled);
    }

    #[test]
    fn test_relative_dates() {
        let parser = MarkdownParser::new(sample_today());
        let content = "- [ ] 今天 @due(today)\n- [ ] 明天 @due(tomorrow)\n- [ ] 本周 @due(this-week)\n- [ ] 下周 @due(next-week)\n- [ ] 逾期 @due(overdue)\n";
        let items = parser.parse_content(content, PathBuf::from("test.md")).unwrap();
        assert_eq!(items.len(), 5);
        assert!(matches!(items[0].due_date, Some(DueDate::Today)));
        assert!(matches!(items[1].due_date, Some(DueDate::Tomorrow)));
        assert!(matches!(items[2].due_date, Some(DueDate::ThisWeek)));
        assert!(matches!(items[3].due_date, Some(DueDate::NextWeek)));
        assert!(matches!(items[4].due_date, Some(DueDate::Overdue)));
    }
}
