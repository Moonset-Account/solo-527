use assert_cmd::Command;
use predicates::prelude::*;
use std::path::Path;
use tempfile::TempDir;

fn create_test_repo(dir: &Path) {
    let run = |args: &[&str]| {
        std::process::Command::new("git")
            .args(args)
            .current_dir(dir)
            .output()
            .unwrap();
    };

    run(&["init", "-b", "main"]);
    run(&["config", "user.email", "test@example.com"]);
    run(&["config", "user.name", "Test User"]);

    std::fs::write(dir.join("file.txt"), "content").unwrap();
    run(&["add", "."]);
    run(&["commit", "-m", "initial commit"]);

    run(&["checkout", "-b", "feature/merged-feature"]);
    std::fs::write(dir.join("merged.txt"), "merged").unwrap();
    run(&["add", "."]);
    run(&["commit", "-m", "add merged feature"]);

    run(&["checkout", "main"]);
    run(&["merge", "feature/merged-feature"]);

    run(&["checkout", "-b", "feature/active-feature"]);
    std::fs::write(dir.join("active.txt"), "active").unwrap();
    run(&["add", "."]);
    run(&["commit", "-m", "work in progress"]);

    run(&["checkout", "-b", "bugfix/old-fix"]);
    std::fs::write(dir.join("oldfix.txt"), "old").unwrap();
    run(&["add", "."]);
    run(&["commit", "-m", "old bug fix"]);

    run(&["checkout", "main"]);
}

#[test]
fn test_scan_command_exit_code_zero() {
    let dir = TempDir::new().unwrap();
    create_test_repo(dir.path());

    let mut cmd = Command::cargo_bin("git-brclean").unwrap();
    cmd.arg("scan")
        .arg("--repo")
        .arg(dir.path())
        .arg("--format=json");

    cmd.assert().success();
}

#[test]
fn test_scan_json_output_valid() {
    let dir = TempDir::new().unwrap();
    create_test_repo(dir.path());

    let mut cmd = Command::cargo_bin("git-brclean").unwrap();
    let assert = cmd
        .arg("scan")
        .arg("--repo")
        .arg(dir.path())
        .arg("--format=json-pretty")
        .assert();

    let output = assert.get_output();
    let stdout = String::from_utf8_lossy(&output.stdout);

    let report: serde_json::Value = serde_json::from_str(&stdout)
        .expect("JSON output should be valid");

    assert!(report.get("summary").is_some());
    assert!(report.get("items").is_some());
    assert!(report.get("errors").is_some());
    assert!(report.get("version").is_some());

    let summary = report.get("summary").unwrap();
    assert!(summary.get("total_scanned").is_some());
    assert!(summary.get("dry_run").is_some());
    assert_eq!(summary["dry_run"], true);
}

#[test]
fn test_scan_finds_all_branches() {
    let dir = TempDir::new().unwrap();
    create_test_repo(dir.path());

    let mut cmd = Command::cargo_bin("git-brclean").unwrap();
    let assert = cmd
        .arg("scan")
        .arg("--repo")
        .arg(dir.path())
        .arg("--format=json")
        .assert();

    let output = assert.get_output();
    let stdout = String::from_utf8_lossy(&output.stdout);
    let report: serde_json::Value = serde_json::from_str(&stdout).unwrap();

    let total = report["summary"]["total_scanned"].as_i64().unwrap();
    assert!(total >= 3, "Expected at least 3 branches, got {}", total);

    let items = report["items"].as_array().unwrap();
    let names: Vec<&str> = items
        .iter()
        .map(|i| i["branch"]["name"].as_str().unwrap())
        .collect();

    assert!(names.contains(&"main"));
    assert!(names.contains(&"feature/merged-feature"));
    assert!(names.contains(&"feature/active-feature"));
}

#[test]
fn test_dry_run_does_not_delete() {
    let dir = TempDir::new().unwrap();
    create_test_repo(dir.path());

    let mut cmd = Command::cargo_bin("git-brclean").unwrap();
    cmd.arg("clean")
        .arg("--repo")
        .arg(dir.path())
        .arg("--dry-run")
        .arg("--no-interactive")
        .arg("--merged")
        .arg("--no-rollback")
        .arg("--format=json");

    cmd.assert().success();

    let output = std::process::Command::new("git")
        .args(["branch", "--list"])
        .current_dir(dir.path())
        .output()
        .unwrap();
    let branches = String::from_utf8_lossy(&output.stdout);
    assert!(branches.contains("feature/merged-feature"));
}

