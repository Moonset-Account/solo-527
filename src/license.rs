use crate::config::AuditConfig;
use crate::models::{Dependency, RiskLevel, ReviewCategory, ReviewItem};
use std::collections::HashMap;

pub struct LicenseEvaluator {
    license_risk_map: HashMap<String, RiskLevel>,
    config: AuditConfig,
}

impl LicenseEvaluator {
    pub fn new(config: AuditConfig) -> Self {
        let mut license_risk_map = build_license_risk_map();

        for (license, risk) in &config.risk_overrides {
            license_risk_map.insert(license.to_lowercase(), *risk);
        }

        LicenseEvaluator {
            license_risk_map,
            config,
        }
    }

    pub fn evaluate(&self, dep: &mut Dependency) -> Vec<ReviewItem> {
        let mut review_items = Vec::new();

        let license_lower = dep.license.to_lowercase();
        let is_unknown = license_lower.is_empty()
            || license_lower == "unknown"
            || license_lower == "other"
            || license_lower == "unlicensed";

        if is_unknown {
            dep.risk_level = RiskLevel::Unknown;
            dep.needs_review = true;
            dep.review_reason = Some("Unknown license".to_string());
            review_items.push(ReviewItem {
                dependency: dep.clone(),
                reason: "License type cannot be determined automatically.".to_string(),
                category: ReviewCategory::UnknownLicense,
            });

            if dep.source_url.is_none() && dep.source.is_none() {
                dep.review_reason = Some("Unknown license; Unknown source".to_string());
                review_items.push(ReviewItem {
                    dependency: dep.clone(),
                    reason: "Source repository URL is not available; requires manual confirmation."
                        .to_string(),
                    category: ReviewCategory::UnknownSource,
                });
            }

            return review_items;
        }

        let base_risk = self
            .license_risk_map
            .get(&license_lower)
            .copied()
            .unwrap_or(RiskLevel::Unknown);

        if base_risk == RiskLevel::Unknown {
            dep.needs_review = true;
            dep.review_reason = Some("Unrecognized license".to_string());
            review_items.push(ReviewItem {
                dependency: dep.clone(),
                reason: "License is not in the known license database.".to_string(),
                category: ReviewCategory::UnknownLicense,
            });
        }

        let mut final_risk = base_risk;

        if self.config.is_denied(&dep.license) {
            final_risk = RiskLevel::Critical;
            dep.needs_review = true;
            dep.review_reason = Some("License is in deny list".to_string());
            review_items.push(ReviewItem {
                dependency: dep.clone(),
                reason: "License is explicitly denied by policy.".to_string(),
                category: ReviewCategory::DeniedLicense,
            });
        } else if self.config.is_allowed(&dep.license) {
            if final_risk > RiskLevel::Low {
                final_risk = RiskLevel::Low;
            }
        }

        if dep.source_url.is_none() && dep.source.is_none() {
            dep.needs_review = true;
            let current_reason = dep.review_reason.clone().unwrap_or_default();
            let reason = if current_reason.is_empty() {
                "Unknown source".to_string()
            } else {
                format!("{}; Unknown source", current_reason)
            };
            dep.review_reason = Some(reason);
            review_items.push(ReviewItem {
                dependency: dep.clone(),
                reason: "Source repository URL is not available; requires manual confirmation."
                    .to_string(),
                category: ReviewCategory::UnknownSource,
            });
            if final_risk == RiskLevel::Low {
                final_risk = RiskLevel::Medium;
            }
        } else if let Some(source_url) = &dep.source_url {
            if !self.config.is_trusted_source(source_url) {
                if final_risk < RiskLevel::Medium {
                    final_risk = RiskLevel::Medium;
                }
            }
        }

        dep.risk_level = final_risk;

        if final_risk >= RiskLevel::High {
            if !dep.needs_review {
                dep.needs_review = true;
                dep.review_reason = Some("High risk license".to_string());
            }
            review_items.push(ReviewItem {
                dependency: dep.clone(),
                reason: format!("License '{}' is classified as {} risk.", dep.license, final_risk),
                category: ReviewCategory::HighRisk,
            });
        }

        for item in review_items.iter_mut() {
            item.dependency.risk_level = dep.risk_level;
            item.dependency.review_reason = dep.review_reason.clone();
        }

        review_items
    }

