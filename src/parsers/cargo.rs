use super::PackageParser;
use crate::config::ScanOptions;
use crate::models::{Dependency, PackageManager, RiskLevel};
use anyhow::{Context, Result};
use serde::Deserialize;
use std::collections::{HashMap, HashSet};
use std::path::{Path, PathBuf};

pub struct CargoParser;

#[derive(Debug, Deserialize)]
struct CargoToml {
    package: Option<CargoPackage>,
    workspace: Option<CargoWorkspace>,
    dependencies: Option<HashMap<String, CargoDep>>,
    #[serde(rename = "dev-dependencies")]
    dev_dependencies: Option<HashMap<String, CargoDep>>,
    #[serde(rename = "build-dependencies")]
    build_dependencies: Option<HashMap<String, CargoDep>>,
}

#[derive(Debug, Deserialize)]
struct CargoPackage {
    name: Option<String>,
    version: Option<String>,
    license: Option<String>,
    #[serde(rename = "license-file")]
    license_file: Option<String>,
    repository: Option<String>,
    homepage: Option<String>,
    documentation: Option<String>,
}

#[derive(Debug, Deserialize)]
struct CargoWorkspace {
    members: Option<Vec<String>>,
}

#[derive(Debug, Deserialize)]
#[serde(untagged)]
enum CargoDep {
    Simple(String),
    Detailed(CargoDepDetailed),
}

#[derive(Debug, Deserialize)]
struct CargoDepDetailed {
    version: Option<String>,
    path: Option<String>,
    git: Option<String>,
    #[serde(default)]
    optional: bool,
}

#[derive(Debug, Deserialize)]
struct CargoLock {
    version: Option<i32>,
    package: Option<Vec<LockPackage>>,
}

#[derive(Debug, Deserialize)]
struct LockPackage {
    name: String,
    version: String,
    source: Option<String>,
    checksum: Option<String>,
    dependencies: Option<Vec<String>>,
}

impl PackageParser for CargoParser {
    fn can_parse(&self, path: &Path) -> bool {
        path.file_name()
            .and_then(|n| n.to_str())
            .map(|n| n == "Cargo.toml" || n == "Cargo.lock")
            .unwrap_or(false)
    }

    fn parse(&self, path: &Path, options: &ScanOptions) -> Result<Vec<Dependency>> {
        let cargo_toml_path =
            if path.file_name().and_then(|n| n.to_str()) == Some("Cargo.toml") {
                path.to_path_buf()
            } else {
                path.parent()
                    .map(|p| p.join("Cargo.toml"))
                    .unwrap_or_else(|| PathBuf::from("Cargo.toml"))
            };

        if !cargo_toml_path.exists() {
            return Ok(Vec::new());
        }

        let content = std::fs::read_to_string(&cargo_toml_path)
            .with_context(|| format!("Failed to read {}", cargo_toml_path.display()))?;
        let cargo_toml: CargoToml = toml::from_str(&content)
            .with_context(|| format!("Failed to parse {}", cargo_toml_path.display()))?;

        if options.workspace && cargo_toml.workspace.is_some() {
            return self.parse_workspace(&cargo_toml, &cargo_toml_path, options);
        }

        let cargo_lock_path = cargo_toml_path
            .parent()
            .map(|p| p.join("Cargo.lock"))
            .unwrap_or_else(|| PathBuf::from("Cargo.lock"));

        if cargo_lock_path.exists() {
            self.parse_from_lock(&cargo_lock_path, &cargo_toml, &cargo_toml_path, options)
        } else {
            self.parse_from_manifest(&cargo_toml, &cargo_toml_path, options)
        }
    }

    fn name(&self) -> &'static str {
        "cargo"
    }
}

