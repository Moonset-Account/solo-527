use crate::types::{HistoryFile, ScreenshotEntry};

pub struct FlakyInput<'a> {
    pub history: &'a HistoryFile,
    pub screenshots: &'a [ScreenshotEntry],
}

pub fn calculate_flaky_score(
    test_name: &str,
    classname: &str,
    occurrence_count: usize,
    current_screenshot_hashes: &[String],
    history: &HistoryFile,
) -> f64 {
    let historical_score = calculate_historical_flaky_score(test_name, classname, history);
    let screenshot_score =
        calculate_screenshot_difference_score(test_name, classname, current_screenshot_hashes, history);
    let frequency_score = calculate_frequency_score(occurrence_count);

    let weighted = historical_score * 0.4 + screenshot_score * 0.3 + frequency_score * 0.3;
    weighted.clamp(0.0, 1.0)
}

fn calculate_historical_flaky_score(test_name: &str, classname: &str, history: &HistoryFile) -> f64 {
    let record = history
        .records
        .iter()
        .find(|r| r.test_name == test_name && r.classname == classname);

    match record {
        None => 0.5,
        Some(rec) => {
            if rec.total_runs == 0 {
                return 0.5;
            }
            let failure_rate = rec.failure_count as f64 / rec.total_runs as f64;
            let intermittent = (failure_rate > 0.0 && failure_rate < 1.0) as u8 as f64;
            let rate_factor = if failure_rate > 0.0 && failure_rate < 1.0 {
                1.0 - (failure_rate - 0.5).abs() * 2.0
            } else {
                0.0
            };
            (intermittent * 0.6 + rate_factor * 0.4).clamp(0.0, 1.0)
        }
    }
}

fn calculate_screenshot_difference_score(
    test_name: &str,
    classname: &str,
    current_hashes: &[String],
    history: &HistoryFile,
) -> f64 {
    let record = history
        .records
        .iter()
        .find(|r| r.test_name == test_name && r.classname == classname);

    match record {
        None => 0.5,
        Some(rec) => {
            if rec.recent_screenshot_hashes.is_empty() || current_hashes.is_empty() {
                return 0.5;
            }
            let matching = current_hashes
                .iter()
                .filter(|h| rec.recent_screenshot_hashes.contains(h))
                .count();
            let total = current_hashes.len().max(rec.recent_screenshot_hashes.len());
            let difference_ratio = 1.0 - (matching as f64 / total as f64);
            difference_ratio.clamp(0.0, 1.0)
        }
    }
}

fn calculate_frequency_score(occurrence_count: usize) -> f64 {
    if occurrence_count <= 1 {
        0.2
    } else if occurrence_count <= 3 {
        0.6
    } else {
        0.9
    }
}

pub fn compute_screenshot_hashes_for_test(
    test_name: &str,
    classname: &str,
    screenshots: &[ScreenshotEntry],
) -> Vec<String> {
    screenshots
        .iter()
        .filter(|s| {
            let entry_lower = s.test_name.to_lowercase();
            let test_lower = test_name.to_lowercase();
            let class_lower = classname.to_lowercase();
            entry_lower.contains(&test_lower)
                || entry_lower.contains(&class_lower)
                || test_lower.contains(&entry_lower)
        })
        .map(|s| s.hash.clone())
        .collect()
}
