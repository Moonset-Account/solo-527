use crate::config::OutputFormat;
use crate::models::{CleanupAction, CleanupItem, CleanupReport, CleanupSummary, RiskLevel};
use anyhow::Result;
use chrono::Local;
use colored::Colorize;
use humansize::{format_size, BINARY};
use std::io::Write;

pub struct ReportGenerator {
    format: OutputFormat,
}

impl ReportGenerator {
    pub fn new(format: OutputFormat) -> Self {
        Self { format }
    }

    pub fn generate(&self, report: &CleanupReport) -> Result<String> {
        match self.format {
            OutputFormat::Human => Ok(self.generate_human(report)),
            OutputFormat::Json => Ok(serde_json::to_string(report)?),
            OutputFormat::JsonPretty => Ok(serde_json::to_string_pretty(report)?),
            OutputFormat::Csv => Ok(self.generate_csv(report)),
            OutputFormat::Markdown => Ok(self.generate_markdown(report)),
        }
    }

    pub fn write_to_stdout(&self, report: &CleanupReport) -> Result<()> {
        let output = self.generate(report)?;
        let mut stdout = std::io::stdout();
        writeln!(stdout, "{}", output)?;
        Ok(())
    }

    fn generate_human(&self, report: &CleanupReport) -> String {
        let mut s = String::new();

        s.push_str(&format!("{}\n", "=== Git 分支清理报告 ===".bold()));
        s.push_str(&format!(
            "仓库: {}\n",
            report.repository_path.display().to_string().cyan()
        ));
        s.push_str(&format!("版本: {}\n", report.version));
        s.push_str(&format!(
            "时间: {}\n\n",
            report.summary.end_time.with_timezone(&Local).format("%Y-%m-%d %H:%M:%S")
        ));

        s.push_str(&self.generate_summary_human(&report.summary));
        s.push('\n');

        let deleted_items: Vec<&CleanupItem> = report
            .items
            .iter()
            .filter(|i| i.action == CleanupAction::Delete)
            .collect();
        if !deleted_items.is_empty() {
            s.push_str(&format!("{}\n", "--- 已删除/将删除分支 ---".bold().green()));
            for item in &deleted_items {
                s.push_str(&self.format_item_human(item));
            }
            s.push('\n');
        }

        let kept_items: Vec<&CleanupItem> = report
            .items
            .iter()
            .filter(|i| i.action == CleanupAction::Keep)
            .collect();
        if !kept_items.is_empty() {
            s.push_str(&format!("{}\n", "--- 保留的分支 ---".bold().yellow()));
            for item in &kept_items {
                s.push_str(&self.format_item_human(item));
            }
            s.push('\n');
        }

        let skipped_items: Vec<&CleanupItem> = report
            .items
            .iter()
            .filter(|i| i.action == CleanupAction::Skip)
            .collect();
        if !skipped_items.is_empty() {
            s.push_str(&format!("{}\n", "--- 跳过的分支（受保护） ---".bold().blue()));
            for item in &skipped_items {
                s.push_str(&self.format_item_human(item));
            }
            s.push('\n');
        }

        if !report.errors.is_empty() {
            s.push_str(&format!("{}\n", "--- 错误清单 ---".bold().red()));
            for err in &report.errors {
                s.push_str(&format!(
                    "  {} [{}] - {}\n",
                    err.branch_name.red().bold(),
                    err.error_type,
                    err.message
                ));
            }
            s.push('\n');
        }

        s.push_str(&format!("{}\n", "=== 报告结束 ===".bold()));

        s
    }

