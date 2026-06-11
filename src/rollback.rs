use crate::models::CleanupReport;
use crate::platform;
use anyhow::{Context, Result};
use chrono::Utc;
use std::path::{Path, PathBuf};
use std::fs;

pub struct RollbackLog {
    log_dir: PathBuf,
}

impl RollbackLog {
    pub fn new(log_dir: &Path) -> Result<Self> {
        platform::ensure_dir(log_dir)?;
        Ok(Self {
            log_dir: log_dir.to_path_buf(),
        })
    }

    pub fn save_report(&self, report: &CleanupReport) -> Result<String> {
        let id = format!(
            "rollback-{}-{}",
            Utc::now().format("%Y%m%d-%H%M%S"),
            &report.summary.end_time.timestamp_subsec_millis()
        );

        let file_path = self.log_dir.join(format!("{}.json", id));
        let json = serde_json::to_string_pretty(report)?;
        fs::write(&file_path, json)
            .with_context(|| format!("写入回滚日志失败: {}", file_path.display()))?;

        let latest_path = self.log_dir.join("latest.json");
        let _ = fs::copy(&file_path, &latest_path);

        Ok(id)
    }

    pub fn load_report(&self, id: &str) -> Result<CleanupReport> {
        let file_path = if id == "latest" {
            self.log_dir.join("latest.json")
        } else {
            self.log_dir.join(format!("{}.json", id))
        };

        let content = fs::read_to_string(&file_path)
            .with_context(|| format!("读取回滚日志失败: {}", file_path.display()))?;

        let report: CleanupReport = serde_json::from_str(&content)?;
        Ok(report)
    }

    pub fn list_rollbacks(&self) -> Result<Vec<RollbackEntry>> {
        let mut entries = vec![];

        if !self.log_dir.exists() {
            return Ok(entries);
        }

        for entry in fs::read_dir(&self.log_dir)? {
            let entry = entry?;
            let path = entry.path();

            if path.extension().and_then(|e| e.to_str()) == Some("json") {
                let file_name = path.file_stem().and_then(|s| s.to_str()).unwrap_or("");

                if file_name == "latest" {
                    continue;
                }

                if let Ok(report) = self.load_report(file_name) {
                    entries.push(RollbackEntry {
                        id: file_name.to_string(),
                        timestamp: report.summary.end_time,
                        deleted_count: report.summary.actually_deleted,
                        path,
                    });
                }
            }
        }

        entries.sort_by(|a, b| b.timestamp.cmp(&a.timestamp));
        Ok(entries)
    }
}

#[derive(Debug, Clone)]
pub struct RollbackEntry {
    pub id: String,
    pub timestamp: chrono::DateTime<Utc>,
    pub deleted_count: usize,
    #[allow(dead_code)]
    pub path: PathBuf,
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;

    #[test]
    fn test_rollback_log_save_and_load() {
        let dir = tempdir().unwrap();
        let log = RollbackLog::new(dir.path()).unwrap();

        let mut report = crate::models::CleanupReport {
            summary: crate::models::CleanupSummary {
                total_scanned: 5,
                safe_to_delete: 2,
                actually_deleted: 2,
                skipped: 1,
                errors: 0,
                protected: 2,
                total_freed_bytes: None,
                start_time: Utc::now(),
                end_time: Utc::now(),
                dry_run: false,
            },
            items: vec![],
            errors: vec![],
            config_snapshot: serde_json::Value::Null,
            repository_path: PathBuf::from("/test"),
            version: "0.1.0".to_string(),
        };

        let id = log.save_report(&report).unwrap();
        assert!(!id.is_empty());

        let loaded = log.load_report(&id).unwrap();
        assert_eq!(loaded.summary.total_scanned, 5);
        assert_eq!(loaded.version, "0.1.0");

        let latest = log.load_report("latest").unwrap();
        assert_eq!(latest.summary.total_scanned, 5);
    }

    #[test]
    fn test_list_rollbacks() {
        let dir = tempdir().unwrap();
        let log = RollbackLog::new(dir.path()).unwrap();

        let report = crate::models::CleanupReport {
            summary: crate::models::CleanupSummary {
                total_scanned: 1,
                safe_to_delete: 0,
                actually_deleted: 0,
                skipped: 0,
                errors: 0,
                protected: 1,
                total_freed_bytes: None,
                start_time: Utc::now(),
                end_time: Utc::now(),
                dry_run: true,
            },
            items: vec![],
            errors: vec![],
            config_snapshot: serde_json::Value::Null,
            repository_path: PathBuf::from("/test"),
            version: "0.1.0".to_string(),
        };

        log.save_report(&report).unwrap();
        let entries = log.list_rollbacks().unwrap();
        assert_eq!(entries.len(), 1);
    }
}
