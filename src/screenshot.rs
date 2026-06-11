use crate::types::ScreenshotEntry;
use sha2::{Digest, Sha256};
use std::collections::HashMap;
use std::path::Path;

pub struct ScreenshotScanResult {
    pub entries: Vec<ScreenshotEntry>,
    pub warnings: Vec<String>,
}

pub fn scan_screenshot_dir(dir: &Path) -> ScreenshotScanResult {
    let mut entries = Vec::new();
    let mut warnings = Vec::new();

    if !dir.exists() {
        warnings.push(format!(
            "Screenshot directory does not exist: {}",
            dir.display()
        ));
        return ScreenshotScanResult { entries, warnings };
    }

    if !dir.is_dir() {
        warnings.push(format!(
            "Screenshot path is not a directory: {}",
            dir.display()
        ));
        return ScreenshotScanResult { entries, warnings };
    }

    let grouped = scan_and_group(dir, &mut warnings);
    for (_, mut screenshots) in grouped {
        screenshots.sort_by(|a, b| a.path.cmp(&b.path));
        entries.extend(screenshots);
    }

    ScreenshotScanResult { entries, warnings }
}

fn scan_and_group(
    dir: &Path,
    warnings: &mut Vec<String>,
) -> HashMap<String, Vec<ScreenshotEntry>> {
    let mut grouped: HashMap<String, Vec<ScreenshotEntry>> = HashMap::new();

    for entry in walkdir::WalkDir::new(dir).into_iter().filter_map(|e| e.ok()) {
        let path = entry.path();
        if !path.is_file() {
            continue;
        }

        let ext = path
            .extension()
            .and_then(|e| e.to_str())
            .unwrap_or("")
            .to_lowercase();

        if !matches!(ext.as_str(), "png" | "jpg" | "jpeg" | "gif" | "webp" | "bmp") {
            continue;
        }

        let test_name = extract_test_name_from_path(path, dir);

        let hash = match compute_file_hash(path) {
            Ok(h) => h,
            Err(e) => {
                warnings.push(format!("Failed to hash screenshot {}: {}", path.display(), e));
                continue;
            }
        };

        grouped
            .entry(test_name.clone())
            .or_default()
            .push(ScreenshotEntry {
                path: path.to_path_buf(),
                test_name,
                hash,
            });
    }

    grouped
}

fn extract_test_name_from_path(screenshot_path: &Path, base_dir: &Path) -> String {
    let relative = screenshot_path
        .strip_prefix(base_dir)
        .unwrap_or(screenshot_path);

    let parts: Vec<&std::ffi::OsStr> = relative.iter().collect();

    if parts.len() >= 2 {
        let parent = parts[0].to_string_lossy();
        let file_stem = screenshot_path
            .file_stem()
            .and_then(|s| s.to_str())
            .unwrap_or("unknown");

        if parent != "screenshots" && !parent.is_empty() {
            return format!("{}.{}", parent, file_stem);
        }
        return file_stem.to_string();
    }

    screenshot_path
        .file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or("unknown")
        .to_string()
}

fn compute_file_hash(path: &Path) -> Result<String, std::io::Error> {
    let data = std::fs::read(path)?;
    let mut hasher = Sha256::new();
    hasher.update(&data);
    let result = hasher.finalize();
    Ok(hex::encode(result))
}

pub fn match_screenshots_to_tests(
    screenshots: &[ScreenshotEntry],
    test_name: &str,
    classname: &str,
) -> Vec<std::path::PathBuf> {
    let mut matched = Vec::new();

    for entry in screenshots {
        let entry_lower = entry.test_name.to_lowercase();
        let test_lower = test_name.to_lowercase();
        let class_lower = classname.to_lowercase();

        if entry_lower.contains(&test_lower)
            || entry_lower.contains(&class_lower)
            || test_lower.contains(&entry_lower)
        {
            matched.push(entry.path.clone());
        }
    }

    matched.sort();
    matched
}