#[test]
fn test_clean_deletes_merged_branches() {
    let dir = TempDir::new().unwrap();
    create_test_repo(dir.path());

    let mut cmd = Command::cargo_bin("git-brclean").unwrap();
    cmd.arg("clean")
        .arg("--repo")
        .arg(dir.path())
        .arg("--no-dry-run")
        .arg("--no-interactive")
        .arg("--merged")
        .arg("--no-rollback")
        .arg("--min-risk=safe")
        .arg("--format=json");

    cmd.assert().success();

    let output = std::process::Command::new("git")
        .args(["branch", "--list"])
        .current_dir(dir.path())
        .output()
        .unwrap();
    let branches = String::from_utf8_lossy(&output.stdout);
    assert!(!branches.contains("feature/merged-feature"));
    assert!(branches.contains("feature/active-feature"));
    assert!(branches.contains("main"));
}

#[test]
fn test_report_has_correct_deleted_count() {
    let dir = TempDir::new().unwrap();
    create_test_repo(dir.path());

    let mut cmd = Command::cargo_bin("git-brclean").unwrap();
    let output = cmd
        .arg("clean")
        .arg("--repo")
        .arg(dir.path())
        .arg("--no-dry-run")
        .arg("--no-interactive")
        .arg("--merged")
        .arg("--no-rollback")
        .arg("--min-risk=safe")
        .arg("--format=json")
        .output()
        .unwrap();

    assert!(output.status.success());
    let stdout = String::from_utf8_lossy(&output.stdout);
    let report: serde_json::Value = serde_json::from_str(&stdout).unwrap();

    let deleted = report["summary"]["actually_deleted"].as_i64().unwrap();
    assert!(deleted >= 1, "Expected at least 1 deleted branch, got {}", deleted);
}

#[test]
fn test_exclude_pattern_works() {
    let dir = TempDir::new().unwrap();
    create_test_repo(dir.path());

    let mut cmd = Command::cargo_bin("git-brclean").unwrap();
    let assert = cmd
        .arg("scan")
        .arg("--repo")
        .arg(dir.path())
        .arg("--exclude")
        .arg("feature/*")
        .arg("--format=json")
        .assert();

    let stdout = String::from_utf8_lossy(&assert.get_output().stdout);
    let report: serde_json::Value = serde_json::from_str(&stdout).unwrap();

    let items = report["items"].as_array().unwrap();
    let kept_count = items
        .iter()
        .filter(|i| i["action"] == "keep" || i["action"] == "delete")
        .count();

    let total = report["summary"]["total_scanned"].as_i64().unwrap();
    assert!(total >= 3);
    assert!(kept_count <= total as usize);
}

#[test]
fn test_csv_output_format() {
    let dir = TempDir::new().unwrap();
    create_test_repo(dir.path());

    let mut cmd = Command::cargo_bin("git-brclean").unwrap();
    let assert = cmd
        .arg("scan")
        .arg("--repo")
        .arg(dir.path())
        .arg("--format=csv")
        .assert();

    let stdout = String::from_utf8_lossy(&assert.get_output().stdout);
    assert!(stdout.contains("分支名,类型,风险等级"));
    assert!(stdout.contains("main"));
}

#[test]
fn test_markdown_output_format() {
    let dir = TempDir::new().unwrap();
    create_test_repo(dir.path());

    let mut cmd = Command::cargo_bin("git-brclean").unwrap();
    let assert = cmd
        .arg("scan")
        .arg("--repo")
        .arg(dir.path())
        .arg("--format=markdown")
        .assert();

    let stdout = String::from_utf8_lossy(&assert.get_output().stdout);
    assert!(stdout.contains("# Git 分支清理报告"));
    assert!(stdout.contains("## 摘要"));
    assert!(stdout.contains("| 指标 | 数值 |"));
}

#[test]
fn test_output_file_option() {
    let dir = TempDir::new().unwrap();
    create_test_repo(dir.path());
    let output_file = dir.path().join("report.json");

    let mut cmd = Command::cargo_bin("git-brclean").unwrap();
    cmd.arg("scan")
        .arg("--repo")
        .arg(dir.path())
        .arg("--format=json")
        .arg("--output")
        .arg(&output_file);

    cmd.assert().success();
    assert!(output_file.exists());

    let content = std::fs::read_to_string(&output_file).unwrap();
    let report: serde_json::Value = serde_json::from_str(&content).unwrap();
    assert!(report.get("summary").is_some());
}

