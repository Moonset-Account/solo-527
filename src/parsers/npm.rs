use super::PackageParser;
use crate::config::ScanOptions;
use crate::models::{Dependency, PackageManager, RiskLevel};
use anyhow::{Context, Result};
use serde::Deserialize;
use std::collections::HashMap;
use std::path::{Path, PathBuf};

pub struct NpmParser;

#[derive(Debug, Deserialize)]
struct PackageJson {
    name: Option<String>,
    version: Option<String>,
    license: Option<serde_json::Value>,
    licenses: Option<Vec<LicenseEntry>>,
    repository: Option<serde_json::Value>,
    dependencies: Option<HashMap<String, String>>,
    #[serde(rename = "devDependencies")]
    dev_dependencies: Option<HashMap<String, String>>,
    workspaces: Option<Vec<String>>,
}

#[derive(Debug, Deserialize)]
struct LicenseEntry {
    #[serde(rename = "type")]
    type_: Option<String>,
    url: Option<String>,
}

#[derive(Debug, Deserialize)]
struct PackageLockJson {
    name: Option<String>,
    version: Option<String>,
    lockfile_version: Option<u32>,
    packages: Option<HashMap<String, LockPackage>>,
    dependencies: Option<HashMap<String, LockDependency>>,
}

#[derive(Debug, Deserialize)]
struct LockPackage {
    version: Option<String>,
    resolved: Option<String>,
    license: Option<serde_json::Value>,
    dependencies: Option<HashMap<String, String>>,
    dev: Option<bool>,
}

#[derive(Debug, Deserialize)]
struct LockDependency {
    version: String,
    resolved: Option<String>,
    license: Option<serde_json::Value>,
    dependencies: Option<HashMap<String, LockDependency>>,
    dev: Option<bool>,
}

impl PackageParser for NpmParser {
    fn can_parse(&self, path: &Path) -> bool {
        path.file_name()
            .and_then(|n| n.to_str())
            .map(|n| n == "package.json" || n == "package-lock.json")
            .unwrap_or(false)
    }

    fn parse(&self, path: &Path, options: &ScanOptions) -> Result<Vec<Dependency>> {
        let package_json_path = if path.file_name().and_then(|n| n.to_str()) == Some("package.json")
        {
            path.to_path_buf()
        } else {
            path.parent()
                .map(|p| p.join("package.json"))
                .unwrap_or_else(|| PathBuf::from("package.json"))
        };

        if !package_json_path.exists() {
            return Ok(Vec::new());
        }

        let package_lock_path = package_json_path
            .parent()
            .map(|p| p.join("package-lock.json"))
            .unwrap_or_else(|| PathBuf::from("package-lock.json"));

        let package_content = std::fs::read_to_string(&package_json_path)
            .with_context(|| format!("Failed to read {}", package_json_path.display()))?;
        let package_json: PackageJson = serde_json::from_str(&package_content)
            .with_context(|| format!("Failed to parse {}", package_json_path.display()))?;

        if options.workspace {
            return self.parse_workspace(&package_json, &package_json_path, options);
        }

        if package_lock_path.exists() {
            self.parse_from_lock(&package_lock_path, &package_json, &package_json_path, options)
        } else {
            self.parse_from_manifest(&package_json, &package_json_path, options)
        }
    }

    fn name(&self) -> &'static str {
        "npm"
    }
}

impl NpmParser {
    fn parse_from_lock(
        &self,
        lock_path: &Path,
        package_json: &PackageJson,
        manifest_path: &Path,
        options: &ScanOptions,
    ) -> Result<Vec<Dependency>> {
        let lock_content = std::fs::read_to_string(lock_path)
            .with_context(|| format!("Failed to read {}", lock_path.display()))?;
        let lock: PackageLockJson = serde_json::from_str(&lock_content)
            .with_context(|| format!("Failed to parse {}", lock_path.display()))?;

        let direct_deps = self.collect_direct_deps(package_json, options);

        let mut deps = Vec::new();

        if let Some(packages) = lock.packages {
            for (pkg_path, pkg) in packages {
                let name = if pkg_path.is_empty() {
                    continue;
                } else {
                    extract_package_name(&pkg_path)
                };

                let is_dev = pkg.dev.unwrap_or(false);
                if is_dev && !options.include_dev {
                    continue;
                }

                let version = pkg.version.unwrap_or_else(|| "unknown".to_string());
                let license = extract_license(pkg.license.as_ref());
                let source_url = pkg.resolved.clone();
                let is_direct = direct_deps.contains_key(&name);

                deps.push(Dependency {
                    name,
                    version,
                    license,
                    license_spdx: None,
                    source: source_url.clone(),
                    source_url,
                    package_manager: PackageManager::Npm,
                    manifest_path: manifest_path.to_path_buf(),
                    risk_level: RiskLevel::Unknown,
                    needs_review: false,
                    review_reason: None,
                    is_direct,
                });
            }
        } else if let Some(dependencies) = lock.dependencies {
            self.collect_lock_deps_recursive(
                &dependencies,
                &direct_deps,
                manifest_path,
                options,
                &mut deps,
                true,
            );
        }

        Ok(deps)
    }

