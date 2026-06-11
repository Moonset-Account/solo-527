use crate::config::CleanupConfig;
use crate::models::{BranchInfo, CleanupAction, CleanupError, CleanupItem, CleanupReport, CleanupSummary, RollbackInfo};
use crate::rollback::RollbackLog;
use crate::scanner::BranchScanner;
use anyhow::Result;
use chrono::Utc;
use dialoguer::{theme::ColorfulTheme, Confirm, MultiSelect};

pub struct CleanupExecutor {
    config: CleanupConfig,
    scanner: BranchScanner,
    rollback_log: Option<RollbackLog>,
}

impl CleanupExecutor {
    pub fn new(config: CleanupConfig) -> Result<Self> {
        let scanner = BranchScanner::new(config.clone())?;
        let rollback_log = if config.rollback_enabled && !config.dry_run {
            let log_dir = config.log_dir.clone().unwrap_or_else(|| crate::platform::rollback_dir());
            Some(RollbackLog::new(&log_dir)?)
        } else {
            None
        };

        Ok(Self {
            config,
            scanner,
            rollback_log,
        })
    }

    pub fn with_pr_provider(mut self, provider: Box<dyn crate::pr::PrProvider + Send + Sync>) -> Self {
        self.scanner = self.scanner.with_pr_provider(provider);
        self
    }

    pub fn execute(&mut self) -> Result<CleanupReport> {
        let start_time = Utc::now();

        let branches = self.scanner.scan()?;
        let total_scanned = branches.len();

        let risk_engine = self.scanner.risk_engine();
        let candidates: Vec<&BranchInfo> = branches
            .iter()
            .filter(|b| risk_engine.should_delete(b))
            .collect();

        let safe_to_delete = candidates.len();

        let selected_for_deletion = if self.config.interactive && !self.config.dry_run {
            self.interactive_select(&candidates)?
        } else {
            candidates.iter().map(|b| b.name.clone()).collect()
        };

        let mut items: Vec<CleanupItem> = Vec::new();
        let mut errors: Vec<CleanupError> = Vec::new();
        let mut actually_deleted = 0;
        let mut skipped = 0;
        let mut protected = 0;
        let mut total_freed = 0u64;

        for branch in &branches {
            let should_delete = selected_for_deletion.contains(&branch.name);

            if branch.is_protected {
                protected += 1;
                items.push(CleanupItem {
                    branch: branch.clone(),
                    action: CleanupAction::Skip,
                    success: true,
                    error_message: None,
                    rollback_info: None,
                });
                continue;
            }

            if !should_delete {
                skipped += 1;
                items.push(CleanupItem {
                    branch: branch.clone(),
                    action: CleanupAction::Keep,
                    success: true,
                    error_message: None,
                    rollback_info: None,
                });
                continue;
            }

            let item = self.perform_delete(branch, &mut errors);
            if item.success && item.action == CleanupAction::Delete {
                actually_deleted += 1;
                if let Some(size) = branch.size_bytes {
                    total_freed += size;
                }
            }
            items.push(item);
        }

        let end_time = Utc::now();

        let summary = CleanupSummary {
            total_scanned,
            safe_to_delete,
            actually_deleted,
            skipped,
            errors: errors.len(),
            protected,
            total_freed_bytes: if total_freed > 0 { Some(total_freed) } else { None },
            start_time,
            end_time,
            dry_run: self.config.dry_run,
        };

        let report = CleanupReport {
            summary,
            items,
            errors,
            config_snapshot: serde_json::to_value(&self.config).unwrap_or(serde_json::Value::Null),
            repository_path: self.config.repo_path.clone(),
            version: env!("CARGO_PKG_VERSION").to_string(),
        };

        if let Some(rollback_log) = &mut self.rollback_log {
            let _ = rollback_log.save_report(&report);
        }

        Ok(report)
    }

    fn interactive_select(&self, candidates: &[&BranchInfo]) -> Result<Vec<String>> {
        if candidates.is_empty() {
            return Ok(vec![]);
        }

        let theme = ColorfulTheme::default();
        let items: Vec<String> = candidates
            .iter()
            .map(|b| {
                format!(
                    "{} [{}] - {}",
                    b.display_name(),
                    b.risk_level.label(),
                    if b.last_commit_message.len() > 50 {
                        format!("{}...", &b.last_commit_message[..47])
                    } else {
                        b.last_commit_message.clone()
                    }
                )
            })
            .collect();

        let defaults: Vec<bool> = candidates
            .iter()
            .map(|b| b.risk_level <= crate::models::RiskLevel::Low)
            .collect();

        let selected = MultiSelect::with_theme(&theme)
            .with_prompt("选择要删除的分支 (空格键选择，Enter 确认)")
            .items(&items)
            .defaults(&defaults)
            .interact()?;

        if selected.is_empty() {
            return Ok(vec![]);
        }

        let confirm = Confirm::with_theme(&theme)
            .with_prompt(format!(
                "确认删除 {} 个分支？此操作不可撤销（除非启用回滚）",
                selected.len()
            ))
            .default(false)
            .interact()?;

        if !confirm {
            return Ok(vec![]);
        }

        Ok(selected
            .into_iter()
            .map(|i| candidates[i].name.clone())
            .collect())
    }

