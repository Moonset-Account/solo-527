use crate::models::RiskLevel;
use serde::{Deserialize, Serialize};
use std::collections::HashSet;
use std::path::Path;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuditConfig {
    #[serde(default)]
    pub allow_list: HashSet<String>,
    #[serde(default)]
    pub deny_list: HashSet<String>,
    #[serde(default = "default_trusted_sources")]
    pub trusted_sources: Vec<String>,
    #[serde(default)]
    pub workspace: bool,
    #[serde(default = "default_risk_override")]
    pub risk_overrides: std::collections::HashMap<String, RiskLevel>,
    #[serde(default)]
    pub fail_on_high: bool,
    #[serde(default)]
    pub fail_on_critical: bool,
    #[serde(default)]
    pub fail_on_unknown: bool,
}

fn default_trusted_sources() -> Vec<String> {
    vec![
        "https://registry.npmjs.org/".to_string(),
        "https://proxy.golang.org/".to_string(),
        "https://crates.io/".to_string(),
    ]
}

fn default_risk_override() -> std::collections::HashMap<String, RiskLevel> {
    std::collections::HashMap::new()
}

impl Default for AuditConfig {
    fn default() -> Self {
        AuditConfig {
            allow_list: HashSet::new(),
            deny_list: HashSet::new(),
            trusted_sources: default_trusted_sources(),
            workspace: false,
            risk_overrides: std::collections::HashMap::new(),
            fail_on_high: false,
            fail_on_critical: true,
            fail_on_unknown: false,
        }
    }
}

impl AuditConfig {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn with_allow_list(mut self, licenses: Vec<String>) -> Self {
        self.allow_list = licenses.into_iter().collect();
        self
    }

    pub fn with_deny_list(mut self, licenses: Vec<String>) -> Self {
        self.deny_list = licenses.into_iter().collect();
        self
    }

    pub fn with_workspace(mut self, workspace: bool) -> Self {
        self.workspace = workspace;
        self
    }

    pub fn add_allow(&mut self, license: &str) {
        self.allow_list.insert(license.to_string());
    }

    pub fn add_deny(&mut self, license: &str) {
        self.deny_list.insert(license.to_string());
    }

    pub fn is_allowed(&self, license: &str) -> bool {
        self.allow_list.contains(license)
            || self.allow_list.contains(&license.to_lowercase())
            || self
                .allow_list
                .iter()
                .any(|l| l.eq_ignore_ascii_case(license))
    }

    pub fn is_denied(&self, license: &str) -> bool {
        self.deny_list.contains(license)
            || self.deny_list.contains(&license.to_lowercase())
            || self
                .deny_list
                .iter()
                .any(|l| l.eq_ignore_ascii_case(license))
    }

    pub fn is_trusted_source(&self, source_url: &str) -> bool {
        self.trusted_sources
            .iter()
            .any(|trusted| source_url.starts_with(trusted))
    }

    pub fn load_from_file(path: &Path) -> anyhow::Result<Self> {
        if !path.exists() {
            return Ok(Self::default());
        }
        let content = std::fs::read_to_string(path)?;
        let config: AuditConfig = if path.extension().map(|e| e == "toml").unwrap_or(false) {
            toml::from_str(&content)?
        } else {
            serde_json::from_str(&content)?
        };
        Ok(config)
    }
}

#[derive(Debug, Clone)]
pub struct ScanOptions {
    pub paths: Vec<std::path::PathBuf>,
    pub workspace: bool,
    pub output_format: OutputFormat,
    pub output_path: Option<std::path::PathBuf>,
    pub config_path: Option<std::path::PathBuf>,
    pub allow_licenses: Vec<String>,
    pub deny_licenses: Vec<String>,
    pub include_dev: bool,
    pub recursive: bool,
}

impl Default for ScanOptions {
    fn default() -> Self {
        ScanOptions {
            paths: vec![std::path::PathBuf::from(".")],
            workspace: false,
            output_format: OutputFormat::Table,
            output_path: None,
            config_path: None,
            allow_licenses: Vec::new(),
            deny_licenses: Vec::new(),
            include_dev: false,
            recursive: true,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum OutputFormat {
    Json,
    Html,
    Table,
}

impl OutputFormat {
    pub fn from_str(s: &str) -> Option<Self> {
        match s.to_lowercase().as_str() {
            "json" => Some(OutputFormat::Json),
            "html" => Some(OutputFormat::Html),
            "table" | "text" => Some(OutputFormat::Table),
            _ => None,
        }
    }
}