#[test]
fn test_human_readable_output() {
    let dir = TempDir::new().unwrap();
    create_test_repo(dir.path());

    let mut cmd = Command::cargo_bin("git-brclean").unwrap();
    let assert = cmd
        .arg("scan")
        .arg("--repo")
        .arg(dir.path())
        .arg("--format=human")
        .assert();

    let stdout = String::from_utf8_lossy(&assert.get_output().stdout);
    assert!(stdout.contains("Git 分支清理报告"));
    assert!(stdout.contains("摘要"));
    assert!(stdout.contains("扫描分支总数"));
}

#[test]
fn test_older_than_filter() {
    let dir = TempDir::new().unwrap();
    create_test_repo(dir.path());

    let mut cmd = Command::cargo_bin("git-brclean").unwrap();
    let assert = cmd
        .arg("scan")
        .arg("--repo")
        .arg(dir.path())
        .arg("--older-than=365")
        .arg("--format=json")
        .assert();

    let stdout = String::from_utf8_lossy(&assert.get_output().stdout);
    let report: serde_json::Value = serde_json::from_str(&stdout).unwrap();
    let safe_to_delete = report["summary"]["safe_to_delete"].as_i64().unwrap();
    assert_eq!(safe_to_delete, 0, "New branches should not be old enough to delete");
}

#[test]
fn test_version_flag() {
    let mut cmd = Command::cargo_bin("git-brclean").unwrap();
    cmd.arg("--version");
    cmd.assert()
        .success()
        .stdout(predicate::str::contains("git-brclean"));
}

#[test]
fn test_help_flag() {
    let mut cmd = Command::cargo_bin("git-brclean").unwrap();
    cmd.arg("--help");
    cmd.assert()
        .success()
        .stdout(predicate::str::contains("git-brclean"));
}

#[test]
fn test_invalid_repo_path() {
    let dir = TempDir::new().unwrap();
    let fake_path = dir.path().join("nonexistent");

    let mut cmd = Command::cargo_bin("git-brclean").unwrap();
    cmd.arg("scan").arg("--repo").arg(&fake_path);
    cmd.assert().failure();
}

#[test]
fn test_protected_branches_not_deleted() {
    let dir = TempDir::new().unwrap();
    create_test_repo(dir.path());

    let mut cmd = Command::cargo_bin("git-brclean").unwrap();
    let output = cmd
        .arg("clean")
        .arg("--repo")
        .arg(dir.path())
        .arg("--no-dry-run")
        .arg("--no-interactive")
        .arg("--no-rollback")
        .arg("--merged")
        .arg("--min-risk=safe")
        .arg("--format=json")
        .output()
        .unwrap();

    assert!(output.status.success());
    let stdout = String::from_utf8_lossy(&output.stdout);
    let report: serde_json::Value = serde_json::from_str(&stdout).unwrap();

    let protected = report["summary"]["protected"].as_i64().unwrap();
    assert!(protected >= 1, "Expected at least 1 protected branch");

    let items = report["items"].as_array().unwrap();
    let main_branch = items
        .iter()
        .find(|i| i["branch"]["name"] == "main")
        .unwrap();

    assert_eq!(main_branch["action"], "skip");
    assert_eq!(main_branch["branch"]["is_protected"], true);
}

#[test]
fn test_example_config_is_valid_json() {
    let config_path = Path::new(env!("CARGO_MANIFEST_DIR"))
        .join("examples")
        .join("config.json");

    assert!(config_path.exists(), "示例配置文件不存在: {}", config_path.display());

    let content = std::fs::read_to_string(&config_path).unwrap();
    let config: serde_json::Value = serde_json::from_str(&content)
        .expect("examples/config.json 应该是有效的 JSON");

    assert!(config.get("dry_run").is_some());
    assert!(config.get("protection_rules").is_some());
    assert!(config.get("min_risk_level").is_some());
}

