use crate::models::ProtectionRule;
use crate::models::RiskLevel;
use clap::ValueEnum;
use serde::{Deserialize, Serialize};
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CleanupConfig {
    pub repo_path: PathBuf,
    pub dry_run: bool,
    pub merged_only: bool,
    pub older_than_days: Option<i64>,
    pub exclude_patterns: Vec<String>,
    pub include_remote: bool,
    pub remote_name: String,
    pub default_branch: String,
    pub protection_rules: Vec<ProtectionRule>,
    pub min_risk_level: RiskLevel,
    pub interactive: bool,
    pub format: OutputFormat,
    pub output_file: Option<PathBuf>,
    pub log_dir: Option<PathBuf>,
    pub rollback_enabled: bool,
    pub pr_source: Option<PrSource>,
    pub pr_api_url: Option<String>,
    pub pr_token: Option<String>,
    pub max_concurrent: usize,
}

impl Default for CleanupConfig {
    fn default() -> Self {
        Self {
            repo_path: PathBuf::from("."),
            dry_run: true,
            merged_only: false,
            older_than_days: None,
            exclude_patterns: vec![],
            include_remote: false,
            remote_name: "origin".to_string(),
            default_branch: "main".to_string(),
            protection_rules: vec![
                ProtectionRule {
                    pattern: "main".to_string(),
                    reason: "默认主分支".to_string(),
                },
                ProtectionRule {
                    pattern: "master".to_string(),
                    reason: "默认主分支".to_string(),
                },
                ProtectionRule {
                    pattern: "develop".to_string(),
                    reason: "开发分支".to_string(),
                },
                ProtectionRule {
                    pattern: "release/*".to_string(),
                    reason: "发布分支".to_string(),
                },
                ProtectionRule {
                    pattern: "hotfix/*".to_string(),
                    reason: "热修复分支".to_string(),
                },
            ],
            min_risk_level: RiskLevel::Medium,
            interactive: true,
            format: OutputFormat::Human,
            output_file: None,
            log_dir: None,
            rollback_enabled: true,
            pr_source: None,
            pr_api_url: None,
            pr_token: None,
            max_concurrent: 4,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, ValueEnum)]
#[serde(rename_all = "lowercase")]
pub enum OutputFormat {
    Human,
    Json,
    JsonPretty,
    Csv,
    Markdown,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, ValueEnum)]
#[serde(rename_all = "lowercase")]
pub enum PrSource {
    GitHub,
    GitLab,
    Gitea,
    Bitbucket,
}

impl CleanupConfig {
    pub fn is_excluded(&self, branch_name: &str) -> bool {
        self.exclude_patterns.iter().any(|pattern| {
            let re_pattern = glob_to_regex(pattern);
            regex::Regex::new(&re_pattern)
                .map(|re| re.is_match(branch_name))
                .unwrap_or(false)
        })
    }

    pub fn is_protected(&self, branch_name: &str) -> (bool, Vec<String>) {
        let reasons: Vec<String> = self
            .protection_rules
            .iter()
            .filter(|rule| rule.matches(branch_name))
            .map(|rule| rule.reason.clone())
            .collect();
        (!reasons.is_empty(), reasons)
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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_exclude_patterns() {
        let config = CleanupConfig {
            exclude_patterns: vec!["feature/*".to_string(), "test-*".to_string()],
            ..Default::default()
        };
        assert!(config.is_excluded("feature/login"));
        assert!(config.is_excluded("test-123"));
        assert!(!config.is_excluded("bugfix/login"));
    }

    #[test]
    fn test_protection_rules() {
        let config = CleanupConfig::default();
        let (protected, reasons) = config.is_protected("main");
        assert!(protected);
        assert!(!reasons.is_empty());

        let (protected2, _) = config.is_protected("release/1.0");
        assert!(protected2);

        let (protected3, _) = config.is_protected("feature/new-ui");
        assert!(!protected3);
    }
}
