use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FailedTestCase {
    pub name: String,
    pub classname: String,
    pub test_file: PathBuf,
    pub failure_message: String,
    pub failure_type: String,
    pub failure_text: String,
    pub timestamp: Option<DateTime<Utc>>,
    pub screenshot_paths: Vec<PathBuf>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AggregatedFailure {
    pub test_name: String,
    pub classname: String,
    pub test_file: PathBuf,
    pub failure_reasons: Vec<String>,
    pub first_seen: Option<DateTime<Utc>>,
    pub last_seen: Option<DateTime<Utc>>,
    pub occurrence_count: usize,
    pub flaky_score: f64,
    pub screenshot_paths: Vec<PathBuf>,
    pub screenshot_warnings: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HistoryRecord {
    pub test_name: String,
    pub classname: String,
    pub total_runs: u64,
    pub failure_count: u64,
    pub first_failure: Option<DateTime<Utc>>,
    pub last_failure: Option<DateTime<Utc>>,
    pub recent_screenshot_hashes: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct HistoryFile {
    pub records: Vec<HistoryRecord>,
    pub version: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Report {
    pub generated_at: DateTime<Utc>,
    pub total_failures: usize,
    pub unique_tests: usize,
    pub failures: Vec<AggregatedFailure>,
    pub warnings: Vec<String>,
}

#[derive(Debug, Clone)]
pub struct ScreenshotEntry {
    pub path: PathBuf,
    pub test_name: String,
    pub hash: String,
}