#[test]
fn test_config_file_flag_loads_config() {
    let dir = TempDir::new().unwrap();
    create_test_repo(dir.path());

    let config_path = dir.path().join("custom-config.json");
    let config_json = r#"{
        "repo_path": ".",
        "dry_run": true,
        "merged_only": false,
        "older_than_days": null,
        "exclude_patterns": ["custom-exclude/*"],
        "include_remote": false,
        "remote_name": "origin",
        "default_branch": "main",
        "protection_rules": [
            {"pattern": "main", "reason": "default"},
            {"pattern": "master", "reason": "default"},
            {"pattern": "custom-protected", "reason": "custom rule"}
        ],
        "min_risk_level": "high",
        "interactive": false,
        "format": "json",
        "output_file": null,
        "log_dir": null,
        "rollback_enabled": true,
        "pr_source": null,
        "pr_api_url": null,
        "pr_token": null,
        "max_concurrent": 2
    }"#;
    std::fs::write(&config_path, config_json).unwrap();

    let mut cmd = Command::cargo_bin("git-brclean").unwrap();
    let output = cmd
        .arg("scan")
        .arg("--repo")
        .arg(dir.path())
        .arg("--config")
        .arg(&config_path)
        .arg("--format=json")
        .output()
        .unwrap();

    assert!(output.status.success(), "命令应该成功执行");

    let stdout = String::from_utf8_lossy(&output.stdout);
    let report: serde_json::Value = serde_json::from_str(&stdout).unwrap();

    let protected_count = report["summary"]["protected"].as_i64().unwrap();
    assert!(
        protected_count >= 1,
        "配置文件中定义的保护规则应该生效，保护分支数: {}",
        protected_count
    );
}

#[test]
fn test_cli_args_override_config_file() {
    let dir = TempDir::new().unwrap();
    create_test_repo(dir.path());

    let config_path = dir.path().join("override-config.json");
    let config_json = r#"{
        "repo_path": ".",
        "dry_run": true,
        "merged_only": false,
        "older_than_days": null,
        "exclude_patterns": [],
        "include_remote": false,
        "remote_name": "origin",
        "default_branch": "main",
        "protection_rules": [
            {"pattern": "main", "reason": "default"}
        ],
        "min_risk_level": "safe",
        "interactive": false,
        "format": "human",
        "output_file": null,
        "log_dir": null,
        "rollback_enabled": true,
        "pr_source": null,
        "pr_api_url": null,
        "pr_token": null,
        "max_concurrent": 4
    }"#;
    std::fs::write(&config_path, config_json).unwrap();

    let mut cmd = Command::cargo_bin("git-brclean").unwrap();
    let output = cmd
        .arg("scan")
        .arg("--repo")
        .arg(dir.path())
        .arg("--config")
        .arg(&config_path)
        .arg("--format=json")
        .arg("--older-than=365")
        .output()
        .unwrap();

    assert!(output.status.success(), "命令应该成功执行");

    let stdout = String::from_utf8_lossy(&output.stdout);
    let report: serde_json::Value = serde_json::from_str(&stdout).unwrap();

    let safe_to_delete = report["summary"]["safe_to_delete"].as_i64().unwrap();
    assert_eq!(
        safe_to_delete, 0,
        "CLI 参数 --older-than=365 应该覆盖配置文件，新分支不应被删除"
    );
}

#[test]
fn test_invalid_config_file_returns_error() {
    let dir = TempDir::new().unwrap();
    create_test_repo(dir.path());

    let bad_config = dir.path().join("bad.json");
    std::fs::write(&bad_config, "not valid json {").unwrap();

    let mut cmd = Command::cargo_bin("git-brclean").unwrap();
    cmd.arg("scan")
        .arg("--repo")
        .arg(dir.path())
        .arg("--config")
        .arg(&bad_config);

    cmd.assert().failure();
}

#[test]
fn test_config_file_format_not_overridden_by_default() {
    let dir = TempDir::new().unwrap();
    create_test_repo(dir.path());

    let config_path = dir.path().join("format-config.json");
    let config_json = r#"{
        "repo_path": ".",
        "dry_run": true,
        "merged_only": false,
        "older_than_days": null,
        "exclude_patterns": [],
        "include_remote": false,
        "remote_name": "origin",
        "default_branch": "main",
        "protection_rules": [
            {"pattern": "main", "reason": "default"}
        ],
        "min_risk_level": "medium",
        "interactive": false,
        "format": "csv",
        "output_file": null,
        "log_dir": null,
        "rollback_enabled": true,
        "pr_source": null,
        "pr_api_url": null,
        "pr_token": null,
        "max_concurrent": 4
    }"#;
    std::fs::write(&config_path, config_json).unwrap();

    let mut cmd = Command::cargo_bin("git-brclean").unwrap();
    let output = cmd
        .arg("scan")
        .arg("--repo")
        .arg(dir.path())
        .arg("--config")
        .arg(&config_path)
        .output()
        .unwrap();

    assert!(output.status.success());
    let stdout = String::from_utf8_lossy(&output.stdout);
    assert!(
        stdout.starts_with("分支名,类型,风险等级,"),
        "配置文件指定 format=csv，输出应该是 CSV 格式。实际输出开头: {}",
        stdout.lines().next().unwrap_or("")
    );
}