    pub fn evaluate_all(&self, deps: &mut [Dependency]) -> Vec<ReviewItem> {
        let mut all_reviews = Vec::new();
        for dep in deps.iter_mut() {
            let reviews = self.evaluate(dep);
            all_reviews.extend(reviews);
        }
        all_reviews
    }

    pub fn get_license_info(&self, license: &str) -> Option<LicenseInfo> {
        let lower = license.to_lowercase();
        let risk = self.license_risk_map.get(&lower).copied()?;

        let info = get_license_metadata(license).unwrap_or_else(|| LicenseInfo {
            spdx_id: license.to_string(),
            name: license.to_string(),
            risk_level: risk,
            description: String::new(),
            conditions: Vec::new(),
            limitations: Vec::new(),
            permissions: Vec::new(),
        });

        Some(info)
    }

    pub fn deduplicate_by_highest_risk(deps: &[Dependency]) -> Vec<Dependency> {
        let mut map: HashMap<String, Dependency> = HashMap::new();

        for dep in deps {
            let key = dep.name_key();
            match map.get(&key) {
                Some(existing) => {
                    if dep.risk_level >= existing.risk_level {
                        map.insert(key, dep.clone());
                    }
                }
                None => {
                    map.insert(key, dep.clone());
                }
            }
        }

        let mut result: Vec<Dependency> = map.into_values().collect();
        result.sort_by(|a, b| {
            b.risk_level
                .cmp(&a.risk_level)
                .then_with(|| a.name.cmp(&b.name))
        });
        result
    }
}

#[derive(Debug, Clone)]
pub struct LicenseInfo {
    pub spdx_id: String,
    pub name: String,
    pub risk_level: RiskLevel,
    pub description: String,
    pub conditions: Vec<String>,
    pub limitations: Vec<String>,
    pub permissions: Vec<String>,
}

fn build_license_risk_map() -> HashMap<String, RiskLevel> {
    let mut map = HashMap::new();

    let permissive = vec![
        "MIT",
        "MIT-0",
        "Apache-2.0",
        "BSD-2-Clause",
        "BSD-3-Clause",
        "ISC",
        "0BSD",
        "Zlib",
        "Unlicense",
        "CC0-1.0",
        "WTFPL",
        "PostgreSQL",
        "Python-2.0",
        "OpenSSL",
        "Artistic-2.0",
    ];

    let copyleft_weak = vec![
        "LGPL-2.1",
        "LGPL-2.1-only",
        "LGPL-2.1-or-later",
        "LGPL-3.0",
        "LGPL-3.0-only",
        "LGPL-3.0-or-later",
        "MPL-2.0",
        "MPL-1.1",
        "EPL-2.0",
        "EPL-1.0",
        "CDDL-1.0",
        "CDDL-1.1",
    ];

    let copyleft_strong = vec![
        "GPL-2.0",
        "GPL-2.0-only",
        "GPL-2.0-or-later",
        "GPL-3.0",
        "GPL-3.0-only",
        "GPL-3.0-or-later",
        "AGPL-3.0",
        "AGPL-3.0-only",
        "AGPL-3.0-or-later",
        "AGPL-1.0",
    ];

    let proprietary = vec!["PROPRIETARY", "Commercial", "Proprietary"];

    for lic in permissive {
        map.insert(lic.to_lowercase(), RiskLevel::Low);
    }

    for lic in copyleft_weak {
        map.insert(lic.to_lowercase(), RiskLevel::Medium);
    }

    for lic in copyleft_strong {
        map.insert(lic.to_lowercase(), RiskLevel::High);
    }

    for lic in proprietary {
        map.insert(lic.to_lowercase(), RiskLevel::Critical);
    }

    map.insert("agpl-3.0".to_string(), RiskLevel::Critical);
    map.insert("agpl-3.0-only".to_string(), RiskLevel::Critical);
    map.insert("agpl-3.0-or-later".to_string(), RiskLevel::Critical);
    map.insert("sspl-1.0".to_string(), RiskLevel::High);
    map.insert("bsl-1.0".to_string(), RiskLevel::Medium);
    map.insert("cpl-1.0".to_string(), RiskLevel::High);
    map.insert("ms-pl".to_string(), RiskLevel::Medium);
    map.insert("ms-rl".to_string(), RiskLevel::Medium);

    map
}

