use assert_cmd::Command;
use predicates::prelude::*;
use std::fs;
use tempfile::TempDir;

fn bin() -> Command {
    Command::cargo_bin("note2task").unwrap()
}

fn fixture_content() -> &'static str {
    "## 测试项目A\n\
     - [ ] 任务一 #tag1 @due(2025-06-15) !1\n\
     - [x] 已完成任务 #tag2 @due(2025-06-10)\n\
     ## 测试项目B\n\
     - [ ] 任务二 #tag1 #urgent @due(2025-06-20) !2\n\
     - [/] 进行中任务 #tag3\n"
}

fn setup_fixture_dir() -> TempDir {
    let dir = TempDir::new().unwrap();
    fs::write(dir.path().join("notes.md"), fixture_content()).unwrap();
    fs::create_dir(dir.path().join("sub")).unwrap();
    fs::write(
        dir.path().join("sub").join("more.md"),
        "- [ ] 子目录任务 @due(today)\n",
    )
    .unwrap();
    dir
}

mod help_and_version {
    use super::*;

    #[test]
    fn test_help_flag() {
        let assert = bin()
            .arg("--help")
            .assert()
            .success();

        let stdout = String::from_utf8(assert.get_output().stdout.clone()).unwrap();
        assert!(
            stdout.contains("Markdown") || stdout.contains("笔记"),
            "help 应包含工具描述"
        );
        assert!(stdout.contains("scan"), "help 应包含 scan 子命令");
        assert!(stdout.contains("completion"), "help 应包含 completions 子命令");
        assert!(
            stdout.contains("verbose") || stdout.contains("VERBOSE"),
            "help 应包含 verbose 选项. stdout: {}",
            stdout
        );
    }

    #[test]
    fn test_version_flag() {
        bin()
            .arg("--version")
            .assert()
            .success()
            .stdout(predicate::str::contains("note2task"));
    }

    #[test]
    fn test_scan_subcommand_help() {
        bin()
            .args(&["scan", "--help"])
            .assert()
            .success()
            .stdout(predicate::str::contains("--from"))
            .stdout(predicate::str::contains("--dry-run"))
            .stdout(predicate::str::contains("--export"));
    }
}

mod dry_run_tests {
    use super::*;

    #[test]
    fn test_dry_run_does_not_write_file() {
        let dir = setup_fixture_dir();
        let output_file = dir.path().join("output.json");

        bin()
            .args(&[
                "scan",
                "--from",
                &dir.path().to_string_lossy(),
                "--export",
                &format!("json:{}", output_file.display()),
                "--dry-run",
                "-v",
            ])
            .assert()
            .success()
            .stderr(predicate::str::contains("[dry-run]"));

        assert!(
            !output_file.exists(),
            "dry-run 模式下不应创建输出文件"
        );
    }

    #[test]
    fn test_dry_run_still_outputs_to_stdout() {
        let dir = setup_fixture_dir();
        bin()
            .args(&[
                "scan",
                "--from",
                &dir.path().to_string_lossy(),
                "--dry-run",
            ])
            .assert()
            .success()
            .stdout(predicate::str::contains("任务一"))
            .stdout(predicate::str::contains("[dry-run]"));
    }

    #[test]
    fn test_dry_run_shows_correct_summary() {
        let dir = setup_fixture_dir();
        bin()
            .args(&[
                "-v",
                "scan",
                "--from",
                &dir.path().to_string_lossy(),
                "--export",
                "md:out.md",
                "--dry-run",
                "--today",
                "2025-06-10",
            ])
            .assert()
            .success()
            .stderr(predicate::str::contains("dry-run").or(predicate::str::contains("[dry-run]")));
    }
}

mod error_input_tests {
    use super::*;

    #[test]
    fn test_nonexistent_path() {
        bin()
            .args(&["scan", "--from", "/nonexistent/path/xyz123"])
            .assert()
            .failure()
            .code(predicate::eq(2))
            .stderr(predicate::str::contains("无效")
                .or(predicate::str::contains("路径"))
                .or(predicate::str::contains("error")));
    }

    #[test]
    fn test_invalid_export_format() {
        let dir = setup_fixture_dir();
        bin()
            .args(&[
                "scan",
                "--from",
                &dir.path().to_string_lossy(),
                "--export",
                "xml",
            ])
            .assert()
            .failure()
            .code(predicate::eq(6));
    }

    #[test]
    fn test_invalid_due_date_format() {
        let dir = setup_fixture_dir();
        bin()
            .args(&[
                "scan",
                "--from",
                &dir.path().to_string_lossy(),
                "--due",
                "not-a-date",
            ])
            .assert()
            .failure()
            .code(predicate::eq(4));
    }

