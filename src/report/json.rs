use super::ReportGenerator;
use crate::config::AuditConfig;
use crate::models::{RiskLevel, ScanResult};
use anyhow::Result;
use serde::Serialize;

pub struct JsonReport;

#[derive(Serialize)]
struct JsonReportData<'a> {
    summary: SummaryData,
    dependencies: Vec<DepData<'a>>,
    review_queue: Vec<ReviewItemData<'a>>,
    config: ConfigData<'a>,
}

#[derive(Serialize)]
struct SummaryData {
    total_count: usize,
    unique_count: usize,
    high_risk_count: usize,
    critical_risk_count: usize,
    unknown_license_count: usize,
    needs_review_count: usize,
    package_managers: Vec<String>,
}

#[derive(Serialize)]
struct DepData<'a> {
    name: &'a str,
    version: &'a str,
    license: &'a str,
    license_spdx: Option<&'a str>,
    source: Option<&'a str>,
    source_url: Option<&'a str>,
    package_manager: String,
    risk_level: String,
    needs_review: bool,
    review_reason: Option<&'a str>,
    is_direct: bool,
    manifest_path: String,
}

#[derive(Serialize)]
struct ReviewItemData<'a> {
    name: &'a str,
    version: &'a str,
    license: &'a str,
    risk_level: String,
    reason: &'a str,
    category: String,
    package_manager: String,
}

#[derive(Serialize)]
struct ConfigData<'a> {
    allow_list: Vec<&'a String>,
    deny_list: Vec<&'a String>,
    trusted_sources: &'a [String],
}

impl ReportGenerator for JsonReport {
    fn generate(&self, result: &ScanResult, config: &AuditConfig) -> Result<String> {
        let deps: Vec<DepData> = result
            .dependencies
            .iter()
            .map(|d| DepData {
                name: &d.name,
                version: &d.version,
                license: &d.license,
                license_spdx: d.license_spdx.as_deref(),
                source: d.source.as_deref(),
                source_url: d.source_url.as_deref(),
                package_manager: d.package_manager.to_string(),
                risk_level: d.risk_level.to_string(),
                needs_review: d.needs_review,
                review_reason: d.review_reason.as_deref(),
                is_direct: d.is_direct,
                manifest_path: d.manifest_path.display().to_string(),
            })
            .collect();

        let review_queue: Vec<ReviewItemData> = result
            .review_queue
            .iter()
            .map(|r| ReviewItemData {
                name: &r.dependency.name,
                version: &r.dependency.version,
                license: &r.dependency.license,
                risk_level: r.dependency.risk_level.to_string(),
                reason: &r.reason,
                category: r.category.to_string(),
                package_manager: r.dependency.package_manager.to_string(),
            })
            .collect();

        let data = JsonReportData {
            summary: SummaryData {
                total_count: result.total_count,
                unique_count: result.unique_count,
                high_risk_count: result.high_risk_count,
                critical_risk_count: result.critical_risk_count,
                unknown_license_count: result.unknown_license_count,
                needs_review_count: result.needs_review_count,
                package_managers: result
                    .package_managers
                    .iter()
                    .map(|pm| pm.to_string())
                    .collect(),
            },
            dependencies: deps,
            review_queue,
            config: ConfigData {
                allow_list: config.allow_list.iter().collect(),
                deny_list: config.deny_list.iter().collect(),
                trusted_sources: &config.trusted_sources,
            },
        };

        let json = serde_json::to_string_pretty(&data)?;
        Ok(json)
    }

    fn format_name(&self) -> &'static str {
        "json"
    }
}

pub fn risk_level_color(level: RiskLevel) -> &'static str {
    match level {
        RiskLevel::Low => "#22c55e",
        RiskLevel::Medium => "#eab308",
        RiskLevel::High => "#f97316",
        RiskLevel::Critical => "#ef4444",
        RiskLevel::Unknown => "#6b7280",
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::{Dependency, PackageManager};
    use std::path::PathBuf;

    fn make_test_result() -> ScanResult {
        let dep = Dependency {
            name: "test-pkg".to_string(),
            version: "1.0.0".to_string(),
            license: "MIT".to_string(),
            license_spdx: Some("MIT".to_string()),
            source: Some("registry".to_string()),
            source_url: Some("https://example.com".to_string()),
            package_manager: PackageManager::Npm,
            manifest_path: PathBuf::from("/test/package.json"),
            risk_level: RiskLevel::Low,
            needs_review: false,
            review_reason: None,
            is_direct: true,
        };

        ScanResult {
            dependencies: vec![dep],
            total_count: 1,
            unique_count: 1,
            high_risk_count: 0,
            critical_risk_count: 0,
            unknown_license_count: 0,
            needs_review_count: 0,
            review_queue: vec![],
            scanned_paths: vec![PathBuf::from("/test")],
            package_managers: vec![PackageManager::Npm],
        }
    }

    #[test]
    fn test_json_report_generation() {
        let result = make_test_result();
        let config = AuditConfig::default();
        let report = JsonReport.generate(&result, &config).unwrap();
        assert!(report.contains("test-pkg"));
        assert!(report.contains("MIT"));
        assert!(report.contains("\"risk_level\": \"low\""));
    }
}
