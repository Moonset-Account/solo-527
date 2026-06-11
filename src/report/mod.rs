pub mod json;
pub mod html;
pub mod table;

use crate::config::AuditConfig;
use crate::models::ScanResult;
use anyhow::Result;
use std::path::Path;

pub enum ReportFormat {
    Json,
    Html,
    Table,
}

pub trait ReportGenerator {
    fn generate(&self, result: &ScanResult, config: &AuditConfig) -> Result<String>;
    fn format_name(&self) -> &'static str;
}

pub fn write_report(
    result: &ScanResult,
    config: &AuditConfig,
    format: ReportFormat,
    output_path: Option<&Path>,
) -> Result<String> {
    let generator: Box<dyn ReportGenerator> = match format {
        ReportFormat::Json => Box::new(json::JsonReport),
        ReportFormat::Html => Box::new(html::HtmlReport),
        ReportFormat::Table => Box::new(table::TableReport),
    };

    let content = generator.generate(result, config)?;

    if let Some(path) = output_path {
        if let Some(parent) = path.parent() {
            if !parent.as_os_str().is_empty() {
                std::fs::create_dir_all(parent)?;
            }
        }
        std::fs::write(path, &content)?;
    }

    Ok(content)
}
