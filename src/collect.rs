use crate::models::*;
use anyhow::{Context, Result};
use chrono::{DateTime, Utc};
use regex::Regex;
use std::path::{Path, PathBuf};
use std::process::Command;

pub struct CollectOptions {
    pub from_tag: Option<String>,
    pub to_tag: Option<String>,
    pub git_repo: Option<PathBuf>,
    pub issue_file: Option<PathBuf>,
    pub notes_file: Option<PathBuf>,
}

pub fn collect(opts: &CollectOptions) -> Result<CollectedData> {
    let repo_path = opts.git_repo.clone().unwrap_or_else(|| PathBuf::from("."));
    let mut input_files: Vec<PathBuf> = Vec::new();

    let commits = collect_commits(&repo_path, &opts.from_tag, &opts.to_tag)
        .context("收集 Git 提交记录失败")?;

    let issues = if let Some(issue_path) = &opts.issue_file {
        input_files.push(issue_path.clone());
        load_issues(issue_path).context("加载工单信息失败")?
    } else {
        Vec::new()
    };

    let manual_notes = if let Some(notes_path) = &opts.notes_file {
        input_files.push(notes_path.clone());
        load_manual_notes(notes_path).context("加载手工备注失败")?
    } else {
        Vec::new()
    };

    Ok(CollectedData {
        git_tag: opts.to_tag.clone(),
        from_tag: opts.from_tag.clone(),
        to_tag: opts.to_tag.clone(),
        commits,
        issues,
        manual_notes,
        input_files,
        collected_at: Utc::now(),
    })
}

fn collect_commits(
    repo_path: &Path,
    from_tag: &Option<String>,
    to_tag: &Option<String>,
) -> Result<Vec<CommitInfo>> {
    let mut cmd = Command::new("git");
    cmd.arg("-C").arg(repo_path).arg("log");

    match (from_tag, to_tag) {
        (Some(from), Some(to)) => {
            cmd.arg(format!("{}..{}", from, to));
        }
        (Some(from), None) => {
            cmd.arg(format!("{}..HEAD", from));
        }
        (None, Some(to)) => {
            cmd.arg(to.as_str());
        }
        (None, None) => {
            cmd.arg("-n").arg("50");
        }
    }

    let output = cmd
        .arg("--format=COMMIT_SEP%n%H%n%h%n%s%n%an%n%ae%n%aI%n%P")
        .output()
        .context("执行 git log 失败，请确保当前目录是 Git 仓库")?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        anyhow::bail!("git log 执行失败: {}", stderr);
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let blocks: Vec<&str> = stdout.split("COMMIT_SEP\n").skip(1).collect();

    let mut commits = Vec::new();
    let ticket_re = Regex::new(r"(?i)([A-Z]{2,}-\d+|#\d+)").unwrap();
    let merge_re = Regex::new(r"^Merge (?:branch|pull request) '?([^']+)'?").unwrap();

    for block in blocks {
        let lines: Vec<&str> = block.lines().collect();
        if lines.len() < 7 {
            continue;
        }

        let hash = lines[0].trim().to_string();
        let short_hash = lines[1].trim().to_string();
        let message = lines[2].trim().to_string();
        let author = lines[3].trim().to_string();
        let author_email = Some(lines[4].trim().to_string());
        let timestamp = DateTime::parse_from_rfc3339(lines[5].trim())
            .ok()
            .map(|dt| dt.with_timezone(&Utc));
        let parents: Vec<&str> = lines[6].trim().split_whitespace().collect();
        let is_merge = parents.len() > 1;

        let mut merge_from = None;
        let mut branch_name = None;
        if is_merge {
            if let Some(cap) = merge_re.captures(&message) {
                merge_from = Some(cap.get(1).unwrap().as_str().to_string());
            }
            branch_name = merge_from.clone();
        }

        let mut source_links = Vec::new();
        for cap in ticket_re.captures_iter(&message) {
            let ticket_id = cap.get(1).unwrap().as_str().to_string();
            source_links.push(SourceLink {
                url: format!("https://jira.example.com/browse/{}", ticket_id),
                label: Some(ticket_id),
                source_type: "ticket".to_string(),
            });
        }

        commits.push(CommitInfo {
            hash,
            short_hash,
            message,
            author,
            author_email,
            timestamp,
            is_merge,
            branch_name,
            merge_from,
            source_links,
        });
    }

    Ok(commits)
}