    #[test]
    fn test_invalid_today_override() {
        let dir = setup_fixture_dir();
        bin()
            .args(&[
                "scan",
                "--from",
                &dir.path().to_string_lossy(),
                "--today",
                "bad-date",
            ])
            .assert()
            .failure()
            .code(predicate::eq(4));
    }

    #[test]
    fn test_invalid_priority_range() {
        let dir = setup_fixture_dir();
        bin()
            .args(&[
                "scan",
                "--from",
                &dir.path().to_string_lossy(),
                "--priority",
                "9",
            ])
            .assert()
            .failure();
    }

    #[test]
    fn test_no_command_prints_help() {
        let assert = bin()
            .assert()
            .failure()
            .code(predicate::eq(2));

        let output = assert.get_output();
        let combined = format!(
            "{}{}",
            String::from_utf8_lossy(&output.stdout),
            String::from_utf8_lossy(&output.stderr)
        );
        assert!(
            combined.contains("Usage") || combined.contains("usage") || combined.contains("子命令") || combined.contains("命令"),
            "没有命令时应提示用法。输出: {}",
            combined
        );
    }

    #[test]
    fn test_non_markdown_file_gives_error() {
        let dir = TempDir::new().unwrap();
        let txt = dir.path().join("readme.txt");
        fs::write(&txt, "hello").unwrap();
        bin()
            .args(&["scan", "--from", &txt.to_string_lossy()])
            .assert()
            .failure()
            .code(predicate::eq(3));
    }
}

mod json_output_tests {
    use super::*;

    #[test]
    fn test_json_output_is_valid() {
        let dir = setup_fixture_dir();
        let assert = bin()
            .args(&[
                "scan",
                "--from",
                &dir.path().to_string_lossy(),
                "--export",
                "json",
                "--today",
                "2025-06-10",
            ])
            .assert()
            .success();

        let stdout = String::from_utf8(assert.get_output().stdout.clone()).unwrap();
        let v: serde_json::Value =
            serde_json::from_str(&stdout).expect("JSON 输出应该是有效的");

        assert!(v.get("summary").is_some(), "JSON 应包含 summary");
        assert!(v.get("items").is_some(), "JSON 应包含 items");
        assert!(v.get("files_scanned").is_some(), "JSON 应包含 files_scanned");
        assert!(v.get("generated_at").is_some());

        let items = v.get("items").unwrap().as_array().unwrap();
        assert!(!items.is_empty(), "应至少解析出一条任务");

        let first = &items[0];
        assert!(first.get("id").is_some());
        assert!(first.get("content").is_some());
        assert!(first.get("status").is_some());
        assert!(first.get("status_symbol").is_some());
        assert!(first.get("tags").is_some());
        assert!(first.get("source").is_some());
    }

    #[test]
    fn test_json_export_to_file() {
        let dir = setup_fixture_dir();
        let output = dir.path().join("result.json");

        bin()
            .args(&[
                "scan",
                "--from",
                &dir.path().to_string_lossy(),
                "--export",
                &format!("json:{}", output.display()),
                "--today",
                "2025-06-10",
            ])
            .assert()
            .success();

        assert!(output.exists(), "JSON 文件应被创建");
        let content = fs::read_to_string(&output).unwrap();
        let v: serde_json::Value = serde_json::from_str(&content).unwrap();
        assert!(v.get("summary").unwrap().get("total_parsed").unwrap()
            .as_i64()
            .unwrap()
            >= 4);
    }

    #[test]
    fn test_json_dedup_count() {
        let dir = TempDir::new().unwrap();
        fs::write(
            dir.path().join("dup.md"),
            "## P\n\
             - [ ] 重复任务 A @due(2025-06-15)\n\
             - [ ] 重复任务 A @due(2025-06-15)\n\
             - [ ] 重复任务 A @due(2025-06-15)\n\
             - [ ] 不同任务 B\n",
        )
        .unwrap();

        let assert = bin()
            .args(&[
                "scan",
                "--from",
                &dir.path().to_string_lossy(),
                "--export",
                "json",
                "--today",
                "2025-06-10",
            ])
            .assert()
            .success();

        let stdout = String::from_utf8(assert.get_output().stdout.clone()).unwrap();
        let v: serde_json::Value = serde_json::from_str(&stdout).unwrap();
        let summary = v.get("summary").unwrap();
        assert_eq!(summary.get("total_parsed").unwrap().as_i64().unwrap(), 4);
        assert_eq!(
            summary.get("duplicates_removed").unwrap().as_i64().unwrap(),
            2
        );
        assert_eq!(
            summary.get("total_after_dedup").unwrap().as_i64().unwrap(),
            2
        );
    }

