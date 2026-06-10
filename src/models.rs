use serde::{Deserialize, Serialize};
use chrono::{Datelike, Duration, NaiveDate};
use sha2::{Digest, Sha256};
use std::fmt;
use std::path::{Path, PathBuf};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, Hash)]
pub enum TaskStatus {
    Todo,
    Done,
    InProgress,
    Cancelled,
}

impl TaskStatus {
    pub fn from_symbol(s: &str) -> Option<Self> {
        match s {
            " " => Some(TaskStatus::Todo),
            "x" | "X" => Some(TaskStatus::Done),
            "/" => Some(TaskStatus::InProgress),
            "-" => Some(TaskStatus::Cancelled),
            _ => None,
        }
    }

    pub fn to_symbol(&self) -> &'static str {
        match self {
            TaskStatus::Todo => " ",
            TaskStatus::Done => "x",
            TaskStatus::InProgress => "/",
            TaskStatus::Cancelled => "-",
        }
    }

    pub fn to_label(&self) -> &'static str {
        match self {
            TaskStatus::Todo => "待办",
            TaskStatus::Done => "已完成",
            TaskStatus::InProgress => "进行中",
            TaskStatus::Cancelled => "已取消",
        }
    }
}

impl fmt::Display for TaskStatus {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.to_label())
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, Hash)]
pub enum DueDate {
    Date(NaiveDate),
    Today,
    Tomorrow,
    ThisWeek,
    NextWeek,
    Overdue,
}

impl DueDate {
    pub fn to_naive_date(&self, reference: NaiveDate) -> Option<NaiveDate> {
        match self {
            DueDate::Date(d) => Some(*d),
            DueDate::Today => Some(reference),
            DueDate::Tomorrow => Some(reference + Duration::days(1)),
            DueDate::ThisWeek => {
                let weekday = reference.weekday().num_days_from_monday();
                Some(reference - Duration::days(weekday as i64) + Duration::days(6))
            }
            DueDate::NextWeek => {
                let weekday = reference.weekday().num_days_from_monday();
                Some(reference - Duration::days(weekday as i64) + Duration::days(13))
            }
            DueDate::Overdue => None,
        }
    }

    pub fn is_overdue(&self, reference: NaiveDate) -> bool {
        match self.to_naive_date(reference) {
            Some(d) => d < reference,
            None => matches!(self, DueDate::Overdue),
        }
    }
}

impl fmt::Display for DueDate {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            DueDate::Date(d) => write!(f, "{}", d.format("%Y-%m-%d")),
            DueDate::Today => write!(f, "今天"),
            DueDate::Tomorrow => write!(f, "明天"),
            DueDate::ThisWeek => write!(f, "本周"),
            DueDate::NextWeek => write!(f, "下周"),
            DueDate::Overdue => write!(f, "已逾期"),
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, Hash)]
pub struct Tag(pub String);

impl Tag {
    pub fn new(name: &str) -> Result<Self, String> {
        let trimmed = name.trim().trim_start_matches('#').trim();
        if trimmed.is_empty() {
            return Err("标签不能为空".to_string());
        }
        if trimmed.contains(|c: char| c.is_whitespace() || c == '#' || c == '(' || c == ')') {
            return Err(format!("标签包含非法字符: '{}'", trimmed));
        }
        Ok(Tag(trimmed.to_lowercase()))
    }

    pub fn as_str(&self) -> &str {
        &self.0
    }
}

impl fmt::Display for Tag {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "#{}", self.0)
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SourceLocation {
    pub file: PathBuf,
    pub line: usize,
    pub raw_text: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TodoItem {
    pub id: String,
    pub content: String,
    pub status: TaskStatus,
    pub project: Option<String>,
    pub tags: Vec<Tag>,
    pub due_date: Option<DueDate>,
    pub priority: Option<u8>,
    pub source: SourceLocation,
}

impl TodoItem {
    pub fn dedup_key(&self) -> String {
        let mut hasher = Sha256::new();
        hasher.update(self.content.to_lowercase().as_bytes());
        if let Some(proj) = &self.project {
            hasher.update(b"|proj|");
            hasher.update(proj.to_lowercase().as_bytes());
        }
        if let Some(due) = &self.due_date {
            hasher.update(b"|due|");
            hasher.update(format!("{}", due).as_bytes());
        }
        let result = hasher.finalize();
        hex::encode(&result[..12])
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExportReport {
    pub generated_at: String,
    pub total_parsed: usize,
    pub total_after_filter: usize,
    pub total_after_dedup: usize,
    pub duplicates_removed: usize,
    pub files_scanned: Vec<PathBuf>,
    pub items: Vec<TodoItem>,
    pub dry_run: bool,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ExportFormat {
    Stdout,
    Json,
    Markdown,
}

impl ExportFormat {
    pub fn from_str(s: &str) -> Option<Self> {
        match s.to_lowercase().as_str() {
            "stdout" | "console" | "-" => Some(ExportFormat::Stdout),
            "json" => Some(ExportFormat::Json),
            "md" | "markdown" => Some(ExportFormat::Markdown),
            _ => None,
        }
    }
}

#[derive(Debug, Clone)]
pub struct DueDateFilter {
    pub before: Option<NaiveDate>,
    pub after: Option<NaiveDate>,
    pub exactly: Option<NaiveDate>,
}

impl DueDateFilter {
    pub fn matches(&self, due: &Option<DueDate>, reference: NaiveDate) -> bool {
        let (due_date, is_overdue_tag) = match due {
            None => return false,
            Some(d) => match d.to_naive_date(reference) {
                None => {
                    let is_ov = matches!(d, DueDate::Overdue);
                    if !is_ov {
                        return false;
                    }
                    // DueDate::Overdue 只在明确查询逾期时才通过：
                    //   1. 没有 exactly
                    //   2. 没有 after
                    //   3. before 存在且 before < reference (即查"在 reference 之前到期 ≈ 逾期)
                    if self.exactly.is_some() {
                        return false;
                    }
                    if self.after.is_some() {
                        return false;
                    }
                    match self.before {
                        Some(b) if b < reference => return true,
                        _ => return false,
                    }
                }
                Some(d) => (d, false),
            },
        };
        let _ = is_overdue_tag;

        if let Some(before) = self.before {
            if due_date > before {
                return false;
            }
        }
        if let Some(after) = self.after {
            if due_date < after {
                return false;
            }
        }
        if let Some(exactly) = self.exactly {
            if due_date != exactly {
                return false;
            }
        }
        true
    }
}

pub fn is_markdown_file(path: &Path) -> bool {
    match path.extension().and_then(|e| e.to_str()) {
        Some(ext) => {
            let ext = ext.to_lowercase();
            ext == "md" || ext == "markdown" || ext == "mdown" || ext == "mkd"
        }
        None => false,
    }
}