fn load_issues(path: &Path) -> Result<Vec<IssueInfo>> {
    let content = std::fs::read_to_string(path)
        .with_context(|| format!("无法读取工单文件: {}", path.display()))?;
    let issues: Vec<IssueInfo> = serde_json::from_str(&content)
        .with_context(|| format!("解析工单 JSON 失败: {}", path.display()))?;
    Ok(issues)
}

fn load_manual_notes(path: &Path) -> Result<Vec<ManualNote>> {
    let content = std::fs::read_to_string(path)
        .with_context(|| format!("无法读取备注文件: {}", path.display()))?;

    if path.extension().and_then(|e| e.to_str()) == Some("json") {
        let notes: Vec<ManualNote> = serde_json::from_str(&content)
            .with_context(|| format!("解析备注 JSON 失败: {}", path.display()))?;
        Ok(notes)
    } else {
        parse_markdown_notes(&content, path)
    }
}

fn parse_markdown_notes(content: &str, path: &Path) -> Result<Vec<ManualNote>> {
    let mut notes = Vec::new();
    let ticket_re = Regex::new(r"(?i)([A-Z]{2,}-\d+|#\d+)").unwrap();

    let blocks: Vec<&str> = content.split("---\n").filter(|s| !s.trim().is_empty()).collect();
    for block in blocks {
        let lines: Vec<&str> = block.lines().collect();
        if lines.is_empty() {
            continue;
        }

        let mut title = String::new();
        let mut category: Option<ChangeCategory> = None;
        let mut scope: Option<String> = None;
        let mut content_lines = Vec::new();
        let mut source_links = Vec::new();

        for line in lines {
            let line = line.trim_end();
            if let Some(stripped) = line.strip_prefix("# ") {
                title = stripped.trim().to_string();
            } else if let Some(cat) = line.strip_prefix("category:").map(|s| s.trim()) {
                category = match cat.to_lowercase().as_str() {
                    "feature" | "功能" => Some(ChangeCategory::Feature),
                    "fix" | "修复" | "bugfix" => Some(ChangeCategory::Fix),
                    "known_issue" | "known issue" | "已知问题" => Some(ChangeCategory::KnownIssue),
                    "upgrade_notice" | "upgrade" | "升级" => Some(ChangeCategory::UpgradeNotice),
                    _ => None,
                };
            } else if let Some(sc) = line.strip_prefix("scope:").map(|s| s.trim()) {
                scope = Some(sc.to_string());
            } else if !line.is_empty() {
                for cap in ticket_re.captures_iter(line) {
                    let ticket_id = cap.get(1).unwrap().as_str().to_string();
                    source_links.push(SourceLink {
                        url: format!("https://jira.example.com/browse/{}", ticket_id),
                        label: Some(ticket_id),
                        source_type: "ticket".to_string(),
                    });
                }
                content_lines.push(line);
            }
        }

        let id = format!("note-{}", notes.len() + 1);
        notes.push(ManualNote {
            id,
            title,
            content: content_lines.join("\n"),
            category,
            scope,
            source_links,
            source_file: Some(path.to_path_buf()),
        });
    }

    Ok(notes)
}

#[allow(dead_code)]
fn _parse_timestamp(s: &str) -> Option<DateTime<Utc>> {
    DateTime::parse_from_str(s, "%Y-%m-%dT%H:%M:%S%z")
        .ok()
        .map(|dt| dt.with_timezone(&Utc))
}
