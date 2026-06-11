use crate::config::CleanupConfig;
use crate::git::GitClient;
use crate::models::BranchInfo;
use crate::pr::PrProvider;
use crate::risk::RiskEngine;
use anyhow::Result;
use std::collections::HashMap;
use std::sync::Arc;
use std::thread;

pub struct BranchScanner {
    config: CleanupConfig,
    git: GitClient,
    risk_engine: RiskEngine,
    pr_provider: Option<Box<dyn PrProvider + Send + Sync>>,
}

impl BranchScanner {
    pub fn new(config: CleanupConfig) -> Result<Self> {
        let git = GitClient::new(&config.repo_path)?;
        let risk_engine = RiskEngine::new(config.clone());

        Ok(Self {
            config,
            git,
            risk_engine,
            pr_provider: None,
        })
    }

    pub fn with_pr_provider(mut self, provider: Box<dyn PrProvider + Send + Sync>) -> Self {
        self.pr_provider = Some(provider);
        self
    }

    pub fn scan(&self) -> Result<Vec<BranchInfo>> {
        let mut branches: Vec<BranchInfo> = Vec::new();

        let local_branches = self.git.list_local_branches()?;
        let remote_branches = if self.config.include_remote && self.git.has_remote(&self.config.remote_name) {
            self.git.list_remote_branches(&self.config.remote_name)?
        } else {
            vec![]
        };

        let default_branch = self
            .git
            .get_default_branch(&self.config.remote_name)
            .unwrap_or_else(|_| self.config.default_branch.clone());

        let mut branch_map: HashMap<String, (bool, bool)> = HashMap::new();
        for name in &local_branches {
            branch_map.insert(name.clone(), (true, false));
        }
        for name in &remote_branches {
            let entry = branch_map.entry(name.clone()).or_insert((false, false));
            entry.1 = true;
        }

        let arc_git = Arc::new(self.git.clone());
        let config = self.config.clone();
        let default_branch_clone = default_branch.clone();
        let branch_names: Vec<String> = branch_map.keys().cloned().collect();
        let max_concurrent = self.config.max_concurrent;

        let mut handles = vec![];
        let chunks: Vec<Vec<String>> = branch_names
            .chunks((branch_names.len() + max_concurrent - 1) / max_concurrent.max(1))
            .map(|c| c.to_vec())
            .collect();

        for chunk in chunks {
            let git = Arc::clone(&arc_git);
            let remote_name = config.remote_name.clone();
            let default = default_branch_clone.clone();
            let branch_map_clone = branch_map.clone();

            handles.push(thread::spawn(move || -> Result<Vec<BranchInfo>> {
                let mut results = vec![];
                for name in chunk {
                    let (is_local, is_remote) = branch_map_clone.get(&name).copied().unwrap_or((false, false));
                    if let Ok(info) =
                        git.get_branch_info(&name, is_local, is_remote, &remote_name, &default)
                    {
                        results.push(info);
                    }
                }
                Ok(results)
            }));
        }

        for handle in handles {
            if let Ok(Ok(mut chunk_results)) = handle.join() {
                branches.append(&mut chunk_results);
            }
        }

        if let Some(pr_provider) = &self.pr_provider {
            if let Ok(pr_infos) = pr_provider.fetch_prs() {
                for branch in &mut branches {
                    if let Some(pr) = pr_infos.iter().find(|p| p.branch == branch.name) {
                        branch.pr_status = pr.status;
                        branch.pr_number = Some(pr.number);
                        branch.pr_title = Some(pr.title.clone());
                    }
                }
            }
        }

        for branch in &mut branches {
            let (protected, reasons) = self.config.is_protected(&branch.name);
            branch.is_protected = protected;
            branch.protection_reasons = reasons;
        }

        for branch in &mut branches {
            self.risk_engine.assess(branch);
        }

        branches.sort_by(|a, b| {
            b.risk_level
                .cmp(&a.risk_level)
                .then_with(|| b.age_days().cmp(&a.age_days()))
        });

        Ok(branches)
    }

    pub fn git_client(&self) -> &GitClient {
        &self.git
    }

    pub fn risk_engine(&self) -> &RiskEngine {
        &self.risk_engine
    }
}