    fn perform_delete(&self, branch: &BranchInfo, errors: &mut Vec<CleanupError>) -> CleanupItem {
        if self.config.dry_run {
            return CleanupItem {
                branch: branch.clone(),
                action: CleanupAction::Delete,
                success: true,
                error_message: None,
                rollback_info: None,
            };
        }

        let git = self.scanner.git_client();
        let mut success = true;
        let mut error_msg = None;
        let mut rollback_info = None;

        if branch.is_local {
            match self.delete_local_branch_with_rollback(git, branch) {
                Ok(rb) => {
                    rollback_info = Some(rb);
                }
                Err(e) => {
                    success = false;
                    error_msg = Some(e.to_string());
                    errors.push(CleanupError {
                        branch_name: branch.name.clone(),
                        error_type: "local_delete".to_string(),
                        message: format!("删除本地分支失败: {}", e),
                        details: None,
                    });
                }
            }
        }

        if success && branch.is_remote {
            if let Err(e) = git.delete_remote_branch(&branch.name, branch.remote_name.as_deref().unwrap_or("origin")) {
                success = false;
                error_msg = Some(e.to_string());
                errors.push(CleanupError {
                    branch_name: branch.name.clone(),
                    error_type: "remote_delete".to_string(),
                    message: format!("删除远端分支失败: {}", e),
                    details: None,
                });
            }
        }

        CleanupItem {
            branch: branch.clone(),
            action: if success { CleanupAction::Delete } else { CleanupAction::Error },
            success,
            error_message: error_msg,
            rollback_info,
        }
    }

    fn delete_local_branch_with_rollback(
        &self,
        git: &crate::git::GitClient,
        branch: &BranchInfo,
    ) -> Result<RollbackInfo> {
        let current = git.get_current_branch().unwrap_or_default();
        if current == branch.name {
            anyhow::bail!("无法删除当前所在分支");
        }

        let sha = branch.last_commit_sha.clone();
        git.delete_local_branch(&branch.name, branch.is_merged)?;

        Ok(RollbackInfo {
            branch_name: branch.name.clone(),
            commit_sha: sha,
            reflog_entry: None,
            timestamp: Utc::now(),
        })
    }

    pub fn rollback(&mut self, rollback_id: &str) -> Result<Vec<String>> {
        if let Some(rollback_log) = &mut self.rollback_log {
            let report = rollback_log.load_report(rollback_id)?;
            let mut restored = vec![];

            let git = self.scanner.git_client();

            for item in &report.items {
                if item.action == CleanupAction::Delete && item.success {
                    if let Some(rb) = &item.rollback_info {
                        if item.branch.is_local {
                            let _ = git.run_git(&[
                                "branch",
                                &rb.branch_name,
                                &rb.commit_sha,
                            ]);
                            restored.push(rb.branch_name.clone());
                        }
                    }
                }
            }

            Ok(restored)
        } else {
            anyhow::bail!("回滚功能未启用");
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;
    use std::process::Command;

    fn create_test_repo() -> (TempDir, CleanupConfig) {
        let dir = TempDir::new().unwrap();
        let path = dir.path();

        let run = |args: &[&str]| {
            Command::new("git")
                .args(args)
                .current_dir(path)
                .output()
                .unwrap();
        };

        run(&["init", "-b", "main"]);
        run(&["config", "user.email", "test@example.com"]);
        run(&["config", "user.name", "Test User"]);

        std::fs::write(path.join("file.txt"), "content").unwrap();
        run(&["add", "."]);
        run(&["commit", "-m", "initial"]);

        run(&["checkout", "-b", "feature/todelete"]);
        std::fs::write(path.join("del.txt"), "delete me").unwrap();
        run(&["add", "."]);
        run(&["commit", "-m", "delete this branch"]);

        run(&["checkout", "main"]);
        run(&["merge", "feature/todelete"]);

        let config = CleanupConfig {
            repo_path: path.to_path_buf(),
            dry_run: false,
            interactive: false,
            rollback_enabled: false,
            min_risk_level: crate::models::RiskLevel::Safe,
            merged_only: true,
            ..Default::default()
        };

        (dir, config)
    }

    #[test]
    fn test_dry_run_does_not_delete() {
        let (dir, mut config) = create_test_repo();
        config.dry_run = true;

        let mut executor = CleanupExecutor::new(config).unwrap();
        let report = executor.execute().unwrap();

        let branches_path = dir.path();
        let output = Command::new("git")
            .args(["branch", "--list"])
            .current_dir(branches_path)
            .output()
            .unwrap();
        let branches = String::from_utf8_lossy(&output.stdout);
        assert!(branches.contains("feature/todelete"));
        assert!(report.summary.dry_run);
    }

    #[test]
    fn test_deletes_merged_branch() {
        let (dir, config) = create_test_repo();

        let mut executor = CleanupExecutor::new(config).unwrap();
        let report = executor.execute().unwrap();

        let output = Command::new("git")
            .args(["branch", "--list"])
            .current_dir(dir.path())
            .output()
            .unwrap();
        let branches = String::from_utf8_lossy(&output.stdout);
        assert!(!branches.contains("feature/todelete"));
        assert!(report.summary.actually_deleted >= 1);
    }

    #[test]
    fn test_report_has_summary() {
        let (_dir, config) = create_test_repo();
        let mut executor = CleanupExecutor::new(config).unwrap();
        let report = executor.execute().unwrap();

        assert!(report.summary.total_scanned > 0);
        assert!(report.summary.protected >= 1);
        assert_eq!(report.version, env!("CARGO_PKG_VERSION"));
    }
}