    fn generate_summary_human(&self, summary: &CleanupSummary) -> String {
        let mut s = String::new();
        s.push_str(&format!("{}\n", "--- 摘要 ---".bold()));
        s.push_str(&format!("  扫描分支总数: {}\n", summary.total_scanned.to_string().bold()));
        s.push_str(&format!(
            "  可安全删除: {}\n",
            summary.safe_to_delete.to_string().green()
        ));
        s.push_str(&format!(
            "  {}: {}\n",
            if summary.dry_run { "将删除" } else { "已删除" },
            summary.actually_deleted.to_string().green().bold()
        ));
        s.push_str(&format!(
            "  保留: {}\n",
            summary.skipped.to_string().yellow()
        ));
        s.push_str(&format!(
            "  受保护: {}\n",
            summary.protected.to_string().blue()
        ));
        s.push_str(&format!(
            "  错误: {}\n",
            summary.errors.to_string().red()
        ));

        if let Some(freed) = summary.total_freed_bytes {
            s.push_str(&format!(
                "  释放空间: {}\n",
                format_size(freed, BINARY).green()
            ));
        }

        let duration = summary.end_time - summary.start_time;
        s.push_str(&format!(
            "  耗时: {} 秒\n",
            duration.num_seconds()
        ));

        if summary.dry_run {
            s.push_str(&format!("  {}\n", "[试运行模式]".yellow().bold()));
        }

        s
    }

    fn format_item_human(&self, item: &CleanupItem) -> String {
        let branch = &item.branch;
        let risk_color = match branch.risk_level {
            RiskLevel::Safe => "green",
            RiskLevel::Low => "cyan",
            RiskLevel::Medium => "yellow",
            RiskLevel::High => "red",
            RiskLevel::Critical => "bright red",
        };

        let mut s = String::new();
        s.push_str(&format!(
            "  {} [{}] - {}\n",
            branch.display_name().bold(),
            self.colorize(branch.risk_level.label(), risk_color),
            branch.last_commit_message
        ));
        s.push_str(&format!(
            "    作者: {} | 最后提交: {} 天前 | 提交: {}\n",
            branch.last_commit_author,
            branch.age_days(),
            &branch.last_commit_sha[..branch.last_commit_sha.len().min(7)]
        ));

        if branch.is_merged {
            s.push_str(&format!(
                "    状态: {}\n",
                "已合并".green()
            ));
        }

        if !branch.protection_reasons.is_empty() {
            s.push_str(&format!(
                "    保护原因: {}\n",
                branch.protection_reasons.join(", ").blue()
            ));
        }

        if !branch.risk_reasons.is_empty() && !branch.is_protected {
            s.push_str(&format!(
                "    风险因素: {}\n",
                branch.risk_reasons.join(", ")
            ));
        }

        if let Some(err) = &item.error_message {
            s.push_str(&format!("    错误: {}\n", err.red()));
        }

        s
    }

    fn colorize(&self, text: &str, color: &str) -> String {
        match color {
            "green" => text.green().to_string(),
            "cyan" => text.cyan().to_string(),
            "yellow" => text.yellow().to_string(),
            "red" => text.red().to_string(),
            "bright red" => text.bright_red().to_string(),
            "blue" => text.blue().to_string(),
            _ => text.to_string(),
        }
    }

    fn generate_csv(&self, report: &CleanupReport) -> String {
        let mut s = String::new();
        s.push_str("分支名,类型,风险等级,状态,最后提交日期,作者,已合并,受保护,操作,成功\n");

        for item in &report.items {
            let branch = &item.branch;
            let branch_type = match (branch.is_local, branch.is_remote) {
                (true, true) => "both",
                (true, false) => "local",
                (false, true) => "remote",
                _ => "unknown",
            };
            s.push_str(&format!(
                "{},{},{},{},{},{},{},{},{},{}\n",
                branch.display_name(),
                branch_type,
                branch.risk_level.label(),
                branch.pr_status.label(),
                branch.last_commit_date.format("%Y-%m-%d"),
                branch.last_commit_author,
                branch.is_merged,
                branch.is_protected,
                item.action.label(),
                item.success
            ));
        }

        s
    }