fn get_license_metadata(spdx_id: &str) -> Option<LicenseInfo> {
    match spdx_id.to_lowercase().as_str() {
        "mit" => Some(LicenseInfo {
            spdx_id: "MIT".to_string(),
            name: "MIT License".to_string(),
            risk_level: RiskLevel::Low,
            description: "A short and simple permissive license with conditions only requiring preservation of copyright and license notices."
                .to_string(),
            conditions: vec!["License and copyright notice".to_string()],
            limitations: vec!["Liability".to_string(), "Warranty".to_string()],
            permissions: vec![
                "Commercial use".to_string(),
                "Modification".to_string(),
                "Distribution".to_string(),
                "Private use".to_string(),
            ],
        }),
        "apache-2.0" => Some(LicenseInfo {
            spdx_id: "Apache-2.0".to_string(),
            name: "Apache License 2.0".to_string(),
            risk_level: RiskLevel::Low,
            description: "A permissive license whose main conditions require preservation of copyright and license notices."
                .to_string(),
            conditions: vec![
                "License and copyright notice".to_string(),
                "State changes".to_string(),
            ],
            limitations: vec!["Liability".to_string(), "Warranty".to_string()],
            permissions: vec![
                "Commercial use".to_string(),
                "Modification".to_string(),
                "Distribution".to_string(),
                "Patent use".to_string(),
                "Private use".to_string(),
            ],
        }),
        "gpl-3.0" | "gpl-3.0-only" => Some(LicenseInfo {
            spdx_id: "GPL-3.0".to_string(),
            name: "GNU General Public License v3.0".to_string(),
            risk_level: RiskLevel::High,
            description: "Permissions of this strong copyleft license are conditioned on making available complete source code of licensed works and modifications."
                .to_string(),
            conditions: vec![
                "Disclose source".to_string(),
                "License and copyright notice".to_string(),
                "Same license".to_string(),
                "State changes".to_string(),
                "Install instructions".to_string(),
            ],
            limitations: vec!["Liability".to_string(), "Warranty".to_string()],
            permissions: vec![
                "Commercial use".to_string(),
                "Modification".to_string(),
                "Distribution".to_string(),
                "Patent use".to_string(),
                "Private use".to_string(),
            ],
        }),
        "agpl-3.0" | "agpl-3.0-only" => Some(LicenseInfo {
            spdx_id: "AGPL-3.0".to_string(),
            name: "GNU Affero General Public License v3.0".to_string(),
            risk_level: RiskLevel::Critical,
            description: "The GNU Affero General Public License is a free, copyleft license for software and other kinds of works, specifically designed to ensure cooperation with the community in the case of network server software."
                .to_string(),
            conditions: vec![
                "Disclose source".to_string(),
                "License and copyright notice".to_string(),
                "Same license".to_string(),
                "State changes".to_string(),
                "Network use is distribution".to_string(),
            ],
            limitations: vec!["Liability".to_string(), "Warranty".to_string()],
            permissions: vec![
                "Commercial use".to_string(),
                "Modification".to_string(),
                "Distribution".to_string(),
                "Patent use".to_string(),
                "Private use".to_string(),
            ],
        }),
        "lgpl-3.0" | "lgpl-3.0-only" => Some(LicenseInfo {
            spdx_id: "LGPL-3.0".to_string(),
            name: "GNU Lesser General Public License v3.0".to_string(),
            risk_level: RiskLevel::Medium,
            description: "Permissions of this copyleft license are conditioned on making available complete source code of licensed works and modifications under the same license."
                .to_string(),
            conditions: vec![
                "Disclose source".to_string(),
                "License and copyright notice".to_string(),
                "Same license (library)".to_string(),
                "State changes".to_string(),
            ],
            limitations: vec!["Liability".to_string(), "Warranty".to_string()],
            permissions: vec![
                "Commercial use".to_string(),
                "Modification".to_string(),
                "Distribution".to_string(),
                "Patent use".to_string(),
                "Private use".to_string(),
            ],
        }),
        "bsd-3-clause" => Some(LicenseInfo {
            spdx_id: "BSD-3-Clause".to_string(),
            name: "BSD 3-Clause \"New\" or \"Revised\" License".to_string(),
            risk_level: RiskLevel::Low,
            description: "A permissive license similar to the BSD 2-Clause License, but with a 3rd clause that prohibits others from using the name of the copyright holder or its contributors to promote derived products without written consent."
                .to_string(),
            conditions: vec!["License and copyright notice".to_string()],
            limitations: vec!["Liability".to_string(), "Warranty".to_string()],
            permissions: vec![
                "Commercial use".to_string(),
                "Modification".to_string(),
                "Distribution".to_string(),
                "Private use".to_string(),
            ],
        }),
        "bsd-2-clause" => Some(LicenseInfo {
            spdx_id: "BSD-2-Clause".to_string(),
            name: "BSD 2-Clause \"Simplified\" License".to_string(),
            risk_level: RiskLevel::Low,
            description: "A permissive license that comes in two variants, the BSD 2-Clause and BSD 3-Clause.".to_string(),
            conditions: vec!["License and copyright notice".to_string()],
            limitations: vec!["Liability".to_string(), "Warranty".to_string()],
            permissions: vec![
                "Commercial use".to_string(),
                "Modification".to_string(),
                "Distribution".to_string(),
                "Private use".to_string(),
            ],
        }),
        "mpl-2.0" => Some(LicenseInfo {
            spdx_id: "MPL-2.0".to_string(),
            name: "Mozilla Public License 2.0".to_string(),
            risk_level: RiskLevel::Medium,
            description: "Permissions of this weak copyleft license are conditioned on making available source code of licensed files and modifications of those files under the same license."
                .to_string(),
            conditions: vec![
                "Disclose source (file-level)".to_string(),
                "License and copyright notice".to_string(),
                "Same license (file-level)".to_string(),
            ],
            limitations: vec!["Liability".to_string(), "Warranty".to_string()],
            permissions: vec![
                "Commercial use".to_string(),
                "Modification".to_string(),
                "Distribution".to_string(),
                "Private use".to_string(),
            ],
        }),
        _ => None,
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::PackageManager;
    use std::path::PathBuf;

    fn make_dep(name: &str, license: &str) -> Dependency {
        Dependency {
            name: name.to_string(),
            version: "1.0.0".to_string(),
            license: license.to_string(),
            license_spdx: Some(license.to_string()),
            source: None,
            source_url: Some("https://registry.npmjs.org/".to_string()),
            package_manager: PackageManager::Npm,
            manifest_path: PathBuf::from("/test/package.json"),
            risk_level: RiskLevel::Unknown,
            needs_review: false,
            review_reason: None,
            is_direct: true,
        }
    }

    #[test]
    fn test_mit_is_low() {
        let config = AuditConfig::default();
        let evaluator = LicenseEvaluator::new(config);
        let mut dep = make_dep("test", "MIT");
        evaluator.evaluate(&mut dep);
        assert_eq!(dep.risk_level, RiskLevel::Low);
    }

    #[test]
    fn test_gpl3_is_high() {
        let config = AuditConfig::default();
        let evaluator = LicenseEvaluator::new(config);
        let mut dep = make_dep("test", "GPL-3.0");
        evaluator.evaluate(&mut dep);
        assert_eq!(dep.risk_level, RiskLevel::High);
    }

    #[test]
    fn test_agpl_is_critical() {
        let config = AuditConfig::default();
        let evaluator = LicenseEvaluator::new(config);
        let mut dep = make_dep("test", "AGPL-3.0");
        evaluator.evaluate(&mut dep);
        assert_eq!(dep.risk_level, RiskLevel::Critical);
    }

    #[test]
    fn test_unknown_license_needs_review() {
        let config = AuditConfig::default();
        let evaluator = LicenseEvaluator::new(config);
        let mut dep = make_dep("test", "UNKNOWN");
        let reviews = evaluator.evaluate(&mut dep);
        assert!(dep.needs_review);
        assert_eq!(dep.risk_level, RiskLevel::Unknown);
        assert!(!reviews.is_empty());
    }

    #[test]
    fn test_deny_list_overrides() {
        let mut config = AuditConfig::default();
        config.add_deny("MIT");
        let evaluator = LicenseEvaluator::new(config);
        let mut dep = make_dep("test", "MIT");
        evaluator.evaluate(&mut dep);
        assert_eq!(dep.risk_level, RiskLevel::Critical);
        assert!(dep.needs_review);
    }

    #[test]
    fn test_allow_list_overrides_high() {
        let mut config = AuditConfig::default();
        config.add_allow("GPL-3.0");
        let evaluator = LicenseEvaluator::new(config);
        let mut dep = make_dep("test", "GPL-3.0");
        evaluator.evaluate(&mut dep);
        assert_eq!(dep.risk_level, RiskLevel::Low);
    }

    #[test]
    fn test_unknown_source_needs_review() {
        let config = AuditConfig::default();
        let evaluator = LicenseEvaluator::new(config);
        let mut dep = make_dep("test", "MIT");
        dep.source_url = None;
        let reviews = evaluator.evaluate(&mut dep);
        assert!(dep.needs_review);
        assert!(reviews.iter().any(|r| r.category == ReviewCategory::UnknownSource));
    }

    #[test]
    fn test_deduplicate_by_highest_risk() {
        let dep1 = Dependency {
            name: "foo".to_string(),
            version: "1.0.0".to_string(),
            license: "MIT".to_string(),
            license_spdx: Some("MIT".to_string()),
            source: None,
            source_url: Some("https://crates.io/".to_string()),
            package_manager: PackageManager::Cargo,
            manifest_path: PathBuf::from("/test/Cargo.toml"),
            risk_level: RiskLevel::Low,
            needs_review: false,
            review_reason: None,
            is_direct: true,
        };
        let mut dep2 = dep1.clone();
        dep2.version = "2.0.0".to_string();
        dep2.license = "GPL-3.0".to_string();
        dep2.risk_level = RiskLevel::High;

        let deps = vec![dep1, dep2];
        let result = LicenseEvaluator::deduplicate_by_highest_risk(&deps);
        assert_eq!(result.len(), 1);
        assert_eq!(result[0].risk_level, RiskLevel::High);
        assert_eq!(result[0].version, "2.0.0");
    }

    #[test]
    fn test_risk_level_ordering() {
        use RiskLevel::*;
        assert!(Critical > High);
        assert!(High > Medium);
        assert!(Medium > Low);
        assert!(Low > Unknown);
        assert!(Critical > Unknown);
        assert!(High > Low);
        assert!(Critical == Critical);
        assert!(Unknown == Unknown);

        let mut levels = vec![Low, Critical, Medium, Unknown, High];
        levels.sort();
        assert_eq!(levels, vec![Unknown, Low, Medium, High, Critical]);

        levels.sort_by(|a, b| b.cmp(a));
        assert_eq!(levels, vec![Critical, High, Medium, Low, Unknown]);
    }

    #[test]
    fn test_deduplicate_unknown_does_not_override_higher_risk() {
        let dep_low = Dependency {
            name: "foo".to_string(),
            version: "1.0.0".to_string(),
            license: "MIT".to_string(),
            license_spdx: Some("MIT".to_string()),
            source: None,
            source_url: Some("https://crates.io/".to_string()),
            package_manager: PackageManager::Cargo,
            manifest_path: PathBuf::from("/test/Cargo.toml"),
            risk_level: RiskLevel::Low,
            needs_review: false,
            review_reason: None,
            is_direct: true,
        };
        let mut dep_unknown = dep_low.clone();
        dep_unknown.version = "2.0.0".to_string();
        dep_unknown.license = "UNKNOWN".to_string();
        dep_unknown.risk_level = RiskLevel::Unknown;
        dep_unknown.needs_review = true;
        dep_unknown.review_reason = Some("Unknown license".to_string());

        let deps = vec![dep_low, dep_unknown];
        let result = LicenseEvaluator::deduplicate_by_highest_risk(&deps);
        assert_eq!(result.len(), 1);
        assert_eq!(result[0].risk_level, RiskLevel::Low);
        assert_eq!(result[0].version, "1.0.0");
    }

    #[test]
    fn test_deduplicate_higher_risk_overrides_unknown() {
        let dep_unknown = Dependency {
            name: "foo".to_string(),
            version: "1.0.0".to_string(),
            license: "UNKNOWN".to_string(),
            license_spdx: None,
            source: None,
            source_url: Some("https://crates.io/".to_string()),
            package_manager: PackageManager::Cargo,
            manifest_path: PathBuf::from("/test/Cargo.toml"),
            risk_level: RiskLevel::Unknown,
            needs_review: true,
            review_reason: Some("Unknown license".to_string()),
            is_direct: true,
        };
        let mut dep_high = dep_unknown.clone();
        dep_high.version = "2.0.0".to_string();
        dep_high.license = "GPL-3.0".to_string();
        dep_high.risk_level = RiskLevel::High;
        dep_high.needs_review = true;
        dep_high.review_reason = Some("High risk license".to_string());

        let deps = vec![dep_unknown, dep_high];
        let result = LicenseEvaluator::deduplicate_by_highest_risk(&deps);
        assert_eq!(result.len(), 1);
        assert_eq!(result[0].risk_level, RiskLevel::High);
        assert_eq!(result[0].version, "2.0.0");
    }

    #[test]
    fn test_deduplicate_critical_overrides_all() {
        let dep_low = Dependency {
            name: "foo".to_string(),
            version: "1.0.0".to_string(),
            license: "MIT".to_string(),
            license_spdx: Some("MIT".to_string()),
            source: None,
            source_url: Some("https://crates.io/".to_string()),
            package_manager: PackageManager::Cargo,
            manifest_path: PathBuf::from("/test/Cargo.toml"),
            risk_level: RiskLevel::Low,
            needs_review: false,
            review_reason: None,
            is_direct: true,
        };
        let mut dep_medium = dep_low.clone();
        dep_medium.version = "2.0.0".to_string();
        dep_medium.license = "LGPL-3.0".to_string();
        dep_medium.risk_level = RiskLevel::Medium;
        let mut dep_high = dep_low.clone();
        dep_high.version = "3.0.0".to_string();
        dep_high.license = "GPL-3.0".to_string();
        dep_high.risk_level = RiskLevel::High;
        let mut dep_critical = dep_low.clone();
        dep_critical.version = "4.0.0".to_string();
        dep_critical.license = "AGPL-3.0".to_string();
        dep_critical.risk_level = RiskLevel::Critical;

        let deps = vec![dep_low, dep_medium, dep_high, dep_critical];
        let result = LicenseEvaluator::deduplicate_by_highest_risk(&deps);
        assert_eq!(result.len(), 1);
        assert_eq!(result[0].risk_level, RiskLevel::Critical);
        assert_eq!(result[0].version, "4.0.0");
    }

    #[test]
    fn test_unknown_license_still_needs_review_after_dedup() {
        let dep1 = Dependency {
            name: "foo".to_string(),
            version: "1.0.0".to_string(),
            license: "UNKNOWN".to_string(),
            license_spdx: None,
            source: None,
            source_url: Some("https://crates.io/".to_string()),
            package_manager: PackageManager::Cargo,
            manifest_path: PathBuf::from("/test/Cargo.toml"),
            risk_level: RiskLevel::Unknown,
            needs_review: true,
            review_reason: Some("Unknown license".to_string()),
            is_direct: true,
        };
        let dep2 = Dependency {
            name: "bar".to_string(),
            version: "1.0.0".to_string(),
            license: "MIT".to_string(),
            license_spdx: Some("MIT".to_string()),
            source: None,
            source_url: Some("https://crates.io/".to_string()),
            package_manager: PackageManager::Cargo,
            manifest_path: PathBuf::from("/test/Cargo.toml"),
            risk_level: RiskLevel::Low,
            needs_review: false,
            review_reason: None,
            is_direct: true,
        };

        let deps = vec![dep1, dep2];
        let result = LicenseEvaluator::deduplicate_by_highest_risk(&deps);
        assert_eq!(result.len(), 2);
        let unknown_dep = result.iter().find(|d| d.name == "foo").unwrap();
        assert_eq!(unknown_dep.risk_level, RiskLevel::Unknown);
        assert!(unknown_dep.needs_review);
    }

    #[test]
    fn test_review_items_preserved_before_dedup() {
        let mut dep1 = Dependency {
            name: "foo".to_string(),
            version: "1.0.0".to_string(),
            license: "UNKNOWN".to_string(),
            license_spdx: None,
            source: None,
            source_url: None,
            package_manager: PackageManager::Cargo,
            manifest_path: PathBuf::from("/test/Cargo.toml"),
            risk_level: RiskLevel::Unknown,
            needs_review: false,
            review_reason: None,
            is_direct: true,
        };
        let mut dep2 = Dependency {
            name: "foo".to_string(),
            version: "2.0.0".to_string(),
            license: "MIT".to_string(),
            license_spdx: Some("MIT".to_string()),
            source: None,
            source_url: Some("https://crates.io/".to_string()),
            package_manager: PackageManager::Cargo,
            manifest_path: PathBuf::from("/test/Cargo.toml"),
            risk_level: RiskLevel::Unknown,
            needs_review: false,
            review_reason: None,
            is_direct: false,
        };

        let config = AuditConfig::default();
        let evaluator = LicenseEvaluator::new(config);

        let reviews1 = evaluator.evaluate(&mut dep1);
        let reviews2 = evaluator.evaluate(&mut dep2);

        assert!(!reviews1.is_empty(), "UNKNOWN license dep1 should generate review items");
        assert!(dep1.needs_review);
        assert_eq!(dep1.risk_level, RiskLevel::Unknown);

        assert!(reviews2.is_empty() || dep2.risk_level == RiskLevel::Low,
            "MIT dep2 should be low risk, reviews only for unknown source");

        let all_reviews: Vec<_> = reviews1.into_iter().chain(reviews2.into_iter()).collect();
        let unknown_license_reviews: Vec<_> = all_reviews
            .iter()
            .filter(|r| r.category == ReviewCategory::UnknownLicense)
            .collect();
        assert_eq!(unknown_license_reviews.len(), 1, "Should have 1 UNKNOWN license review from dep1");
        assert_eq!(unknown_license_reviews[0].dependency.version, "1.0.0");

        let deduped = LicenseEvaluator::deduplicate_by_highest_risk(&[dep1.clone(), dep2.clone()]);
        assert_eq!(deduped.len(), 1);
        assert_eq!(deduped[0].risk_level, RiskLevel::Low, "After dedup, foo shows MIT (Low)");
        assert_eq!(deduped[0].version, "2.0.0");

        assert_eq!(all_reviews.len(), 2, "But all_reviews still has both items (UNKNOWN license + unknown source)");
    }

    #[test]
    fn test_deny_list_reviews_preserved_across_versions() {
        let mut dep1 = Dependency {
            name: "bar".to_string(),
            version: "1.0.0".to_string(),
            license: "AGPL-3.0".to_string(),
            license_spdx: Some("AGPL-3.0".to_string()),
            source: None,
            source_url: Some("https://crates.io/".to_string()),
            package_manager: PackageManager::Cargo,
            manifest_path: PathBuf::from("/test/Cargo.toml"),
            risk_level: RiskLevel::Unknown,
            needs_review: false,
            review_reason: None,
            is_direct: true,
        };
        let mut dep2 = Dependency {
            name: "bar".to_string(),
            version: "2.0.0".to_string(),
            license: "MIT".to_string(),
            license_spdx: Some("MIT".to_string()),
            source: None,
            source_url: Some("https://crates.io/".to_string()),
            package_manager: PackageManager::Cargo,
            manifest_path: PathBuf::from("/test/Cargo.toml"),
            risk_level: RiskLevel::Unknown,
            needs_review: false,
            review_reason: None,
            is_direct: false,
        };

        let mut config = AuditConfig::default();
        config.add_deny("AGPL-3.0");
        let evaluator = LicenseEvaluator::new(config);

        let reviews1 = evaluator.evaluate(&mut dep1);
        let reviews2 = evaluator.evaluate(&mut dep2);

        let denied_reviews: Vec<_> = reviews1
            .iter()
            .filter(|r| r.category == ReviewCategory::DeniedLicense)
            .collect();
        assert!(!denied_reviews.is_empty(), "AGPL-3.0 should be denied");
        assert_eq!(dep1.risk_level, RiskLevel::Critical);
        assert_eq!(dep2.risk_level, RiskLevel::Low);

        let deduped = LicenseEvaluator::deduplicate_by_highest_risk(&[dep1.clone(), dep2.clone()]);
        assert_eq!(deduped.len(), 1);
        assert_eq!(deduped[0].risk_level, RiskLevel::Critical, "Dedup shows Critical (AGPL-3.0 denied)");

        assert!(!reviews1.is_empty(), "Review items from dep1 preserved even though dedup keeps dep1");
    }
}