impl CargoParser {
    fn parse_from_lock(
        &self,
        lock_path: &Path,
        cargo_toml: &CargoToml,
        manifest_path: &Path,
        options: &ScanOptions,
    ) -> Result<Vec<Dependency>> {
        let content = std::fs::read_to_string(lock_path)
            .with_context(|| format!("Failed to read {}", lock_path.display()))?;
        let lock: CargoLock = toml::from_str(&content)
            .with_context(|| format!("Failed to parse {}", lock_path.display()))?;

        let direct_deps = self.collect_direct_deps(cargo_toml, options);
        let package_name = cargo_toml
            .package
            .as_ref()
            .and_then(|p| p.name.clone())
            .unwrap_or_default();

        let root_deps = self.get_root_dependencies(&lock, &package_name);

        let mut deps = Vec::new();

        if let Some(packages) = lock.package {
            let direct_set: HashSet<String> = direct_deps.keys().cloned().collect();
            let root_dep_set: HashSet<String> = root_deps.into_iter().collect();

            for pkg in packages {
                if pkg.name == package_name {
                    continue;
                }

                let is_direct = direct_set.contains(&pkg.name) || root_dep_set.contains(&pkg.name);

                if !is_direct && !options.recursive {
                    continue;
                }

                let source_url = pkg
                    .source
                    .as_ref()
                    .map(|s| source_to_url(s))
                    .unwrap_or_else(|| {
                        format!("https://crates.io/crates/{}", pkg.name)
                    });

                let (license, needs_review, reason) =
                    if let Some(license) = get_license_from_crates_io_cache(&pkg.name) {
                        (license, false, None)
                    } else {
                        (
                            "UNKNOWN".to_string(),
                            true,
                            Some(
                                "Cargo.lock does not include license info; requires verification"
                                    .to_string(),
                            ),
                        )
                    };

                deps.push(Dependency {
                    name: pkg.name.clone(),
                    version: pkg.version.clone(),
                    license,
                    license_spdx: None,
                    source: pkg.source.clone(),
                    source_url: Some(source_url),
                    package_manager: PackageManager::Cargo,
                    manifest_path: manifest_path.to_path_buf(),
                    risk_level: RiskLevel::Unknown,
                    needs_review,
                    review_reason: reason,
                    is_direct,
                });
            }
        }

        Ok(deps)
    }

    fn get_root_dependencies(&self, lock: &CargoLock, root_name: &str) -> Vec<String> {
        if root_name.is_empty() {
            if let Some(packages) = &lock.package {
                if let Some(first) = packages.first() {
                    return first
                        .dependencies
                        .as_ref()
                        .map(|deps| deps.iter().map(|d| extract_dep_name(d)).collect())
                        .unwrap_or_default();
                }
            }
            return Vec::new();
        }

        if let Some(packages) = &lock.package {
            for pkg in packages {
                if pkg.name == root_name {
                    return pkg
                        .dependencies
                        .as_ref()
                        .map(|deps| deps.iter().map(|d| extract_dep_name(d)).collect())
                        .unwrap_or_default();
                }
            }
        }

        Vec::new()
    }

    fn parse_from_manifest(
        &self,
        cargo_toml: &CargoToml,
        manifest_path: &Path,
        options: &ScanOptions,
    ) -> Result<Vec<Dependency>> {
        let mut deps = Vec::new();

        if let Some(dependencies) = &cargo_toml.dependencies {
            for (name, dep) in dependencies {
                let version = match dep {
                    CargoDep::Simple(v) => v.clone(),
                    CargoDep::Detailed(d) => d.version.clone().unwrap_or_else(|| "*".to_string()),
                };

                let source_url = match dep {
                    CargoDep::Simple(_) => None,
                    CargoDep::Detailed(d) => d.git.clone(),
                };

                deps.push(Dependency {
                    name: name.clone(),
                    version,
                    license: "UNKNOWN".to_string(),
                    license_spdx: None,
                    source: source_url.clone(),
                    source_url,
                    package_manager: PackageManager::Cargo,
                    manifest_path: manifest_path.to_path_buf(),
                    risk_level: RiskLevel::Unknown,
                    needs_review: true,
                    review_reason: Some(
                        "License info not available from manifest; requires Cargo.lock or verification"
                            .to_string(),
                    ),
                    is_direct: true,
                });
            }
        }

        if options.include_dev {
            if let Some(dev_deps) = &cargo_toml.dev_dependencies {
                for (name, dep) in dev_deps {
                    let version = match dep {
                        CargoDep::Simple(v) => v.clone(),
                        CargoDep::Detailed(d) => {
                            d.version.clone().unwrap_or_else(|| "*".to_string())
                        }
                    };

                    deps.push(Dependency {
                        name: name.clone(),
                        version,
                        license: "UNKNOWN".to_string(),
                        license_spdx: None,
                        source: None,
                        source_url: None,
                        package_manager: PackageManager::Cargo,
                        manifest_path: manifest_path.to_path_buf(),
                        risk_level: RiskLevel::Unknown,
                        needs_review: true,
                        review_reason: Some(
                            "License info not available from manifest; requires verification"
                                .to_string(),
                        ),
                        is_direct: true,
                    });
                }
            }
        }

        Ok(deps)
    }

