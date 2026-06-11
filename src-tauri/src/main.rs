use nightly_failure_summary::aggregate::aggregate_failures;
use nightly_failure_summary::history::load_history;
use nightly_failure_summary::junit::collect_failed_test_cases;
use nightly_failure_summary::screenshot::scan_screenshot_dir;
use nightly_failure_summary::types::{HistoryFile, Report};
use serde::{Deserialize, Serialize};
use std::path::Path;

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct GenerateReportRequest {
    junit_dir: String,
    screenshot_dir: String,
    history_file: Option<String>,
}

#[tauri::command]
fn generate_report(request: GenerateReportRequest) -> Result<serde_json::Value, String> {
    let junit_dir = Path::new(&request.junit_dir);
    let screenshot_dir = Path::new(&request.screenshot_dir);

    let scan_result = scan_screenshot_dir(screenshot_dir);
    let screenshot_warnings = scan_result.warnings;

    let failed_cases =
        collect_failed_test_cases(junit_dir, Path::new(".")).map_err(|e| e.to_string())?;

    let history: HistoryFile = match &request.history_file {
        Some(path) => load_history(Path::new(path)).map_err(|e| e.to_string())?,
        None => HistoryFile::default(),
    };

    let aggregated = aggregate_failures(&failed_cases, &scan_result.entries, &history);

    let total_failures: usize = aggregated.iter().map(|a| a.occurrence_count).sum();
    let unique_tests = aggregated.len();

    let all_warnings: Vec<String> = screenshot_warnings
        .into_iter()
        .chain(aggregated.iter().flat_map(|a| a.screenshot_warnings.clone()))
        .collect();

    let report = Report {
        generated_at: chrono::Utc::now(),
        total_failures,
        unique_tests,
        failures: aggregated,
        warnings: all_warnings,
    };

    serde_json::to_value(report).map_err(|e| e.to_string())
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![generate_report])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
