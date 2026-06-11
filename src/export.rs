use crate::models::*;
use crate::render::render_markdown;
use anyhow::{Context, Result};
use std::collections::HashMap;
use std::path::PathBuf;

#[derive(Debug, Clone)]
pub enum ExportFormat {
    Markdown,
    Json,
}

impl std::str::FromStr for ExportFormat {
    type Err = anyhow::Error;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s.to_lowercase().as_str() {
            "markdown" | "md" => Ok(ExportFormat::Markdown),
            "json" => Ok(ExportFormat::Json),
            other => Err(anyhow::anyhow!("不支持的导出格式: {}", other)),
        }
    }
}

pub struct ExportOptions {
    pub format: ExportFormat,
    pub output: Option<PathBuf>,
    pub pretty: bool,
}

pub fn build_report(rendered: &RenderedReleaseNote) -> ReleaseReport {
    let mut metadata = HashMap::new();
    metadata.insert(
        "total_features".to_string(),
        rendered.grouped.features.len().to_string(),
    );
    metadata.insert(
        "total_fixes".to_string(),
        rendered.grouped.fixes.len().to_string(),
    );
    metadata.insert(
        "total_known_issues".to_string(),
        rendered.grouped.known_issues.len().to_string(),
    );
    metadata.insert(
        "total_upgrade_notices".to_string(),
        rendered.grouped.upgrade_notices.len().to_string(),
    );
    metadata.insert(
        "total_pending".to_string(),
        rendered.grouped.pending_review.len().to_string(),
    );
    metadata.insert(
        "total_validation_issues".to_string(),
        rendered.validation.issues.len().to_string(),
    );
    metadata.insert(
        "validation_passed".to_string(),
        rendered.validation.is_valid.to_string(),
    );

    ReleaseReport {
        product_line: rendered.product_line.clone(),
        version: rendered.version.clone(),
        generated_at: rendered.generated_at,
        input_files: rendered.input_files.clone(),
        groups: rendered.grouped.clone(),
        validation: rendered.validation.clone(),
        metadata,
    }
}

pub fn export(
    rendered: &RenderedReleaseNote,
    opts: &ExportOptions,
) -> Result<Option<String>> {
    let content = match opts.format {
        ExportFormat::Markdown => render_markdown(rendered)?,
        ExportFormat::Json => {
            let report = build_report(rendered);
            if opts.pretty {
                serde_json::to_string_pretty(&report)
                    .context("序列化为 JSON 失败")?
            } else {
                serde_json::to_string(&report)
                    .context("序列化为 JSON 失败")?
            }
        }
    };

    if let Some(output_path) = &opts.output {
        std::fs::write(output_path, &content)
            .with_context(|| format!("无法写入输出文件: {}", output_path.display()))?;
        Ok(None)
    } else {
        Ok(Some(content))
    }
}

pub fn export_collected(
    data: &CollectedData,
    output: Option<&PathBuf>,
    pretty: bool,
) -> Result<Option<String>> {
    let content = if pretty {
        serde_json::to_string_pretty(data).context("序列化为 JSON 失败")?
    } else {
        serde_json::to_string(data).context("序列化为 JSON 失败")?
    };

    if let Some(output_path) = output {
        std::fs::write(output_path, &content)
            .with_context(|| format!("无法写入输出文件: {}", output_path.display()))?;
        Ok(None)
    } else {
        Ok(Some(content))
    }
}

pub fn format_validation_summary(validation: &ValidationResult) -> String {
    let mut out = String::new();
    out.push_str(&format!(
        "校验结果: {}\n",
        if validation.is_valid { "✅ 通过" } else { "❌ 存在错误" }
    ));

    let error_count = validation
        .issues
        .iter()
        .filter(|i| i.severity == "error")
        .count();
    let warning_count = validation
        .issues
        .iter()
        .filter(|i| i.severity == "warning")
        .count();
    let info_count = validation
        .issues
        .iter()
        .filter(|i| i.severity == "info")
        .count();

    out.push_str(&format!(
        "  - Errors: {}, Warnings: {}, Info: {}\n",
        error_count, warning_count, info_count
    ));
    out.push_str(&format!(
        "  - 待补充条目: {}\n",
        validation.entries_needing_review.len()
    ));

    for issue in &validation.issues {
        let file_info = issue
            .source_file
            .as_ref()
            .map(|f| format!(" [{}]", f.display()))
            .unwrap_or_default();
        out.push_str(&format!(
            "  [{}] [{}] {} (规则: {}){}\n",
            issue.severity.to_uppercase(),
            issue.rule_id,
            issue.description,
            issue.rule_id,
            file_info
        ));
        out.push_str(&format!("    建议: {}\n", issue.suggested_action));
    }

    out
}