    fn parse_workspace(
        &self,
        cargo_toml: &CargoToml,
        manifest_path: &Path,
        options: &ScanOptions,
    ) -> Result<Vec<Dependency>> {
        let mut all_deps = Vec::new();

        let mut root_options = options.clone();
        root_options.workspace = false;
        let root_deps = self.parse(manifest_path, &root_options)?;
        all_deps.extend(root_deps);

        if let Some(workspace) = &cargo_toml.workspace {
            if let Some(members) = &workspace.members {
                let base_dir = manifest_path.parent().unwrap_or_else(|| Path::new("."));
                for member in members {
                    let member_paths = glob_workspace_members(base_dir, member)?;
                    for member_path in member_paths {
                        let cargo_path = member_path.join("Cargo.toml");
                        if cargo_path.exists() {
                            let mut member_options = options.clone();
                            member_options.workspace = false;
                            let member_deps = self.parse(&cargo_path, &member_options)?;
                            all_deps.extend(member_deps);
                        }
                    }
                }
            }
        }

        Ok(all_deps)
    }

    fn collect_direct_deps(
        &self,
        cargo_toml: &CargoToml,
        options: &ScanOptions,
    ) -> HashMap<String, String> {
        let mut direct = HashMap::new();

        if let Some(deps) = &cargo_toml.dependencies {
            for (name, dep) in deps {
                let version = match dep {
                    CargoDep::Simple(v) => v.clone(),
                    CargoDep::Detailed(d) => d.version.clone().unwrap_or_default(),
                };
                direct.insert(name.clone(), version);
            }
        }

        if options.include_dev {
            if let Some(dev_deps) = &cargo_toml.dev_dependencies {
                for (name, dep) in dev_deps {
                    let version = match dep {
                        CargoDep::Simple(v) => v.clone(),
                        CargoDep::Detailed(d) => d.version.clone().unwrap_or_default(),
                    };
                    direct.insert(name.clone(), version);
                }
            }
        }

        direct
    }
}

fn extract_dep_name(dep_str: &str) -> String {
    dep_str
        .split_whitespace()
        .next()
        .unwrap_or(dep_str)
        .to_string()
}

fn source_to_url(source: &str) -> String {
    if source.starts_with("registry+https://") {
        let path = source.trim_start_matches("registry+");
        format!("{}crates/{}", path, "")
    } else if source.starts_with("git+https://") {
        source.trim_start_matches("git+").to_string()
    } else if source.starts_with("path+") {
        source.trim_start_matches("path+").to_string()
    } else {
        source.to_string()
    }
}

fn get_license_from_crates_io_cache(_name: &str) -> Option<String> {
    None
}