#[test]
fn test_cli_explicit_format_overrides_config_file() {
    let dir = TempDir::new().unwrap();
    create_test_repo(dir.path());

    let config_path = dir.path().join("format-config.json");
    let config_json = r#"{
        "repo_path": ".",
        "dry_run": true,
        "merged_only": false,
        "older_than_days": null,
        "exclude_patterns": [],
        "include_remote": false,
        "remote_name": "origin",
        "default_branch": "main",
        "protection_rules": [
            {"pattern": "main", "reason": "default"}
        ],
        "min_risk_level": "medium",
        "interactive": false,
        "format": "csv",
        "output_file": null,
        "log_dir": null,
        "rollback_enabled": true,
        "pr_source": null,
        "pr_api_url": null,
        "pr_token": null,
        "max_concurrent": 4
    }"#;
    std::fs::write(&config_path, config_json).unwrap();

    let mut cmd = Command::cargo_bin("git-brclean").unwrap();
    let output = cmd
        .arg("scan")
        .arg("--repo")
        .arg(dir.path())
        .arg("--config")
        .arg(&config_path)
        .arg("--format=json")
        .output()
        .unwrap();

    assert!(output.status.success());
    let stdout = String::from_utf8_lossy(&output.stdout);
    let result: Result<serde_json::Value, _> = serde_json::from_str(&stdout);
    assert!(
        result.is_ok(),
        "CLI 显式指定 --format=json 应该覆盖配置文件的 csv，输出应该是 JSON 格式。错误: {:?}",
        result.err()
    );
}

#[test]
fn test_config_file_dry_run_not_overridden_by_default() {
    let dir = TempDir::new().unwrap();
    create_test_repo(dir.path());

    let config_path = dir.path().join("dryrun-config.json");
    let config_json = r#"{
        "repo_path": ".",
        "dry_run": false,
        "merged_only": true,
        "older_than_days": null,
        "exclude_patterns": [],
        "include_remote": false,
        "remote_name": "origin",
        "default_branch": "main",
        "protection_rules": [
            {"pattern": "main", "reason": "default"}
        ],
        "min_risk_level": "medium",
        "interactive": false,
        "format": "json",
        "output_file": null,
        "log_dir": null,
        "rollback_enabled": false,
        "pr_source": null,
        "pr_api_url": null,
        "pr_token": null,
        "max_concurrent": 4
    }"#;
    std::fs::write(&config_path, config_json).unwrap();

    let mut cmd = Command::cargo_bin("git-brclean").unwrap();
    let output = cmd
        .arg("clean")
        .arg("--repo")
        .arg(dir.path())
        .arg("--config")
        .arg(&config_path)
        .arg("--no-interactive")
        .arg("--min-risk=safe")
        .output()
        .unwrap();

    assert!(output.status.success());
    let stdout = String::from_utf8_lossy(&output.stdout);
    let report: serde_json::Value = serde_json::from_str(&stdout).unwrap();

    assert!(
        report["summary"]["actually_deleted"].as_i64().unwrap() > 0,
        "配置文件指定 dry_run=false，应该真正删除合并的分支。删除数量: {}",
        report["summary"]["actually_deleted"]
    );
}

#[test]
fn test_scan_supports_pr_args() {
    let dir = TempDir::new().unwrap();
    create_test_repo(dir.path());

    let mut cmd = Command::cargo_bin("git-brclean").unwrap();
    let assert = cmd
        .arg("scan")
        .arg("--repo")
        .arg(dir.path())
        .arg("--pr-source=git-hub")
        .arg("--pr-api-url=https://api.github.com")
        .arg("--pr-token=test-token")
        .arg("--format=json")
        .assert();

    assert.success();
}