    #[test]
    fn test_json_filter_by_tag() {
        let dir = setup_fixture_dir();
        let assert = bin()
            .args(&[
                "scan",
                "--from",
                &dir.path().to_string_lossy(),
                "--tag",
                "tag1",
                "--export",
                "json",
                "--today",
                "2025-06-10",
            ])
            .assert()
            .success();

        let stdout = String::from_utf8(assert.get_output().stdout.clone()).unwrap();
        let v: serde_json::Value = serde_json::from_str(&stdout).unwrap();
        let items = v.get("items").unwrap().as_array().unwrap();
        assert_eq!(items.len(), 2, "tag1 应该匹配两个任务");
        for it in items {
            let tags: Vec<&str> = it
                .get("tags")
                .unwrap()
                .as_array()
                .unwrap()
                .iter()
                .map(|x| x.as_str().unwrap())
                .collect();
            assert!(tags.contains(&"tag1"));
        }
    }

    #[test]
    fn test_json_filter_by_status() {
        let dir = setup_fixture_dir();
        let assert = bin()
            .args(&[
                "scan",
                "--from",
                &dir.path().to_string_lossy(),
                "--status",
                "done",
                "--export",
                "json",
                "--today",
                "2025-06-10",
            ])
            .assert()
            .success();

        let stdout = String::from_utf8(assert.get_output().stdout.clone()).unwrap();
        let v: serde_json::Value = serde_json::from_str(&stdout).unwrap();
        let items = v.get("items").unwrap().as_array().unwrap();
        assert_eq!(items.len(), 1);
        assert_eq!(items[0].get("status_symbol").unwrap(), "x");
    }
}

mod shell_completions_tests {
    use super::*;

    #[test]
    fn test_bash_completions() {
        bin()
            .args(&["completions", "bash"])
            .assert()
            .success()
            .stdout(predicate::str::contains("_note2task"));
    }

    #[test]
    fn test_zsh_completions() {
        bin()
            .args(&["completions", "zsh"])
            .assert()
            .success()
            .stdout(predicate::str::contains("#compdef"));
    }

    #[test]
    fn test_fish_completions() {
        bin()
            .args(&["completions", "fish"])
            .assert()
            .success()
            .stdout(predicate::str::contains("complete"));
    }
}

mod cross_platform_path {
    use super::*;

    #[test]
    fn test_multiple_sources() {
        let dir = setup_fixture_dir();
        let f1 = dir.path().join("notes.md");
        let f2 = dir.path().join("sub").join("more.md");

        bin()
            .args(&[
                "scan",
                "--from",
                &f1.to_string_lossy(),
                &f2.to_string_lossy(),
                "--today",
                "2025-06-10",
            ])
            .assert()
            .success()
            .stdout(predicate::str::contains("任务一").and(predicate::str::contains("子目录任务")));
    }

    #[test]
    fn test_relative_paths_work() {
        // 用 CWD 来测试相对路径
        let dir = setup_fixture_dir();
        let cwd = std::env::current_dir().unwrap();

        std::env::set_current_dir(&dir).unwrap();
        let result = bin()
            .args(&["scan", "--from", ".", "--today", "2025-06-10"])
            .assert()
            .try_success();
        std::env::set_current_dir(&cwd).unwrap();

        let assert = result.unwrap();
        assert.stdout(predicate::str::contains("任务一"));
    }
}

mod logging_and_exit_codes {
    use super::*;

    #[test]
    fn test_verbose_flag_enables_info() {
        let dir = setup_fixture_dir();
        bin()
            .args(&[
                "-vv",
                "scan",
                "--from",
                &dir.path().to_string_lossy(),
                "--today",
                "2025-06-10",
            ])
            .assert()
            .success()
            .stderr(predicate::str::contains("[INFO")
                .or(predicate::str::contains("[DEBUG")));
    }

    #[test]
    fn test_success_exit_code() {
        let dir = setup_fixture_dir();
        bin()
            .args(&[
                "scan",
                "--from",
                &dir.path().to_string_lossy(),
                "--today",
                "2025-06-10",
            ])
            .assert()
            .success()
            .code(predicate::eq(0));
    }

    #[test]
    fn test_quiet_mode_no_info() {
        let dir = setup_fixture_dir();
        let assert = bin()
            .args(&[
                "--quiet",
                "scan",
                "--from",
                &dir.path().to_string_lossy(),
                "--today",
                "2025-06-10",
            ])
            .assert()
            .success();
        let stderr = String::from_utf8(assert.get_output().stderr.clone()).unwrap();
        assert!(!stderr.contains("[INFO"), "quiet 模式不应有 INFO 日志");
    }
}