fn glob_workspace_members(base_dir: &Path, pattern: &str) -> Result<Vec<PathBuf>> {
    let mut result = Vec::new();

    if pattern.contains('*') {
        use walkdir::WalkDir;
        let pattern_clean = pattern.trim_end_matches('*').trim_end_matches('/');
        let search_dir = base_dir.join(pattern_clean);
        let parent_dir = search_dir.parent().unwrap_or(base_dir);

        if parent_dir.exists() {
            for entry in WalkDir::new(parent_dir).max_depth(2).min_depth(1) {
                let entry = entry?;
                if entry.file_type().is_dir() {
                    let cargo_toml = entry.path().join("Cargo.toml");
                    if cargo_toml.exists() {
                        result.push(entry.path().to_path_buf());
                    }
                }
            }
        }
    } else {
        let path = base_dir.join(pattern);
        if path.exists() {
            result.push(path);
        }
    }

    Ok(result)
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;

    #[test]
    fn test_can_parse_cargo_toml() {
        let parser = CargoParser;
        assert!(parser.can_parse(Path::new("Cargo.toml")));
        assert!(parser.can_parse(Path::new("Cargo.lock")));
        assert!(!parser.can_parse(Path::new("package.json")));
    }

    #[test]
    fn test_parse_simple_cargo_toml() {
        let dir = tempdir().unwrap();
        let content = r#"
[package]
name = "my-project"
version = "0.1.0"
license = "MIT"

[dependencies]
serde = "1.0"
tokio = { version = "1.0", features = ["full"] }
"#;
        std::fs::write(dir.path().join("Cargo.toml"), content).unwrap();

        let options = ScanOptions::default();
        let deps = CargoParser
            .parse(&dir.path().join("Cargo.toml"), &options)
            .unwrap();
        assert_eq!(deps.len(), 2);
        assert!(deps.iter().all(|d| d.is_direct));
    }

    #[test]
    fn test_parse_cargo_lock() {
        let dir = tempdir().unwrap();
        let cargo_toml = r#"
[package]
name = "my-project"
version = "0.1.0"

[dependencies]
serde = "1.0"
"#;
        let cargo_lock = r#"
version = 3

[[package]]
name = "my-project"
version = "0.1.0"
dependencies = [
 "serde",
]

[[package]]
name = "serde"
version = "1.0.193"
source = "registry+https://github.com/rust-lang/crates.io-index"
checksum = "abc123"
dependencies = [
 "serde_derive",
]

[[package]]
name = "serde_derive"
version = "1.0.193"
source = "registry+https://github.com/rust-lang/crates.io-index"
checksum = "def456"
"#;
        std::fs::write(dir.path().join("Cargo.toml"), cargo_toml).unwrap();
        std::fs::write(dir.path().join("Cargo.lock"), cargo_lock).unwrap();

        let options = ScanOptions::default();
        let deps = CargoParser
            .parse(&dir.path().join("Cargo.toml"), &options)
            .unwrap();
        assert_eq!(deps.len(), 2);
        assert!(deps.iter().any(|d| d.name == "serde" && d.is_direct));
        assert!(deps.iter().any(|d| d.name == "serde_derive" && !d.is_direct));
    }

    #[test]
    fn test_parse_cargo_workspace_no_infinite_recursion() {
        let dir = tempdir().unwrap();

        let root_cargo_toml = r#"
[workspace]
members = ["crates/*"]

[package]
name = "root"
version = "0.1.0"

[dependencies]
serde = "1.0"
"#;
        std::fs::write(dir.path().join("Cargo.toml"), root_cargo_toml).unwrap();

        let crates_dir = dir.path().join("crates");
        std::fs::create_dir_all(&crates_dir).unwrap();

        let crate1_dir = crates_dir.join("crate1");
        std::fs::create_dir_all(&crate1_dir).unwrap();
        std::fs::write(
            crate1_dir.join("Cargo.toml"),
            r#"
[package]
name = "crate1"
version = "0.1.0"

[dependencies]
tokio = "1.0"
"#,
        )
        .unwrap();

        let crate2_dir = crates_dir.join("crate2");
        std::fs::create_dir_all(&crate2_dir).unwrap();
        std::fs::write(
            crate2_dir.join("Cargo.toml"),
            r#"
[package]
name = "crate2"
version = "0.1.0"

[dependencies]
anyhow = "1.0"
"#,
        )
        .unwrap();

        let mut options = ScanOptions::default();
        options.workspace = true;

        let deps = CargoParser
            .parse(&dir.path().join("Cargo.toml"), &options)
            .unwrap();

        assert_eq!(deps.len(), 3);
        let dep_names: Vec<_> = deps.iter().map(|d| d.name.as_str()).collect();
        assert!(dep_names.contains(&"serde"));
        assert!(dep_names.contains(&"tokio"));
        assert!(dep_names.contains(&"anyhow"));
    }
}
