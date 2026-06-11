use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;

#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum RiskLevel {
    Safe,
    Low,
    Medium,
    High,
    Critical,
}

impl RiskLevel {
    pub fn label(&self) -> &'static str {
        match self {
            RiskLevel::Safe => "安全",
            RiskLevel::Low => "低风险",
            RiskLevel::Medium => "中风险",
            RiskLevel::High => "高风险",
            RiskLevel::Critical => "危险",
        }
    }

    pub fn color(&self) -> &'static str {
        match self {
            RiskLevel::Safe => "green",
            RiskLevel::Low => "cyan",
            RiskLevel::Medium => "yellow",
            RiskLevel::High => "red",
            RiskLevel::Critical => "bright red",
        }
    }
}

impl std::fmt::Display for RiskLevel {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.label())
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum PrStatus {
    Open,
    Merged,
    Closed,
    Draft,
    Unknown,
    NotApplicable,
}

impl PrStatus {
    pub fn label(&self) -> &'static str {
        match self {
            PrStatus::Open => "打开",
            PrStatus::Merged => "已合并",
            PrStatus::Closed => "已关闭",
            PrStatus::Draft => "草稿",
            PrStatus::Unknown => "未知",
            PrStatus::NotApplicable => "无",
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct BranchInfo {
    pub name: String,
    pub is_local: bool,
    pub is_remote: bool,
    pub remote_name: Option<String>,
    pub last_commit_sha: String,
    pub last_commit_message: String,
    pub last_commit_date: DateTime<Utc>,
    pub last_commit_author: String,
    pub is_merged: bool,
    pub merged_into: Option<String>,
    pub ahead_of_default: u32,
    pub behind_default: u32,
    pub pr_status: PrStatus,
    pub pr_number: Option<u64>,
    pub pr_title: Option<String>,
    pub is_protected: bool,
    pub protection_reasons: Vec<String>,
    pub risk_level: RiskLevel,
    pub risk_reasons: Vec<String>,
    pub size_bytes: Option<u64>,
}

impl BranchInfo {
    pub fn display_name(&self) -> String {
        if self.is_remote && !self.is_local {
            format!(
                "{}/{}",
                self.remote_name.as_deref().unwrap_or("origin"),
                self.name
            )
        } else {
            self.name.clone()
        }
    }

    pub fn age_days(&self) -> i64 {
        let now = Utc::now();
        (now - self.last_commit_date).num_days()
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum CleanupAction {
    Delete,
    Keep,
    Skip,
    Error,
}

impl CleanupAction {
    pub fn label(&self) -> &'static str {
        match self {
            CleanupAction::Delete => "删除",
            CleanupAction::Keep => "保留",
            CleanupAction::Skip => "跳过",
            CleanupAction::Error => "错误",
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CleanupItem {
    pub branch: BranchInfo,
    pub action: CleanupAction,
    pub success: bool,
    pub error_message: Option<String>,
    pub rollback_info: Option<RollbackInfo>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RollbackInfo {
    pub branch_name: String,
    pub commit_sha: String,
    pub reflog_entry: Option<String>,
    pub timestamp: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CleanupSummary {
    pub total_scanned: usize,
    pub safe_to_delete: usize,
    pub actually_deleted: usize,
    pub skipped: usize,
    pub errors: usize,
    pub protected: usize,
    pub total_freed_bytes: Option<u64>,
    pub start_time: DateTime<Utc>,
    pub end_time: DateTime<Utc>,
    pub dry_run: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CleanupReport {
    pub summary: CleanupSummary,
    pub items: Vec<CleanupItem>,
    pub errors: Vec<CleanupError>,
    pub config_snapshot: serde_json::Value,
    pub repository_path: PathBuf,
    pub version: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CleanupError {
    pub branch_name: String,
    pub error_type: String,
    pub message: String,
    pub details: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProtectionRule {
    pub pattern: String,
    pub reason: String,
}

impl ProtectionRule {
    pub fn matches(&self, branch_name: &str) -> bool {
        if self.pattern.starts_with('^') || self.pattern.contains('*') {
            let regex_pattern = glob_to_regex(&self.pattern);
            regex::Regex::new(&regex_pattern)
                .map(|re| re.is_match(branch_name))
                .unwrap_or(false)
        } else {
            self.pattern == branch_name
        }
    }
}

fn glob_to_regex(pattern: &str) -> String {
    let mut regex = String::from("^");
    for c in pattern.chars() {
        match c {
            '*' => regex.push_str(".*"),
            '?' => regex.push('.'),
            '.' => regex.push_str("\\."),
            '+' => regex.push_str("\\+"),
            '(' => regex.push_str("\\("),
            ')' => regex.push_str("\\)"),
            '|' => regex.push_str("\\|"),
            '^' => regex.push_str("\\^"),
            '$' => regex.push_str("\\$"),
            '\\' => regex.push_str("\\\\"),
            c => regex.push(c),
        }
    }
    regex.push('$');
    regex
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PrInfo {
    pub number: u64,
    pub title: String,
    pub status: PrStatus,
    pub branch: String,
    pub author: String,
    pub url: Option<String>,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_risk_level_ordering() {
        assert!(RiskLevel::Safe < RiskLevel::Low);
        assert!(RiskLevel::Low < RiskLevel::Medium);
        assert!(RiskLevel::Medium < RiskLevel::High);
        assert!(RiskLevel::High < RiskLevel::Critical);
    }

    #[test]
    fn test_protection_rule_exact_match() {
        let rule = ProtectionRule {
            pattern: "main".to_string(),
            reason: "默认分支".to_string(),
        };
        assert!(rule.matches("main"));
        assert!(!rule.matches("main-dev"));
    }

    #[test]
    fn test_protection_rule_glob_match() {
        let rule = ProtectionRule {
            pattern: "release/*".to_string(),
            reason: "发布分支".to_string(),
        };
        assert!(rule.matches("release/1.0"));
        assert!(rule.matches("release/v2.0"));
        assert!(!rule.matches("feature/release"));
    }

    #[test]
    fn test_branch_age_days() {
        let branch = BranchInfo {
            name: "test".to_string(),
            is_local: true,
            is_remote: false,
            remote_name: None,
            last_commit_sha: "abc123".to_string(),
            last_commit_message: "test".to_string(),
            last_commit_date: Utc::now() - chrono::Duration::days(5),
            last_commit_author: "test".to_string(),
            is_merged: false,
            merged_into: None,
            ahead_of_default: 0,
            behind_default: 0,
            pr_status: PrStatus::Unknown,
            pr_number: None,
            pr_title: None,
            is_protected: false,
            protection_reasons: vec![],
            risk_level: RiskLevel::Low,
            risk_reasons: vec![],
            size_bytes: None,
        };
        assert!(branch.age_days() >= 4);
        assert!(branch.age_days() <= 6);
    }
}