    fn generate_markdown(&self, report: &CleanupReport) -> String {
        let mut s = String::new();

        s.push_str("# Git 分支清理报告\n\n");
        s.push_str(&format!("- 仓库: `{}`\n", report.repository_path.display()));
        s.push_str(&format!("- 工具版本: {}\n", report.version));
        s.push_str(&format!(
            "- 生成时间: {}\n\n",
            report.summary.end_time.with_timezone(&Local).format("%Y-%m-%d %H:%M:%S")
        ));

        s.push_str("## 摘要\n\n");
        s.push_str("| 指标 | 数值 |\n");
        s.push_str("|------|------|\n");
        s.push_str(&format!("| 扫描分支总数 | {} |\n", report.summary.total_scanned));
        s.push_str(&format!("| 可安全删除 | {} |\n", report.summary.safe_to_delete));
        s.push_str(&format!(
            "| {} | {} |\n",
            if report.summary.dry_run { "将删除" } else { "已删除" },
            report.summary.actually_deleted
        ));
        s.push_str(&format!("| 保留 | {} |\n", report.summary.skipped));
        s.push_str(&format!("| 受保护 | {} |\n", report.summary.protected));
        s.push_str(&format!("| 错误 | {} |\n", report.summary.errors));
        s.push('\n');

        if report.summary.dry_run {
            s.push_str("> **试运行模式** - 没有实际删除任何分支\n\n");
        }

        let deleted: Vec<&CleanupItem> = report
            .items
            .iter()
            .filter(|i| i.action == CleanupAction::Delete)
            .collect();
        if !deleted.is_empty() {
            s.push_str("## 已删除/将删除的分支\n\n");
            s.push_str("| 分支 | 风险等级 | 最后提交 | 作者 | 状态 |\n");
            s.push_str("|------|----------|----------|------|------|\n");
            for item in &deleted {
                let b = &item.branch;
                s.push_str(&format!(
                    "| {} | {} | {} | {} | {} |\n",
                    b.display_name(),
                    b.risk_level.label(),
                    b.last_commit_date.format("%Y-%m-%d"),
                    b.last_commit_author,
                    if b.is_merged { "已合并" } else { "未合并" }
                ));
            }
            s.push('\n');
        }

        if !report.errors.is_empty() {
            s.push_str("## 错误清单\n\n");
            s.push_str("| 分支 | 错误类型 | 消息 |\n");
            s.push_str("|------|----------|------|\n");
            for err in &report.errors {
                s.push_str(&format!("| {} | {} | {} |\n", err.branch_name, err.error_type, err.message));
            }
            s.push('\n');
        }

        s
    }
}

