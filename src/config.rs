use crate::diff::{ChangeSeverity, ChangeType};
use serde::{Deserialize, Serialize};
use std::path::Path;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum ConfigError {
    #[error("Failed to read config file: {0}")]
    IoError(#[from] std::io::Error),
    #[error("Failed to parse config: {0}")]
    ParseError(#[from] serde_yaml::Error),
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct RulesConfig {
    #[serde(default)]
    pub ignore_rules: Vec<IgnoreRule>,
    #[serde(default)]
    pub severity_overrides: Vec<SeverityOverride>,
    #[serde(default)]
    pub deprecated_paths: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IgnoreRule {
    pub id: String,
    #[serde(default)]
    pub description: Option<String>,
    #[serde(default)]
    pub path_pattern: Option<String>,
    #[serde(default)]
    pub field_pattern: Option<String>,
    #[serde(default)]
    pub change_type: Option<ChangeType>,
    #[serde(default)]
    pub operation: Option<String>,
    #[serde(default)]
    pub expires_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SeverityOverride {
    pub change_type: ChangeType,
    pub severity: ChangeSeverity,
    #[serde(default)]
    pub path_pattern: Option<String>,
}

impl RulesConfig {
    pub fn from_file<P: AsRef<Path>>(path: P) -> Result<Self, ConfigError> {
        let content = std::fs::read_to_string(path)?;
        let config: RulesConfig = serde_yaml::from_str(&content)?;
        Ok(config)
    }

    pub fn from_str(content: &str) -> Result<Self, ConfigError> {
        let config: RulesConfig = serde_yaml::from_str(content)?;
        Ok(config)
    }

    pub fn is_ignored(
        &self,
        path: &str,
        field: Option<&str>,
        change_type: ChangeType,
        operation: Option<&str>,
    ) -> bool {
        self.ignore_rules.iter().any(|rule| {
            let path_match = match &rule.path_pattern {
                Some(pat) => regex_match(pat, path),
                None => true,
            };
            let field_match = match (&rule.field_pattern, field) {
                (Some(pat), Some(f)) => regex_match(pat, f),
                (Some(_), None) => false,
                (None, _) => true,
            };
            let change_match = match &rule.change_type {
                Some(ct) => *ct == change_type,
                None => true,
            };
            let op_match = match (&rule.operation, operation) {
                (Some(r_op), Some(op)) => r_op.eq_ignore_ascii_case(op),
                (Some(_), None) => false,
                (None, _) => true,
            };
            path_match && field_match && change_match && op_match
        })
    }

    pub fn override_severity(
        &self,
        change_type: ChangeType,
        path: &str,
        default: ChangeSeverity,
    ) -> ChangeSeverity {
        for override_rule in &self.severity_overrides {
            if override_rule.change_type == change_type {
                if let Some(pat) = &override_rule.path_pattern {
                    if regex_match(pat, path) {
                        return override_rule.severity;
                    }
                } else {
                    return override_rule.severity;
                }
            }
        }
        default
    }
}

fn regex_match(pattern: &str, target: &str) -> bool {
    use regex::Regex;
    if let Ok(re) = Regex::new(pattern) {
        re.is_match(target)
    } else {
        pattern == target || glob_match(pattern, target)
    }
}

fn glob_match(pattern: &str, target: &str) -> bool {
    use regex::Regex;
    let mut regex_pattern = String::with_capacity(pattern.len() * 2);
    regex_pattern.push('^');
    let chars: Vec<char> = pattern.chars().collect();
    let mut i = 0;
    while i < chars.len() {
        match chars[i] {
            '*' => {
                if i + 1 < chars.len() && chars[i + 1] == '*' {
                    regex_pattern.push_str(".*");
                    i += 2;
                    if i < chars.len() && chars[i] == '/' {
                        i += 1;
                    }
                } else {
                    regex_pattern.push_str("[^/]*");
                    i += 1;
                }
            }
            '?' => {
                regex_pattern.push_str("[^/]");
                i += 1;
            }
            '.' | '+' | '(' | ')' | '|' | '{' | '}' | '[' | ']' | '^' | '$' | '\\' => {
                regex_pattern.push('\\');
                regex_pattern.push(chars[i]);
                i += 1;
            }
            c => {
                regex_pattern.push(c);
                i += 1;
            }
        }
    }
    regex_pattern.push('$');
    Regex::new(&regex_pattern)
        .map(|re| re.is_match(target))
        .unwrap_or(false)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_ignore_rule_path_match() {
        let config = RulesConfig::from_str(
            r#"
ignore_rules:
  - id: "ignore-users-delete"
    path_pattern: "/api/v1/users.*"
    change_type: "PathRemoved"
"#,
        )
        .unwrap();

        assert!(config.is_ignored(
            "/api/v1/users/123",
            None,
            ChangeType::PathRemoved,
            None
        ));
        assert!(!config.is_ignored(
            "/api/v1/orders",
            None,
            ChangeType::PathRemoved,
            None
        ));
    }

    #[test]
    fn test_severity_override() {
        let config = RulesConfig::from_str(
            r#"
severity_overrides:
  - change_type: "ResponseCodeRemoved"
    severity: "Warning"
    path_pattern: "/internal/.*"
"#,
        )
        .unwrap();

        assert_eq!(
            config.override_severity(
                ChangeType::ResponseCodeRemoved,
                "/internal/health",
                ChangeSeverity::Breaking
            ),
            ChangeSeverity::Warning
        );
        assert_eq!(
            config.override_severity(
                ChangeType::ResponseCodeRemoved,
                "/api/users",
                ChangeSeverity::Breaking
            ),
            ChangeSeverity::Breaking
        );
    }

    #[test]
    fn test_glob_match() {
        assert!(glob_match("/api/*", "/api/users"));
        assert!(!glob_match("/api/*", "/api/users/123"));
        assert!(glob_match("/api/**", "/api/users/123"));
        assert!(glob_match("/api/v?/users", "/api/v1/users"));
    }
}
