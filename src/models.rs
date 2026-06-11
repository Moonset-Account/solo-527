use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum ChangeCategory {
    Feature,
    Fix,
    KnownIssue,
    UpgradeNotice,
    Unknown,
}

impl std::fmt::Display for ChangeCategory {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            ChangeCategory::Feature => write!(f, "feature"),
            ChangeCategory::Fix => write!(f, "fix"),
            ChangeCategory::KnownIssue => write!(f, "known_issue"),
            ChangeCategory::UpgradeNotice => write!(f, "upgrade_notice"),
            ChangeCategory::Unknown => write!(f, "unknown"),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SourceLink {
    pub url: String,
    pub label: Option<String>,
    pub source_type: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CommitInfo {
    pub hash: String,
    pub short_hash: String,
    pub message: String,
    pub author: String,
    pub author_email: Option<String>,
    pub timestamp: Option<DateTime<Utc>>,
    pub is_merge: bool,
    pub branch_name: Option<String>,
    pub merge_from: Option<String>,
    pub source_links: Vec<SourceLink>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IssueInfo {
    pub id: String,
    pub title: String,
    pub url: Option<String>,
    pub status: Option<String>,
    pub labels: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ManualNote {
    pub id: String,
    pub title: String,
    pub content: String,
    pub category: Option<ChangeCategory>,
    pub scope: Option<String>,
    pub source_links: Vec<SourceLink>,
    pub source_file: Option<PathBuf>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChangeEntry {
    pub id: String,
    pub title: Option<String>,
    pub description: String,
    pub category: ChangeCategory,
    pub scope: Option<String>,
    pub ticket_ids: Vec<String>,
    pub commits: Vec<CommitInfo>,
    pub issues: Vec<IssueInfo>,
    pub manual_notes: Vec<ManualNote>,
    pub source_links: Vec<SourceLink>,
    pub source_file: Option<PathBuf>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ValidationRule {
    pub rule_id: String,
    pub description: String,
    pub severity: String,
    pub suggested_action: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ValidationIssue {
    pub rule_id: String,
    pub severity: String,
    pub description: String,
    pub suggested_action: String,
    pub entry_id: Option<String>,
    pub source_file: Option<PathBuf>,
    pub affected_fields: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ValidationResult {
    pub is_valid: bool,
    pub issues: Vec<ValidationIssue>,
    pub entries_needing_review: Vec<ChangeEntry>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CollectedData {
    pub git_tag: Option<String>,
    pub from_tag: Option<String>,
    pub to_tag: Option<String>,
    pub commits: Vec<CommitInfo>,
    pub issues: Vec<IssueInfo>,
    pub manual_notes: Vec<ManualNote>,
    pub input_files: Vec<PathBuf>,
    pub collected_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProductLineTemplate {
    pub name: String,
    pub product_name: String,
    pub feature_title: String,
    pub fix_title: String,
    pub known_issue_title: String,
    pub upgrade_notice_title: String,
    pub pending_title: String,
    pub category_keywords: HashMap<String, Vec<String>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GroupedChanges {
    pub features: Vec<ChangeEntry>,
    pub fixes: Vec<ChangeEntry>,
    pub known_issues: Vec<ChangeEntry>,
    pub upgrade_notices: Vec<ChangeEntry>,
    pub pending_review: Vec<ChangeEntry>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RenderedReleaseNote {
    pub product_line: String,
    pub product_name: String,
    pub feature_title: String,
    pub fix_title: String,
    pub known_issue_title: String,
    pub upgrade_notice_title: String,
    pub pending_title: String,
    pub template_file: Option<PathBuf>,
    pub version: String,
    pub generated_at: DateTime<Utc>,
    pub input_files: Vec<PathBuf>,
    pub grouped: GroupedChanges,
    pub validation: ValidationResult,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReleaseReport {
    pub product_line: String,
    pub product_name: String,
    pub feature_title: String,
    pub fix_title: String,
    pub known_issue_title: String,
    pub upgrade_notice_title: String,
    pub pending_title: String,
    pub template_file: Option<PathBuf>,
    pub version: String,
    pub generated_at: DateTime<Utc>,
    pub input_files: Vec<PathBuf>,
    pub groups: GroupedChanges,
    pub validation: ValidationResult,
    pub metadata: HashMap<String, String>,
}
