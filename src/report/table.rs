use super::ReportGenerator;
use crate::config::AuditConfig;
use crate::models::{RiskLevel, ScanResult};
use anyhow::Result;

pub struct TableReport;

impl ReportGenerator for TableReport {
    fn generate(&self, result: &ScanResult, _config: &AuditConfig) -> Result<String> {
        let mut output = String::new();

        output.push_str(&format!(
            "\n=== 依赖许可证审计报告 ===\n\n"
        ));

        output.push_str(&format!(
            "扫描路径数: {}\n",
            result.scanned_paths.len()
        ));
        output.push_str(&format!(
            "包管理器: {}\n",
            result
                .package_managers
                .iter()
                .map(|pm| pm.to_string())
                .collect::<Vec<_>>()
                .join(", ")
        ));
        output.push_str(&format!("总依赖数: {}\n", result.total_count));
        output.push_str(&format!("唯一依赖数: {}\n", result.unique_count));
        output.push_str(&format!(
            "严重风险: {} | 高风险: {} | 未知许可证: {}\n",
            result.critical_risk_count, result.high_risk_count, result.unknown_license_count
        ));
        output.push_str(&format!(
            "需人工复核: {}\n\n",
            result.needs_review_count
        ));

        if result.needs_review_count > 0 {
            output.push_str("=== 人工复核队列 ===\n\n");
            for dep in result.dependencies.iter().filter(|d| d.needs_review) {
                output.push_str(&format!(
                    "  [{}] {}@{} - {} - {}\n",
                    risk_level_label(dep.risk_level),
                    dep.name,
                    dep.version,
                    dep.license,
                    dep.review_reason.as_deref().unwrap_or("需复核")
                ));
            }
            output.push('\n');
        }

        output.push_str("=== 依赖列表 ===\n\n");

        let name_width = result
            .dependencies
            .iter()
            .map(|d| d.name.len())
            .max()
            .unwrap_or(20)
            .max(20);
        let version_width = result
            .dependencies
            .iter()
            .map(|d| d.version.len())
            .max()
            .unwrap_or(10)
            .max(10);
        let license_width = result
            .dependencies
            .iter()
            .map(|d| d.license.len())
            .max()
            .unwrap_or(15)
            .max(12);
        let pm_width = 8;
        let risk_width = 10;

        output.push_str(&format!(
            "{:<name_width$} {:<version_width$} {:<pm_width$} {:<license_width$} {:<risk_width$} 直接\n",
            "包名",
            "版本",
            "类型",
            "许可证",
            "风险",
            name_width = name_width,
            version_width = version_width,
            pm_width = pm_width,
            license_width = license_width,
            risk_width = risk_width
        ));

        output.push_str(&format!(
            "{:-<name_width$} {:-<version_width$} {:-<pm_width$} {:-<license_width$} {:-<risk_width$} ----\n",
            "", "", "", "", "",
            name_width = name_width,
            version_width = version_width,
            pm_width = pm_width,
            license_width = license_width,
            risk_width = risk_width
        ));

        for dep in &result.dependencies {
            output.push_str(&format!(
                "{:<name_width$} {:<version_width$} {:<pm_width$} {:<license_width$} {:<risk_width$} {}\n",
                dep.name,
                dep.version,
                dep.package_manager,
                dep.license,
                risk_level_label(dep.risk_level),
                if dep.is_direct { "是" } else { "否" },
                name_width = name_width,
                version_width = version_width,
                pm_width = pm_width,
                license_width = license_width,
                risk_width = risk_width
            ));
        }

        output.push('\n');
        Ok(output)
    }

    fn format_name(&self) -> &'static str {
        "table"
    }
}

fn risk_level_label(level: RiskLevel) -> &'static str {
    match level {
        RiskLevel::Low => "低",
        RiskLevel::Medium => "中",
        RiskLevel::High => "高",
        RiskLevel::Critical => "严重",
        RiskLevel::Unknown => "未知",
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::{Dependency, PackageManager};
    use std::path::PathBuf;

    #[test]
    fn test_table_report_generation() {
        let dep = Dependency {
            name: "test-pkg".to_string(),
            version: "1.0.0".to_string(),
            license: "MIT".to_string(),
            license_spdx: Some("MIT".to_string()),
            source: None,
            source_url: None,
            package_manager: PackageManager::Npm,
            manifest_path: PathBuf::from("/test/package.json"),
            risk_level: RiskLevel::Low,
            needs_review: false,
            review_reason: None,
            is_direct: true,
        };

        let result = ScanResult {
            dependencies: vec![dep],
            total_count: 1,
            unique_count: 1,
            high_risk_count: 0,
            critical_risk_count: 0,
            unknown_license_count: 0,
            needs_review_count: 0,
            scanned_paths: vec![PathBuf::from("/test")],
            package_managers: vec![PackageManager::Npm],
        };

        let config = AuditConfig::default();
        let report = TableReport.generate(&result, &config).unwrap();
        assert!(report.contains("test-pkg"));
        assert!(report.contains("MIT"));
        assert!(report.contains("依赖许可证审计报告"));
    }
}
