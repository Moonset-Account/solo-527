use crate::error::AppError;
use crate::types::HistoryFile;
use std::path::Path;

pub fn load_history(path: &Path) -> Result<HistoryFile, AppError> {
    if !path.exists() {
        return Ok(HistoryFile {
            records: Vec::new(),
            version: 1,
        });
    }

    let content = std::fs::read_to_string(path).map_err(|e| AppError::HistoryRead {
        path: path.display().to_string(),
        message: e.to_string(),
    })?;

    let history: HistoryFile =
        serde_json::from_str(&content).map_err(|e| AppError::HistoryParse {
            path: path.display().to_string(),
            message: e.to_string(),
        })?;

    Ok(history)
}

pub fn save_history(path: &Path, history: &HistoryFile) -> Result<(), AppError> {
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent)?;
    }

    let content = serde_json::to_string_pretty(history)?;
    std::fs::write(path, content)?;
    Ok(())
}

pub fn update_history(
    history: &mut HistoryFile,
    test_name: &str,
    classname: &str,
    failed: bool,
    screenshot_hashes: Vec<String>,
) {
    let record = history.records.iter_mut().find(|r| {
        r.test_name == test_name && r.classname == classname
    });

    if let Some(rec) = record {
        rec.total_runs += 1;
        if failed {
            rec.failure_count += 1;
            rec.last_failure = Some(chrono::Utc::now());
            if rec.first_failure.is_none() {
                rec.first_failure = Some(chrono::Utc::now());
            }
        }
        rec.recent_screenshot_hashes = screenshot_hashes;
    } else {
        let now = chrono::Utc::now();
        history.records.push(crate::types::HistoryRecord {
            test_name: test_name.to_string(),
            classname: classname.to_string(),
            total_runs: 1,
            failure_count: if failed { 1 } else { 0 },
            first_failure: if failed { Some(now) } else { None },
            last_failure: if failed { Some(now) } else { None },
            recent_screenshot_hashes: screenshot_hashes,
        });
    }
}
