use super::PackageParser;
use crate::config::ScanOptions;
use crate::models::{Dependency, PackageManager, RiskLevel};
use anyhow::{Context, Result};
use regex::Regex;
use std::collections::HashSet;
use std::path::{Path, PathBuf};

pub struct GoParser;

#[derive(Debug, Clone)]
struct GoModule {
    name: String,
    version: String,
    indirect: bool,
}

impl PackageParser for GoParser {
    fn can_parse(&self, path: &Path) -> bool {
        path.file_name()
            .and_then(|n| n.to_str())
            .map(|n| n == "go.mod" || n == "go.sum")
            .unwrap_or(false)
    }

    fn parse(&self, path: &Path, options: &ScanOptions) -> Result<Vec<Dependency>> {
        let go_mod_path = if path.file_name().and_then(|n| n.to_str()) == Some("go.mod") {
            path.to_path_buf()
        } else {
            path.parent()
                .map(|p| p.join("go.mod"))
                .unwrap_or_else(|| PathBuf::from("go.mod"))
        };

        if !go_mod_path.exists() {
            return Ok(Vec::new());
        }

        let go_sum_path = go_mod_path
            .parent()
            .map(|p| p.join("go.sum"))
            .unwrap_or_else(|| PathBuf::from("go.sum"));

        let modules = parse_go_mod(&go_mod_path)?;

        let direct_names: HashSet<String> = modules
            .iter()
            .filter(|m| !m.indirect)
            .map(|m| m.name.clone())
            .collect();

        let all_modules = if go_sum_path.exists() && options.recursive {
            parse_go_sum(&go_sum_path)?
        } else {
            modules.clone()
        };

        let mut deps = Vec::new();
        for module in all_modules {
            let is_direct = direct_names.contains(&module.name);

            let source_url = format!("https://{}/", module.name);
            let pkg_url = format!("https://pkg.go.dev/{}", module.name);

            deps.push(Dependency {
                name: module.name.clone(),
                version: module.version.clone(),
                license: "UNKNOWN".to_string(),
                license_spdx: None,
                source: Some(source_url.clone()),
                source_url: Some(pkg_url),
                package_manager: PackageManager::Go,
                manifest_path: go_mod_path.clone(),
                risk_level: RiskLevel::Unknown,
                needs_review: true,
                review_reason: Some(
                    "Go module licenses require manual verification from source".to_string(),
                ),
                is_direct,
            });
        }

        Ok(deps)
    }

    fn name(&self) -> &'static str {
        "go"
    }
}

fn parse_go_mod(path: &Path) -> Result<Vec<GoModule>> {
    let content = std::fs::read_to_string(path)
        .with_context(|| format!("Failed to read {}", path.display()))?;

    let mut modules = Vec::new();
    let mut in_require_block = false;
    let require_re = Regex::new(r"^\s*([^\s]+)\s+([^\s]+)(.*)$").unwrap();

    for line in content.lines() {
        let trimmed = line.trim();

        if trimmed.is_empty() || trimmed.starts_with("//") {
            continue;
        }

        if trimmed.starts_with("require (") {
            in_require_block = true;
            continue;
        }

        if trimmed == ")" && in_require_block {
            in_require_block = false;
            continue;
        }

        if trimmed.starts_with("require ") && !in_require_block {
            let rest = trimmed.trim_start_matches("require ");
            if let Some(caps) = require_re.captures(rest) {
                let name = caps.get(1).unwrap().as_str().to_string();
                let version = caps.get(2).unwrap().as_str().to_string();
                let rest = caps.get(3).unwrap().as_str();
                let indirect = rest.contains("// indirect");

                modules.push(GoModule {
                    name,
                    version,
                    indirect,
                });
            }
            continue;
        }

        if in_require_block {
            if let Some(caps) = require_re.captures(trimmed) {
                let name = caps.get(1).unwrap().as_str().to_string();
                let version = caps.get(2).unwrap().as_str().to_string();
                let rest = caps.get(3).unwrap().as_str();
                let indirect = rest.contains("// indirect");

                modules.push(GoModule {
                    name,
                    version,
                    indirect,
                });
            }
        }
    }

    Ok(modules)
}

fn parse_go_sum(path: &Path) -> Result<Vec<GoModule>> {
    let content = std::fs::read_to_string(path)
        .with_context(|| format!("Failed to read {}", path.display()))?;

    let mut seen = HashSet::new();
    let mut modules = Vec::new();

    for line in content.lines() {
        let trimmed = line.trim();
        if trimmed.is_empty() {
            continue;
        }

        let parts: Vec<&str> = trimmed.split_whitespace().collect();
        if parts.len() < 2 {
            continue;
        }

        let name = parts[0].to_string();
        let version = parts[1]
            .trim_end_matches("/go.mod")
            .to_string();

        let key = format!("{}@{}", name, version);
        if seen.insert(key) {
            modules.push(GoModule {
                name,
                version,
                indirect: false,
            });
        }
    }

    Ok(modules)
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;

    #[test]
    fn test_can_parse_go_mod() {
        let parser = GoParser;
        assert!(parser.can_parse(Path::new("go.mod")));
        assert!(parser.can_parse(Path::new("go.sum")));
        assert!(!parser.can_parse(Path::new("package.json")));
    }

    #[test]
    fn test_parse_go_mod_simple() {
        let content = r#"module example.com/myapp

go 1.21

require (
    github.com/gin-gonic/gin v1.9.0
    github.com/go-sql-driver/mysql v1.7.0 // indirect
)

require golang.org/x/text v0.14.0 // indirect
"#;
        let dir = tempdir().unwrap();
        let go_mod_path = dir.path().join("go.mod");
        std::fs::write(&go_mod_path, content).unwrap();

        let modules = parse_go_mod(&go_mod_path).unwrap();
        assert_eq!(modules.len(), 3);
        assert_eq!(modules[0].name, "github.com/gin-gonic/gin");
        assert!(!modules[0].indirect);
        assert_eq!(modules[1].name, "github.com/go-sql-driver/mysql");
        assert!(modules[1].indirect);
        assert_eq!(modules[2].name, "golang.org/x/text");
        assert!(modules[2].indirect);
    }

    #[test]
    fn test_parse_go_sum() {
        let content = r#"github.com/gin-gonic/gin v1.9.0 h1:abc123
github.com/gin-gonic/gin v1.9.0/go.mod h1:def456
github.com/golang/protobuf v1.5.0 h1:ghi789
github.com/golang/protobuf v1.5.0/go.mod h1:jkl012
"#;
        let dir = tempdir().unwrap();
        let go_sum_path = dir.path().join("go.sum");
        std::fs::write(&go_sum_path, content).unwrap();

        let modules = parse_go_sum(&go_sum_path).unwrap();
        assert_eq!(modules.len(), 2);
        assert_eq!(modules[0].name, "github.com/gin-gonic/gin");
        assert_eq!(modules[0].version, "v1.9.0");
    }
}