#[test]
fn test_pr_config_from_file_used() {
    let dir = TempDir::new().unwrap();
    create_test_repo(dir.path());

    let config_path = dir.path().join("pr-config.json");
    let config_json = r#"{
        "repo_path": ".",
        "dry_run": true,
        "merged_only": false,
        "older_than_days": null,
        "exclude_patterns": [],
        "include_remote": false,
        "remote_name": "origin",
        "default_branch": "main",
        "protection_rules": [
            {"pattern": "main", "reason": "default"}
        ],
        "min_risk_level": "medium",
        "interactive": false,
        "format": "json",
        "output_file": null,
        "log_dir": null,
        "rollback_enabled": true,
        "pr_source": "github",
        "pr_api_url": "https://api.github.com",
        "pr_token": "test-token-from-config",
        "max_concurrent": 4
    }"#;
    std::fs::write(&config_path, config_json).unwrap();

    let mut cmd = Command::cargo_bin("git-brclean").unwrap();
    let output = cmd
        .arg("scan")
        .arg("--repo")
        .arg(dir.path())
        .arg("--config")
        .arg(&config_path)
        .output()
        .unwrap();

    assert!(
        output.status.success(),
        "PR 配置从配置文件加载，命令应该成功执行。stderr: {}",
        String::from_utf8_lossy(&output.stderr)
    );
}

#[test]
fn test_cli_pr_args_override_config_file() {
    let dir = TempDir::new().unwrap();
    create_test_repo(dir.path());

    let config_path = dir.path().join("pr-config.json");
    let config_json = r#"{
        "repo_path": ".",
        "dry_run": true,
        "merged_only": false,
        "older_than_days": null,
        "exclude_patterns": [],
        "include_remote": false,
        "remote_name": "origin",
        "default_branch": "main",
        "protection_rules": [
            {"pattern": "main", "reason": "default"}
        ],
        "min_risk_level": "medium",
        "interactive": false,
        "format": "json",
        "output_file": null,
        "log_dir": null,
        "rollback_enabled": true,
        "pr_source": "github",
        "pr_api_url": "https://api.github.com",
        "pr_token": "config-token",
        "max_concurrent": 4
    }"#;
    std::fs::write(&config_path, config_json).unwrap();

    let mut cmd = Command::cargo_bin("git-brclean").unwrap();
    let output = cmd
        .arg("scan")
        .arg("--repo")
        .arg(dir.path())
        .arg("--config")
        .arg(&config_path)
        .arg("--pr-source=git-lab")
        .arg("--pr-api-url=https://gitlab.com/api/v4")
        .arg("--pr-token=cli-token")
        .output()
        .unwrap();

    assert!(
        output.status.success(),
        "CLI PR 参数应该覆盖配置文件。stderr: {}",
        String::from_utf8_lossy(&output.stderr)
    );
}

fn create_test_repo_with_merged_branch(path: &Path) {
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

    run(&["checkout", "-b", "feature/merged"]);
    std::fs::write(path.join("merged.txt"), "merged").unwrap();
    run(&["add", "."]);
    run(&["commit", "-m", "merged feature"]);

    run(&["checkout", "main"]);
    run(&["merge", "feature/merged"]);
}

#[test]
fn test_cli_dry_run_explicit_overrides_config() {
    let dir = TempDir::new().unwrap();
    create_test_repo_with_merged_branch(dir.path());

    let config_path = dir.path().join("dryrun-config.json");
    let config_json = r#"{
        "repo_path": ".",
        "dry_run": false,
        "merged_only": true,
        "older_than_days": null,
        "exclude_patterns": [],
        "include_remote": false,
        "remote_name": "origin",
        "default_branch": "main",
        "protection_rules": [
            {"pattern": "main", "reason": "default"}
        ],
        "min_risk_level": "medium",
        "interactive": false,
        "format": "json",
        "output_file": null,
        "log_dir": null,
        "rollback_enabled": false,
        "pr_source": null,
        "pr_api_url": null,
        "pr_token": null,
        "max_concurrent": 4
    }"#;
    std::fs::write(&config_path, config_json).unwrap();

    let mut cmd = Command::cargo_bin("git-brclean").unwrap();
    let output = cmd
        .arg("clean")
        .arg("--repo")
        .arg(dir.path())
        .arg("--config")
        .arg(&config_path)
        .arg("--no-interactive")
        .arg("--dry-run")
        .arg("--min-risk=safe")
        .output()
        .unwrap();

    assert!(output.status.success());
    let stdout = String::from_utf8_lossy(&output.stdout);
    let report: serde_json::Value = serde_json::from_str(&stdout).unwrap();

    assert_eq!(
        report["summary"]["actually_deleted"].as_i64().unwrap(),
        0,
        "CLI 显式指定 --dry-run 应该覆盖配置文件的 dry_run=false，不应该真正删除分支。删除数量: {}",
        report["summary"]["actually_deleted"]
    );
}
