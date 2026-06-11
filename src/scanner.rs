use crate::config::{AuditConfig, ScanOptions};
use crate::license::LicenseEvaluator;
use crate::models::{Dependency, PackageManager, RiskLevel, ReviewItem, ScanResult};
use crate::parsers::get_all_parsers;
use anyhow::Result;
use rayon::prelude::*;
use std::collections::HashSet;
use std::path::{Path, PathBuf};
use walkdir::WalkDir;

pub struct Scanner {
    config: AuditConfig,
    options: ScanOptions,
}

impl Scanner {
    pub fn new(options: ScanOptions) -> Self {
        let mut config = if let Some(config_path) = &options.config_path {
            AuditConfig::load_from_file(config_path).unwrap_or_default()
        } else {
            AuditConfig::default()
        };

        for lic in &options.allow_licenses {
            config.add_allow(lic);
        }
        for lic in &options.deny_licenses {
            config.add_deny(lic);
        }

        config.workspace = options.workspace;

        Scanner { config, options }
    }

    pub fn with_config(mut self, config: AuditConfig) -> Self {
        self.config = config;
        self
    }

    pub fn scan(&self) -> Result<ScanResult> {
        let manifest_paths = self.find_manifests()?;

        let all_deps: Vec<Dependency> = manifest_paths
            .par_iter()
            .map(|path| self.scan_single(path))
            .collect::<Result<Vec<Vec<Dependency>>>>()?
            .into_iter()
            .flatten()
            .collect();

        self.build_result(all_deps, manifest_paths)
    }

    fn find_manifests(&self) -> Result<Vec<PathBuf>> {
        let mut manifests = HashSet::new();
        let parsers = get_all_parsers();

        for path in &self.options.paths {
            let path = if path.is_relative() {
                std::env::current_dir()?.join(path)
            } else {
                path.clone()
            };

            if path.is_file() {
                if parsers.iter().any(|p| p.can_parse(&path)) {
                    manifests.insert(path);
                }
            } else if path.is_dir() {
                let walker = if self.options.recursive {
                    WalkDir::new(&path)
                } else {
                    WalkDir::new(&path).max_depth(1)
                };

                for entry in walker.into_iter().filter_map(|e| e.ok()) {
                    if entry.file_type().is_file() {
                        let file_path = entry.path().to_path_buf();
                        if parsers.iter().any(|p| p.can_parse(&file_path)) {
                            let manifest_dir = file_path.parent().unwrap_or(&path);
                            let is_lockfile = file_path
                                .file_name()
                                .and_then(|n| n.to_str())
                                .map(|n| {
                                    n == "package-lock.json"
                                        || n == "Cargo.lock"
                                        || n == "go.sum"
                                })
                                .unwrap_or(false);

                            let key = if is_lockfile {
                                manifest_dir.to_path_buf()
                            } else {
                                file_path.clone()
                            };

                            manifests.insert(key);
                        }
                    }
                }
            }
        }

        let mut result: Vec<PathBuf> = manifests.into_iter().collect();
        result.sort();
        Ok(result)
    }

    fn scan_single(&self, path: &Path) -> Result<Vec<Dependency>> {
        let parsers = get_all_parsers();
        let mut all_deps = Vec::new();

        for parser in parsers {
            let manifest_file = if path.is_dir() {
                let candidates = ["package.json", "go.mod", "Cargo.toml"];
                candidates
                    .iter()
                    .map(|c| path.join(c))
                    .find(|p| p.exists())
            } else {
                Some(path.to_path_buf())
            };

            if let Some(manifest) = manifest_file {
                if parser.can_parse(&manifest) {
                    let deps = parser.parse(&manifest, &self.options)?;
                    all_deps.extend(deps);
                    break;
                }
            }
        }

        Ok(all_deps)
    }

    fn build_result(
        &self,
        deps: Vec<Dependency>,
        scanned_paths: Vec<PathBuf>,
    ) -> Result<ScanResult> {
        let evaluator = LicenseEvaluator::new(self.config.clone());

        let mut deps = deps;

        let all_reviews: Vec<ReviewItem> = evaluator.evaluate_all(&mut deps);

        let needs_review_count = all_reviews.len();

        let unique_deps = LicenseEvaluator::deduplicate_by_highest_risk(&deps);

        let total_count = deps.len();
        let unique_count = unique_deps.len();
        let high_risk_count = unique_deps
            .iter()
            .filter(|d| d.risk_level == RiskLevel::High)
            .count();
        let critical_risk_count = unique_deps
            .iter()
            .filter(|d| d.risk_level == RiskLevel::Critical)
            .count();
        let unknown_license_count = unique_deps
            .iter()
            .filter(|d| d.risk_level == RiskLevel::Unknown)
            .count();

        let mut package_managers = HashSet::new();
        for dep in &unique_deps {
            package_managers.insert(dep.package_manager);
        }
        let mut package_managers: Vec<PackageManager> = package_managers.into_iter().collect();
        package_managers.sort_by(|a, b| a.to_string().cmp(&b.to_string()));

        let mut sorted_deps = unique_deps;
        sorted_deps.sort_by(|a, b| {
            b.risk_level
                .cmp(&a.risk_level)
                .then_with(|| a.package_manager.cmp(&b.package_manager))
                .then_with(|| a.name.cmp(&b.name))
        });

        Ok(ScanResult {
            dependencies: sorted_deps,
            total_count,
            unique_count,
            high_risk_count,
            critical_risk_count,
            unknown_license_count,
            needs_review_count,
            review_queue: all_reviews,
            scanned_paths,
            package_managers,
        })
    }

    pub fn config(&self) -> &AuditConfig {
        &self.config
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;

    #[test]
    fn test_scanner_scans_npm_project() {
        let dir = tempdir().unwrap();
        let package_json = r#"{
            "name": "test-project",
            "version": "1.0.0",
            "dependencies": {
                "lodash": "^4.17.0"
            }
        }"#;
        std::fs::write(dir.path().join("package.json"), package_json).unwrap();

        let options = ScanOptions {
            paths: vec![dir.path().to_path_buf()],
            ..Default::default()
        };

        let scanner = Scanner::new(options);
        let result = scanner.scan().unwrap();

        assert!(!result.dependencies.is_empty());
        assert!(result.package_managers.contains(&PackageManager::Npm));
    }

    #[test]
    fn test_scanner_multiple_paths() {
        let dir1 = tempdir().unwrap();
        let dir2 = tempdir().unwrap();

        std::fs::write(
            dir1.path().join("package.json"),
            r#"{
                "name": "proj1",
                "dependencies": { "lodash": "^4.17.0" }
            }"#,
        )
        .unwrap();

        std::fs::write(
            dir2.path().join("Cargo.toml"),
            r#"
[package]
name = "proj2"
version = "0.1.0"

[dependencies]
serde = "1.0"
"#,
        )
        .unwrap();

        let options = ScanOptions {
            paths: vec![dir1.path().to_path_buf(), dir2.path().to_path_buf()],
            ..Default::default()
        };

        let scanner = Scanner::new(options);
        let result = scanner.scan().unwrap();

        assert!(result.package_managers.contains(&PackageManager::Npm));
        assert!(result.package_managers.contains(&PackageManager::Cargo));
    }
}
