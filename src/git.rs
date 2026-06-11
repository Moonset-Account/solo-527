use crate::models::BranchInfo;
use crate::models::PrStatus;
use anyhow::{Context, Result};
use chrono::{DateTime, Utc};
use std::path::{Path, PathBuf};
use std::process::Command;

#[derive(Clone)]
pub struct GitClient {
    repo_path: PathBuf,
}

impl GitClient {
    pub fn new(repo_path: &Path) -> Result<Self> {
        let canonical = dunce::canonicalize(repo_path)
            .with_context(|| format!("解析仓库路径失败: {}", repo_path.display()))?;

        if !Self::is_git_repo(&canonical) {
            anyhow::bail!("不是有效的 Git 仓库: {}", canonical.display());
        }

        Ok(Self {
            repo_path: canonical,
        })
    }

    pub fn repo_path(&self) -> &Path {
        &self.repo_path
    }

    fn is_git_repo(path: &Path) -> bool {
        path.join(".git").exists()
            || Command::new("git")
                .arg("rev-parse")
                .arg("--git-dir")
                .current_dir(path)
                .output()
                .map(|out| out.status.success())
                .unwrap_or(false)
    }

    pub fn run_git(&self, args: &[&str]) -> Result<String> {
        let (success, stdout, stderr) = self.run_git_raw(args)?;
        if !success {
            anyhow::bail!("git {} 失败: {}", args.join(" "), stderr.trim());
        }
        Ok(stdout)
    }

    fn run_git_raw(&self, args: &[&str]) -> Result<(bool, String, String)> {
        let output = Command::new("git")
            .args(args)
            .current_dir(&self.repo_path)
            .output()
            .with_context(|| format!("执行 git 命令失败: git {}", args.join(" ")))?;

        let stdout = String::from_utf8_lossy(&output.stdout).to_string();
        let stderr = String::from_utf8_lossy(&output.stderr).to_string();

        Ok((output.status.success(), stdout, stderr))
    }

    pub fn get_default_branch(&self, remote_name: &str) -> Result<String> {
        let output = self.run_git(&["remote", "show", remote_name])?;
        for line in output.lines() {
            if line.contains("HEAD branch") {
                let branch = line
                    .split(':')
                    .nth(1)
                    .unwrap_or("")
                    .trim()
                    .to_string();
                if !branch.is_empty() {
                    return Ok(branch);
                }
            }
        }

        self.run_git(&["symbolic-ref", "--short", "HEAD"])
            .map(|s| s.trim().to_string())
    }

    pub fn list_local_branches(&self) -> Result<Vec<String>> {
        let output = self.run_git(&["branch", "--format=%(refname:short)"])?;
        Ok(output
            .lines()
            .map(|l| l.trim().to_string())
            .filter(|l| !l.is_empty())
            .collect())
    }

    pub fn list_remote_branches(&self, remote_name: &str) -> Result<Vec<String>> {
        let output = self.run_git(&["branch", "-r", "--format=%(refname:short)"])?;
        let prefix = format!("{}/", remote_name);
        Ok(output
            .lines()
            .map(|l| l.trim().to_string())
            .filter(|l| l.starts_with(&prefix) && !l.contains("HEAD"))
            .map(|l| l.strip_prefix(&prefix).unwrap_or(&l).to_string())
            .filter(|l| !l.is_empty())
            .collect())
    }

    pub fn get_branch_info(
        &self,
        branch_name: &str,
        is_local: bool,
        is_remote: bool,
        remote_name: &str,
        default_branch: &str,
    ) -> Result<BranchInfo> {
        let ref_name = if is_remote && !is_local {
            format!("refs/remotes/{}/{}", remote_name, branch_name)
        } else {
            format!("refs/heads/{}", branch_name)
        };

        let format = "%H|%s|%aI|%an|%(parentnumber)";
        let output = self.run_git(&[
            "log",
            "-1",
            &format!("--format={}", format),
            &ref_name,
        ])?;

        let parts: Vec<&str> = output.trim().splitn(5, '|').collect();
        if parts.len() < 4 {
            anyhow::bail!("无法解析分支 {} 的提交信息", branch_name);
        }

        let sha = parts[0].to_string();
        let message = parts[1].to_string();
        let commit_date: DateTime<Utc> = parts[2]
            .parse()
            .with_context(|| format!("解析提交日期失败: {}", parts[2]))?;
        let author = parts[3].to_string();

        let is_merged = self.is_branch_merged(branch_name, default_branch, is_local, is_remote, remote_name)?;

        let (ahead, behind) = self.get_ahead_behind(branch_name, default_branch, is_local, is_remote, remote_name)?;

        Ok(BranchInfo {
            name: branch_name.to_string(),
            is_local,
            is_remote,
            remote_name: if is_remote { Some(remote_name.to_string()) } else { None },
            last_commit_sha: sha,
            last_commit_message: message,
            last_commit_date: commit_date,
            last_commit_author: author,
            is_merged,
            merged_into: if is_merged { Some(default_branch.to_string()) } else { None },
            ahead_of_default: ahead,
            behind_default: behind,
            pr_status: PrStatus::Unknown,
            pr_number: None,
            pr_title: None,
            is_protected: false,
            protection_reasons: vec![],
            risk_level: crate::models::RiskLevel::Low,
            risk_reasons: vec![],
            size_bytes: None,
        })
    }