    fn collect_lock_deps_recursive(
        &self,
        deps_map: &HashMap<String, LockDependency>,
        direct_deps: &HashMap<String, String>,
        manifest_path: &Path,
        options: &ScanOptions,
        result: &mut Vec<Dependency>,
        is_top_level: bool,
    ) {
        for (name, dep) in deps_map {
            let is_dev = dep.dev.unwrap_or(false);
            if is_dev && !options.include_dev {
                continue;
            }

            let license = extract_license(dep.license.as_ref());
            let source_url = dep.resolved.clone();
            let is_direct = is_top_level && direct_deps.contains_key(name);

            result.push(Dependency {
                name: name.clone(),
                version: dep.version.clone(),
                license,
                license_spdx: None,
                source: source_url.clone(),
                source_url,
                package_manager: PackageManager::Npm,
                manifest_path: manifest_path.to_path_buf(),
                risk_level: RiskLevel::Unknown,
                needs_review: false,
                review_reason: None,
                is_direct,
            });

            if let Some(sub_deps) = &dep.dependencies {
                self.collect_lock_deps_recursive(
                    sub_deps,
                    direct_deps,
                    manifest_path,
                    options,
                    result,
                    false,
                );
            }
        }
    }

    fn parse_from_manifest(
        &self,
        package_json: &PackageJson,
        manifest_path: &Path,
        options: &ScanOptions,
    ) -> Result<Vec<Dependency>> {
        let mut deps = Vec::new();

        if let Some(dependencies) = &package_json.dependencies {
            for (name, version) in dependencies {
                deps.push(Dependency {
                    name: name.clone(),
                    version: version.clone(),
                    license: "UNKNOWN".to_string(),
                    license_spdx: None,
                    source: None,
                    source_url: None,
                    package_manager: PackageManager::Npm,
                    manifest_path: manifest_path.to_path_buf(),
                    risk_level: RiskLevel::Unknown,
                    needs_review: true,
                    review_reason: Some("License info not available from manifest".to_string()),
                    is_direct: true,
                });
            }
        }

        if options.include_dev {
            if let Some(dev_deps) = &package_json.dev_dependencies {
                for (name, version) in dev_deps {
                    deps.push(Dependency {
                        name: name.clone(),
                        version: version.clone(),
                        license: "UNKNOWN".to_string(),
                        license_spdx: None,
                        source: None,
                        source_url: None,
                        package_manager: PackageManager::Npm,
                        manifest_path: manifest_path.to_path_buf(),
                        risk_level: RiskLevel::Unknown,
                        needs_review: true,
                        review_reason: Some("License info not available from manifest".to_string()),
                        is_direct: true,
                    });
                }
            }
        }

        Ok(deps)
    }

    fn parse_workspace(
        &self,
        package_json: &PackageJson,
        manifest_path: &Path,
        options: &ScanOptions,
    ) -> Result<Vec<Dependency>> {
        let mut all_deps = Vec::new();

        let mut root_options = options.clone();
        root_options.workspace = false;
        let root_deps = self.parse(manifest_path, &root_options)?;
        all_deps.extend(root_deps);

        if let Some(workspaces) = &package_json.workspaces {
            let base_dir = manifest_path.parent().unwrap_or_else(|| Path::new("."));
            for pattern in workspaces {
                let workspace_paths = glob_workspaces(base_dir, pattern)?;
                for ws_path in workspace_paths {
                    let pkg_path = ws_path.join("package.json");
                    if pkg_path.exists() {
                        let mut member_options = options.clone();
                        member_options.workspace = false;
                        let ws_deps = self.parse(&pkg_path, &member_options)?;
                        all_deps.extend(ws_deps);
                    }
                }
            }
        }

        Ok(all_deps)
    }

    fn collect_direct_deps(
        &self,
        package_json: &PackageJson,
        options: &ScanOptions,
    ) -> HashMap<String, String> {
        let mut direct = HashMap::new();

        if let Some(deps) = &package_json.dependencies {
            for (name, version) in deps {
                direct.insert(name.clone(), version.clone());
            }
        }

        if options.include_dev {
            if let Some(dev_deps) = &package_json.dev_dependencies {
                for (name, version) in dev_deps {
                    direct.insert(name.clone(), version.clone());
                }
            }
        }

        direct
    }
}

fn extract_package_name(pkg_path: &str) -> String {
    if let Some(pos) = pkg_path.rfind("node_modules/") {
        pkg_path[pos + "node_modules/".len()..].to_string()
    } else {
        pkg_path.to_string()
    }
}

