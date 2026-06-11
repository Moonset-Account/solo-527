use crate::types::Report;

pub fn format_text_report(report: &Report, verbose: bool) -> String {
    let mut out = String::new();

    out.push_str(&format!(
        "Nightly Failure Summary - {}\n",
        report.generated_at.format("%Y-%m-%d %H:%M:%S UTC")
    ));
    out.push_str(&format!(
        "Total failures: {} | Unique tests: {}\n",
        report.total_failures, report.unique_tests
    ));
    out.push_str(&"=".repeat(60));
    out.push('\n');

    for warning in &report.warnings {
        out.push_str(&format!("⚠  {}\n", warning));
    }
    if !report.warnings.is_empty() {
        out.push('\n');
    }

    for (i, failure) in report.failures.iter().enumerate() {
        out.push_str(&format!("\n--- #{} {} ---\n", i + 1, failure.test_name));
        out.push_str(&format!("  Class:     {}\n", failure.classname));
        out.push_str(&format!(
            "  File:      {}\n",
            failure.test_file.display()
        ));
        out.push_str(&format!(
            "  First seen: {}\n",
            failure
                .first_seen
                .map(|t| t.format("%Y-%m-%d %H:%M:%S UTC").to_string())
                .unwrap_or_else(|| "unknown".to_string())
        ));
        out.push_str(&format!("  Occurrences: {}\n", failure.occurrence_count));
        out.push_str(&format!("  Flaky score: {:.2}\n", failure.flaky_score));

        out.push_str("  Reasons:\n");
        for reason in &failure.failure_reasons {
            out.push_str(&format!("    • {}\n", reason));
        }

        if verbose {
            out.push_str(&format!(
                "  Last seen:  {}\n",
                failure
                    .last_seen
                    .map(|t| t.format("%Y-%m-%d %H:%M:%S UTC").to_string())
                    .unwrap_or_else(|| "unknown".to_string())
            ));
            out.push_str("  Screenshots:\n");
            if failure.screenshot_paths.is_empty() {
                out.push_str("    (none)\n");
            } else {
                for sp in &failure.screenshot_paths {
                    out.push_str(&format!("    {}\n", sp.display()));
                }
            }
            for w in &failure.screenshot_warnings {
                out.push_str(&format!("    ⚠ {}\n", w));
            }
        } else {
            out.push_str(&format!(
                "  Screenshots: {} file(s)\n",
                failure.screenshot_paths.len()
            ));
            for w in &failure.screenshot_warnings {
                out.push_str(&format!("    ⚠ {}\n", w));
            }
        }
    }

    out
}

pub fn format_json_report(report: &Report) -> Result<String, serde_json::Error> {
    serde_json::to_string_pretty(report)
}