pub fn exit_code_for_report(report: &CleanupReport) -> i32 {
    if !report.errors.is_empty() {
        1
    } else if report.summary.actually_deleted > 0 {
        0
    } else if report.summary.dry_run && report.summary.safe_to_delete > 0 {
        0
    } else {
        0
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::*;
    use chrono::Utc;
    use std::path::PathBuf;

    fn create_test_report() -> CleanupReport {
        let now = Utc::now();
        CleanupReport {
            summary: CleanupSummary {
                total_scanned: 3,
                safe_to_delete: 1,
                actually_deleted: 1,
                skipped: 1,
                errors: 0,
                protected: 1,
                total_freed_bytes: Some(1024),
                start_time: now - chrono::Duration::seconds(5),
                end_time: now,
                dry_run: false,
            },
            items: vec![
                CleanupItem {
                    branch: BranchInfo {
                        name: "main".to_string(),
                        is_local: true,
                        is_remote: false,
                        remote_name: None,
                        last_commit_sha: "abc123".to_string(),
                        last_commit_message: "init".to_string(),
                        last_commit_date: now - chrono::Duration::days(10),
                        last_commit_author: "dev".to_string(),
                        is_merged: false,
                        merged_into: None,
                        ahead_of_default: 0,
                        behind_default: 0,
                        pr_status: PrStatus::NotApplicable,
                        pr_number: None,
                        pr_title: None,
                        is_protected: true,
                        protection_reasons: vec!["默认分支".to_string()],
                        risk_level: RiskLevel::Critical,
                        risk_reasons: vec!["受保护分支".to_string()],
                        size_bytes: None,
                    },
                    action: CleanupAction::Skip,
                    success: true,
                    error_message: None,
                    rollback_info: None,
                },
                CleanupItem {
                    branch: BranchInfo {
                        name: "feature/old".to_string(),
                        is_local: true,
                        is_remote: false,
                        remote_name: None,
                        last_commit_sha: "def456".to_string(),
                        last_commit_message: "old feature".to_string(),
                        last_commit_date: now - chrono::Duration::days(100),
                        last_commit_author: "dev".to_string(),
                        is_merged: true,
                        merged_into: Some("main".to_string()),
                        ahead_of_default: 0,
                        behind_default: 0,
                        pr_status: PrStatus::Merged,
                        pr_number: Some(42),
                        pr_title: Some("Old Feature".to_string()),
                        is_protected: false,
                        protection_reasons: vec![],
                        risk_level: RiskLevel::Safe,
                        risk_reasons: vec!["已合入主分支".to_string()],
                        size_bytes: Some(512),
                    },
                    action: CleanupAction::Delete,
                    success: true,
                    error_message: None,
                    rollback_info: None,
                },
                CleanupItem {
                    branch: BranchInfo {
                        name: "feature/new".to_string(),
                        is_local: true,
                        is_remote: false,
                        remote_name: None,
                        last_commit_sha: "ghi789".to_string(),
                        last_commit_message: "new feature".to_string(),
                        last_commit_date: now - chrono::Duration::days(1),
                        last_commit_author: "dev".to_string(),
                        is_merged: false,
                        merged_into: None,
                        ahead_of_default: 5,
                        behind_default: 0,
                        pr_status: PrStatus::Open,
                        pr_number: Some(123),
                        pr_title: Some("New Feature".to_string()),
                        is_protected: false,
                        protection_reasons: vec![],
                        risk_level: RiskLevel::Medium,
                        risk_reasons: vec!["存在打开的 PR".to_string()],
                        size_bytes: None,
                    },
                    action: CleanupAction::Keep,
                    success: true,
                    error_message: None,
                    rollback_info: None,
                },
            ],
            errors: vec![],
            config_snapshot: serde_json::Value::Null,
            repository_path: PathBuf::from("/test/repo"),
            version: "0.1.0".to_string(),
        }
    }

    #[test]
    fn test_generate_json() {
        let report = create_test_report();
        let gen = ReportGenerator::new(OutputFormat::Json);
        let output = gen.generate(&report).unwrap();
        assert!(output.contains("\"total_scanned\":3"));
        assert!(output.contains("\"version\":\"0.1.0\""));
    }

    #[test]
    fn test_generate_csv() {
        let report = create_test_report();
        let gen = ReportGenerator::new(OutputFormat::Csv);
        let output = gen.generate(&report).unwrap();
        assert!(output.contains("分支名,类型,风险等级"));
        assert!(output.contains("main"));
        assert!(output.contains("feature/old"));
    }

    #[test]
    fn test_generate_markdown() {
        let report = create_test_report();
        let gen = ReportGenerator::new(OutputFormat::Markdown);
        let output = gen.generate(&report).unwrap();
        assert!(output.contains("# Git 分支清理报告"));
        assert!(output.contains("## 摘要"));
        assert!(output.contains("| 指标 | 数值 |"));
    }

    #[test]
    fn test_generate_human() {
        let report = create_test_report();
        let gen = ReportGenerator::new(OutputFormat::Human);
        let output = gen.generate(&report).unwrap();
        assert!(output.contains("Git 分支清理报告"));
        assert!(output.contains("摘要"));
    }

    #[test]
    fn test_exit_code() {
        let mut report = create_test_report();
        assert_eq!(exit_code_for_report(&report), 0);

        report.errors.push(CleanupError {
            branch_name: "test".to_string(),
            error_type: "test".to_string(),
            message: "test error".to_string(),
            details: None,
        });
        assert_eq!(exit_code_for_report(&report), 1);
    }
}