    fn is_branch_merged(
        &self,
        branch_name: &str,
        base_branch: &str,
        is_local: bool,
        is_remote: bool,
        remote_name: &str,
    ) -> Result<bool> {
        let branch_ref = if is_remote && !is_local {
            format!("{}/{}", remote_name, branch_name)
        } else {
            branch_name.to_string()
        };

        let base_ref = if self.list_remote_branches(remote_name).ok().map(|v| v.contains(&base_branch.to_string())).unwrap_or(false) {
            format!("{}/{}", remote_name, base_branch)
        } else {
            base_branch.to_string()
        };

        let (success, _, _) = self.run_git_raw(&[
            "merge-base",
            "--is-ancestor",
            &branch_ref,
            &base_ref,
        ])?;

        Ok(success)
    }

    fn get_ahead_behind(
        &self,
        branch_name: &str,
        base_branch: &str,
        is_local: bool,
        is_remote: bool,
        remote_name: &str,
    ) -> Result<(u32, u32)> {
        let branch_ref = if is_remote && !is_local {
            format!("{}/{}", remote_name, branch_name)
        } else {
            branch_name.to_string()
        };

        let base_ref = format!("{}/{}", remote_name, base_branch);

        let output = self.run_git(&[
            "rev-list",
            "--left-right",
            "--count",
            &format!("{}...{}", base_ref, branch_ref),
        ]);

        match output {
            Ok(out) => {
                let parts: Vec<&str> = out.trim().split_whitespace().collect();
                if parts.len() == 2 {
                    let behind: u32 = parts[0].parse().unwrap_or(0);
                    let ahead: u32 = parts[1].parse().unwrap_or(0);
                    Ok((ahead, behind))
                } else {
                    Ok((0, 0))
                }
            }
            Err(_) => Ok((0, 0)),
        }
    }

    pub fn delete_local_branch(&self, branch_name: &str, force: bool) -> Result<()> {
        let flag = if force { "-D" } else { "-d" };
        self.run_git(&["branch", flag, branch_name])?;
        Ok(())
    }

    pub fn delete_remote_branch(&self, branch_name: &str, remote_name: &str) -> Result<()> {
        self.run_git(&["push", remote_name, "--delete", branch_name])?;
        Ok(())
    }

    pub fn get_current_branch(&self) -> Result<String> {
        self.run_git(&["rev-parse", "--abbrev-ref", "HEAD"])
            .map(|s| s.trim().to_string())
    }

    pub fn has_remote(&self, remote_name: &str) -> bool {
        self.run_git(&["remote"])
            .map(|out| out.lines().any(|l| l.trim() == remote_name))
            .unwrap_or(false)
    }

    pub fn fetch_remote(&self, remote_name: &str) -> Result<()> {
        self.run_git(&["fetch", remote_name, "--prune"])?;
        Ok(())
    }

    pub fn get_branch_size(&self, branch_name: &str) -> Result<u64> {
        let output = self.run_git(&[
            "rev-list",
            "--objects",
            branch_name,
        ])?;

        let count = output.lines().count() as u64;
        Ok(count * 1024)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;

    fn create_test_repo() -> (TempDir, GitClient) {
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

        let client = GitClient::new(path).unwrap();
        (dir, client)
    }

    #[test]
    fn test_git_client_new() {
        let (_dir, client) = create_test_repo();
        assert!(client.repo_path().exists());
    }

    #[test]
    fn test_list_local_branches() {
        let (_dir, client) = create_test_repo();
        let branches = client.list_local_branches().unwrap();
        assert!(branches.contains(&"main".to_string()));
    }

    #[test]
    fn test_get_branch_info() {
        let (_dir, client) = create_test_repo();
        let info = client
            .get_branch_info("main", true, false, "origin", "main")
            .unwrap();
        assert_eq!(info.name, "main");
        assert!(info.is_local);
        assert!(!info.is_remote);
        assert!(!info.last_commit_sha.is_empty());
    }

    #[test]
    fn test_get_current_branch() {
        let (_dir, client) = create_test_repo();
        let current = client.get_current_branch().unwrap();
        assert_eq!(current, "main");
    }
}