fn extract_license(license_value: Option<&serde_json::Value>) -> String {
    let Some(value) = license_value else {
        return "UNKNOWN".to_string();
    };

    match value {
        serde_json::Value::String(s) => s.clone(),
        serde_json::Value::Object(obj) => {
            if let Some(type_val) = obj.get("type") {
                if let Some(type_str) = type_val.as_str() {
                    return type_str.to_string();
                }
            }
            "UNKNOWN".to_string()
        }
        _ => "UNKNOWN".to_string(),
    }
}

fn glob_workspaces(base_dir: &Path, pattern: &str) -> Result<Vec<PathBuf>> {
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
                    let pkg_json = entry.path().join("package.json");
                    if pkg_json.exists() {
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

    fn create_package_json(dir: &Path, content: &str) {
        std::fs::write(dir.join("package.json"), content).unwrap();
    }

    #[test]
    fn test_can_parse_package_json() {
        let parser = NpmParser;
        assert!(parser.can_parse(Path::new("package.json")));
        assert!(parser.can_parse(Path::new("package-lock.json")));
        assert!(!parser.can_parse(Path::new("go.mod")));
    }

    #[test]
    fn test_parse_simple_package() {
        let dir = tempdir().unwrap();
        create_package_json(
            dir.path(),
            r#"{
                "name": "test-project",
                "version": "1.0.0",
                "dependencies": {
                    "lodash": "^4.17.0",
                    "react": "^18.0.0"
                }
            }"#,
        );

        let options = ScanOptions::default();
        let deps = NpmParser.parse(&dir.path().join("package.json"), &options).unwrap();
        assert_eq!(deps.len(), 2);
        assert!(deps.iter().all(|d| d.is_direct));
    }

    #[test]
    fn test_parse_with_dev_deps() {
        let dir = tempdir().unwrap();
        create_package_json(
            dir.path(),
            r#"{
                "name": "test-project",
                "version": "1.0.0",
                "dependencies": {
                    "lodash": "^4.17.0"
                },
                "devDependencies": {
                    "jest": "^29.0.0"
                }
            }"#,
        );

        let mut options = ScanOptions::default();
        options.include_dev = true;
        let deps = NpmParser.parse(&dir.path().join("package.json"), &options).unwrap();
        assert_eq!(deps.len(), 2);

        options.include_dev = false;
        let deps = NpmParser.parse(&dir.path().join("package.json"), &options).unwrap();
        assert_eq!(deps.len(), 1);
    }

    #[test]
    fn test_parse_workspace_no_infinite_recursion() {
        let dir = tempdir().unwrap();

        create_package_json(
            dir.path(),
            r#"{
                "name": "root",
                "version": "1.0.0",
                "private": true,
                "workspaces": ["packages/*"],
                "dependencies": {
                    "lodash": "^4.17.0"
                }
            }"#,
        );

        let packages_dir = dir.path().join("packages");
        std::fs::create_dir_all(&packages_dir).unwrap();

        let pkg1_dir = packages_dir.join("pkg1");
        std::fs::create_dir_all(&pkg1_dir).unwrap();
        create_package_json(
            &pkg1_dir,
            r#"{
                "name": "pkg1",
                "version": "1.0.0",
                "dependencies": {
                    "react": "^18.0.0"
                }
            }"#,
        );

        let pkg2_dir = packages_dir.join("pkg2");
        std::fs::create_dir_all(&pkg2_dir).unwrap();
        create_package_json(
            &pkg2_dir,
            r#"{
                "name": "pkg2",
                "version": "1.0.0",
                "dependencies": {
                    "vue": "^3.0.0"
                }
            }"#,
        );

        let mut options = ScanOptions::default();
        options.workspace = true;

        let deps = NpmParser.parse(&dir.path().join("package.json"), &options).unwrap();

        assert_eq!(deps.len(), 3);
        let dep_names: Vec<_> = deps.iter().map(|d| d.name.as_str()).collect();
        assert!(dep_names.contains(&"lodash"));
        assert!(dep_names.contains(&"react"));
        assert!(dep_names.contains(&"vue"));
    }

    #[test]
    fn test_parse_workspace_member_without_workspace_flag() {
        let dir = tempdir().unwrap();
        let pkg_dir = dir.path().join("packages").join("pkg1");
        std::fs::create_dir_all(&pkg_dir).unwrap();

        create_package_json(
            &pkg_dir,
            r#"{
                "name": "pkg1",
                "version": "1.0.0",
                "dependencies": {
                    "react": "^18.0.0"
                }
            }"#,
        );

        let mut options = ScanOptions::default();
        options.workspace = false;

        let deps = NpmParser.parse(&pkg_dir.join("package.json"), &options).unwrap();
        assert_eq!(deps.len(), 1);
        assert_eq!(deps[0].name, "react");
    }
}
