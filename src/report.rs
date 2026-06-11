use serde::{Deserialize, Serialize};
use std::path::PathBuf;

use crate::compressor::CompressResult;
use crate::scanner::ImageEntry;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReportEntry {
    pub input_path: String,
    pub output_path: String,
    pub original_size: u64,
    pub compressed_size: u64,
    pub savings_bytes: u64,
    pub savings_percent: f64,
    pub original_dimensions: (u32, u32),
    pub output_dimensions: (u32, u32),
    pub format: String,
    pub status: String,
    pub error: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Report {
    pub tool: String,
    pub version: String,
    pub timestamp: String,
    pub total_input: usize,
    pub total_success: usize,
    pub total_failed: usize,
    pub total_skipped: usize,
    pub total_original_bytes: u64,
    pub total_compressed_bytes: u64,
    pub total_savings_bytes: u64,
    pub savings_percent: f64,
    pub entries: Vec<ReportEntry>,
    pub skipped: Vec<SkippedEntry>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SkippedEntry {
    pub path: String,
    pub reason: String,
}

impl Report {
    pub fn new(skipped: Vec<(PathBuf, String)>) -> Self {
        let skipped_entries: Vec<SkippedEntry> = skipped
            .into_iter()
            .map(|(p, r)| SkippedEntry {
                path: p.display().to_string(),
                reason: r,
            })
            .collect();
        let total_skipped = skipped_entries.len();

        Report {
            tool: "imgproc".to_string(),
            version: env!("CARGO_PKG_VERSION").to_string(),
            timestamp: chrono::Utc::now().to_rfc3339(),
            total_input: 0,
            total_success: 0,
            total_failed: 0,
            total_skipped,
            total_original_bytes: 0,
            total_compressed_bytes: 0,
            total_savings_bytes: 0,
            savings_percent: 0.0,
            entries: Vec::new(),
            skipped: skipped_entries,
        }
    }

    pub fn add_success(&mut self, entry: &ImageEntry, result: &CompressResult, output_format: &str) {
        let savings = result.original_size.saturating_sub(result.compressed_size);
        let pct = if result.original_size > 0 {
            (savings as f64 / result.original_size as f64) * 100.0
        } else {
            0.0
        };

        self.entries.push(ReportEntry {
            input_path: entry.path.display().to_string(),
            output_path: result.output_path.display().to_string(),
            original_size: result.original_size,
            compressed_size: result.compressed_size,
            savings_bytes: savings,
            savings_percent: pct,
            original_dimensions: result.original_dimensions,
            output_dimensions: result.output_dimensions,
            format: output_format.to_string(),
            status: "success".to_string(),
            error: None,
        });

        self.total_original_bytes += result.original_size;
        self.total_compressed_bytes += result.compressed_size;
        self.total_success += 1;
        self.recalc_totals();
    }

    pub fn add_failure(&mut self, entry: &ImageEntry, error: String, output_format: &str) {
        self.entries.push(ReportEntry {
            input_path: entry.path.display().to_string(),
            output_path: String::new(),
            original_size: entry.size_bytes,
            compressed_size: 0,
            savings_bytes: 0,
            savings_percent: 0.0,
            original_dimensions: (0, 0),
            output_dimensions: (0, 0),
            format: output_format.to_string(),
            status: "failed".to_string(),
            error: Some(error),
        });
        self.total_failed += 1;
        self.recalc_totals();
    }

    fn recalc_totals(&mut self) {
        self.total_input = self.total_success + self.total_failed;
        self.total_savings_bytes = self
            .entries
            .iter()
            .map(|e| e.savings_bytes)
            .sum();
        if self.total_original_bytes > 0 {
            self.savings_percent =
                (self.total_savings_bytes as f64 / self.total_original_bytes as f64) * 100.0;
        }
    }

    pub fn to_json(&self) -> String {
        serde_json::to_string_pretty(self).unwrap_or_else(|_| "{}".to_string())
    }

    pub fn to_text(&self) -> String {
        let mut lines = Vec::new();
        lines.push(format!("imgproc v{}", self.version));
        lines.push(format!("Timestamp: {}", self.timestamp));
        lines.push(format!(
            "Processed: {} success, {} failed, {} skipped",
            self.total_success, self.total_failed, self.total_skipped
        ));
        lines.push(format!(
            "Total: {} -> {} bytes ({:.1}% savings)",
            self.total_original_bytes, self.total_compressed_bytes, self.savings_percent
        ));
        lines.push(String::new());

        for e in &self.entries {
            if e.status == "success" {
                lines.push(format!(
                    "  ✓ {} -> {} ({}B -> {}B, -{:.1}%)",
                    e.input_path,
                    e.output_path,
                    e.original_size,
                    e.compressed_size,
                    e.savings_percent
                ));
            } else {
                lines.push(format!(
                    "  ✗ {} — {}",
                    e.input_path,
                    e.error.as_deref().unwrap_or("unknown error")
                ));
            }
        }

        if !self.skipped.is_empty() {
            lines.push(String::new());
            lines.push("Skipped:".to_string());
            for s in &self.skipped {
                lines.push(format!("  - {} ({})", s.path, s.reason));
            }
        }

        lines.join("\n")
    }
}
