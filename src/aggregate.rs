use crate::flaky;
use crate::screenshot::match_screenshots_to_tests;
use crate::types::{AggregatedFailure, FailedTestCase, HistoryFile, ScreenshotEntry};
use std::collections::HashMap;

pub fn aggregate_failures(
    test_cases: &[FailedTestCase],
    screenshots: &[ScreenshotEntry],
    history: &HistoryFile,
) -> Vec<AggregatedFailure> {
    let mut groups: HashMap<String, Vec<&FailedTestCase>> = HashMap::new();

    for tc in test_cases {
        let key = format!("{}::{}", tc.classname, tc.name);
        groups.entry(key).or_default().push(tc);
    }

    let mut aggregated: Vec<AggregatedFailure> = Vec::new();

    for (_key, cases) in groups {
        let first = cases.first().unwrap();
        let mut failure_reasons: Vec<String> = cases
            .iter()
            .map(|c| {
                if c.failure_message.is_empty() {
                    c.failure_type.clone()
                } else {
                    c.failure_message.clone()
                }
            })
            .collect();

        failure_reasons.sort();
        failure_reasons.dedup();

        let mut all_timestamps: Vec<_> = cases
            .iter()
            .filter_map(|c| c.timestamp)
            .collect();
        all_timestamps.sort();

        let first_seen = all_timestamps.first().copied();
        let last_seen = all_timestamps.last().copied();

        let matched_screenshots =
            match_screenshots_to_tests(screenshots, &first.name, &first.classname);

        let screenshot_hashes =
            flaky::compute_screenshot_hashes_for_test(&first.name, &first.classname, screenshots);

        let screenshot_warnings = if matched_screenshots.is_empty() {
            vec![format!(
                "No screenshots found for test {}::{}",
                first.classname, first.name
            )]
        } else {
            Vec::new()
        };

        let flaky_score = flaky::calculate_flaky_score(
            &first.name,
            &first.classname,
            cases.len(),
            &screenshot_hashes,
            history,
        );

        aggregated.push(AggregatedFailure {
            test_name: first.name.clone(),
            classname: first.classname.clone(),
            test_file: first.test_file.clone(),
            failure_reasons,
            first_seen,
            last_seen,
            occurrence_count: cases.len(),
            flaky_score,
            screenshot_paths: matched_screenshots,
            screenshot_warnings,
        });
    }

    aggregated.sort_by(|a, b| {
        b.flaky_score
            .partial_cmp(&a.flaky_score)
            .unwrap_or(std::cmp::Ordering::Equal)
            .then_with(|| a.test_name.cmp(&b.test_name))
    });

    aggregated
}