impl Clone for BranchScanner {
    fn clone(&self) -> Self {
        Self::new(self.config.clone()).unwrap()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::RiskLevel;
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

        run(&["checkout", "-b", "feature/old"]);
        std::fs::write(path.join("old.txt"), "old").unwrap();
        run(&["add", "."]);
        run(&["commit", "-m", "old feature"]);

        run(&["checkout", "main"]);
        run(&["checkout", "-b", "feature/new"]);
        std::fs::write(path.join("new.txt"), "new").unwrap();
        run(&["add", "."]);
        run(&["commit", "-m", "new feature"]);

        run(&["checkout", "main"]);

        let config = CleanupConfig {
            repo_path: path.to_path_buf(),
            dry_run: true,
            interactive: false,
            ..Default::default()
        };

        (dir, config)
    }

    #[test]
    fn test_scanner_scans_branches() {
        let (_dir, config) = create_test_repo();
        let scanner = BranchScanner::new(config).unwrap();
        let branches = scanner.scan().unwrap();

        assert!(!branches.is_empty());
        assert!(branches.iter().any(|b| b.name == "main"));
        assert!(branches.iter().any(|b| b.name == "feature/old"));
        assert!(branches.iter().any(|b| b.name == "feature/new"));
    }

    #[test]
    fn test_protected_main_branch() {
        let (_dir, config) = create_test_repo();
        let scanner = BranchScanner::new(config).unwrap();
        let branches = scanner.scan().unwrap();

        let main = branches.iter().find(|b| b.name == "main").unwrap();
        assert!(main.is_protected);
        assert_eq!(main.risk_level, RiskLevel::Critical);
    }

    #[test]
    fn test_risk_assessment_applied() {
        let (_dir, config) = create_test_repo();
        let scanner = BranchScanner::new(config).unwrap();
        let branches = scanner.scan().unwrap();

        for branch in &branches {
            assert!(!branch.risk_reasons.is_empty() || branch.is_protected);
        }
    }

    #[test]
    fn test_pr_provider_updates_branch_info() {
        let (_dir, config) = create_test_repo();

        let mock_prs = vec![crate::models::PrInfo {
            number: 42,
            title: "Test PR".to_string(),
            status: crate::models::PrStatus::Open,
            branch: "feature/old".to_string(),
            author: "testuser".to_string(),
            url: None,
        }];
        let provider = crate::pr::MockPrProvider::new(mock_prs);

        let scanner = BranchScanner::new(config).unwrap()
            .with_pr_provider(Box::new(provider));
        let branches = scanner.scan().unwrap();

        let old_branch = branches.iter().find(|b| b.name == "feature/old").unwrap();
        assert_eq!(old_branch.pr_status, crate::models::PrStatus::Open);
        assert_eq!(old_branch.pr_number, Some(42));
        assert_eq!(old_branch.pr_title, Some("Test PR".to_string()));
    }

    #[test]
    fn test_open_pr_increases_risk_via_scanner() {
        let (_dir, config) = create_test_repo();

        let scanner_no_pr = BranchScanner::new(config.clone()).unwrap();
        let branches_no_pr = scanner_no_pr.scan().unwrap();
        let old_no_pr = branches_no_pr.iter().find(|b| b.name == "feature/old").unwrap();
        let risk_without = old_no_pr.risk_level;

        let mock_prs = vec![crate::models::PrInfo {
            number: 1,
            title: "Open PR".to_string(),
            status: crate::models::PrStatus::Open,
            branch: "feature/old".to_string(),
            author: "test".to_string(),
            url: None,
        }];
        let provider = crate::pr::MockPrProvider::new(mock_prs);
        let scanner_with_pr = BranchScanner::new(config).unwrap()
            .with_pr_provider(Box::new(provider));
        let branches_with_pr = scanner_with_pr.scan().unwrap();
        let old_with_pr = branches_with_pr.iter().find(|b| b.name == "feature/old").unwrap();
        let risk_with = old_with_pr.risk_level;

        assert!(
            risk_with > risk_without,
            "有打开 PR 的分支风险等级应该更高: {:?} > {:?}",
            risk_with,
            risk_without
        );
    }
}
