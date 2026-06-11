use crate::models::ProtectionRule;
use crate::models::RiskLevel;
use anyhow::{Context, Result};
use clap::ValueEnum;
use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};

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
    pub fn from_file(path: &Path) -> Result<Self> {
        let content = std::fs::read_to_string(path)
            .with_context(|| format!("读取配置文件失败: {}", path.display()))?;

        let config: CleanupConfig = serde_json::from_str(&content)
            .with_context(|| format!("解析配置文件失败: {}", path.display()))?;

        Ok(config)
    }

    pub fn from_file_or_default(path: Option<&Path>) -> Result<Self> {
        if let Some(p) = path {
            if p.exists() {
                return Self::from_file(p);
            }
        }
        Ok(Self::default())
    }

    pub fn merge_cli_overrides(&mut self, overrides: CliOverrides) {
        if overrides.repo_path.is_some() {
            self.repo_path = overrides.repo_path.unwrap();
        }
        if overrides.dry_run.is_some() {
            self.dry_run = overrides.dry_run.unwrap();
        }
        if overrides.merged_only.is_some() {
            self.merged_only = overrides.merged_only.unwrap();
        }
        if overrides.older_than_days.is_some() {
            self.older_than_days = overrides.older_than_days;
        }
        if !overrides.exclude_patterns.is_empty() {
            self.exclude_patterns.extend(overrides.exclude_patterns);
        }
        if overrides.include_remote.is_some() {
            self.include_remote = overrides.include_remote.unwrap();
        }
        if overrides.remote_name.is_some() {
            self.remote_name = overrides.remote_name.unwrap();
        }
        if overrides.default_branch.is_some() {
            self.default_branch = overrides.default_branch.unwrap();
        }
        if overrides.min_risk_level.is_some() {
            self.min_risk_level = overrides.min_risk_level.unwrap();
        }
        if !overrides.protect_patterns.is_empty() {
            for pattern in overrides.protect_patterns {
                self.protection_rules.push(ProtectionRule {
                    pattern,
                    reason: "命令行指定".to_string(),
                });
            }
        }
        if overrides.interactive.is_some() {
            self.interactive = overrides.interactive.unwrap();
        }
        if overrides.format.is_some() {
            self.format = overrides.format.unwrap();
        }
        if overrides.output_file.is_some() {
            self.output_file = overrides.output_file;
        }
        if overrides.rollback_enabled.is_some() {
            self.rollback_enabled = overrides.rollback_enabled.unwrap();
        }
        if overrides.pr_source.is_some() {
            self.pr_source = overrides.pr_source;
        }
        if overrides.pr_api_url.is_some() {
            self.pr_api_url = overrides.pr_api_url;
        }
        if overrides.pr_token.is_some() {
            self.pr_token = overrides.pr_token;
        }
    }

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

#[derive(Debug, Default, Clone)]
pub struct CliOverrides {
    pub repo_path: Option<PathBuf>,
    pub dry_run: Option<bool>,
    pub merged_only: Option<bool>,
    pub older_than_days: Option<i64>,
    pub exclude_patterns: Vec<String>,
    pub include_remote: Option<bool>,
    pub remote_name: Option<String>,
    pub default_branch: Option<String>,
    pub min_risk_level: Option<RiskLevel>,
    pub protect_patterns: Vec<String>,
    pub interactive: Option<bool>,
    pub format: Option<OutputFormat>,
    pub output_file: Option<PathBuf>,
    pub rollback_enabled: Option<bool>,
    pub pr_source: Option<PrSource>,
    pub pr_api_url: Option<String>,
    pub pr_token: Option<String>,
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
