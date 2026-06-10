"""reporting.py 测试：文本报告、JSON 报告、Notifier。"""
from __future__ import annotations

import json
import logging
import sys
from datetime import timedelta
from pathlib import Path

import pytest

from backup_checker.checker import BackupChecker
from backup_checker.models import (
    CheckConfig, CheckIssue, CheckResult, CheckSummary,
    IssueSeverity, IssueType, NotifyTarget, OutputFormat, Manifest,
)
from backup_checker.reporting import (
    Notifier, render_json_report, render_report, render_text_report,
)


def _make_result_with_issues(tmp_path: Path, issues, passed=True) -> CheckResult:
    cfg = CheckConfig(
        backup_dir=tmp_path / "b",
        manifest_path=tmp_path / "m.json",
        output_format=OutputFormat.TEXT,
    )
    r = CheckResult(config=cfg)
    r.manifest = Manifest(files=[])
    r.summary.passed = passed
    for i in issues:
        r.add_issue(i)
    return r


class TestTextReport:
    def test_passes_report_contains_sections(self, backup_dir: Path, good_manifest_path: Path):
        from backup_checker.models import CheckConfig, NotifyTarget, OutputFormat
        cfg = CheckConfig(
            backup_dir=backup_dir,
            manifest_path=good_manifest_path,
            hash_algorithm="sha256",
            retention_days=365,
            strict=True,
            verbose=0,
            notify=NotifyTarget.STDOUT,
            output_format=OutputFormat.TEXT,
        )
        result = BackupChecker(cfg).run_all_checks()
        text = render_text_report(result)
        assert "备份完整性检查报告" in text
        assert "【摘要】" in text
        assert "【统计】" in text
        assert "退出码 0" in text
        assert "检查通过" in text or "通过" in text

    def test_report_shows_missing_and_hash_errors(self, backup_dir: Path, bad_manifest_path: Path):
        from backup_checker.models import CheckConfig, NotifyTarget, OutputFormat
        cfg = CheckConfig(
            backup_dir=backup_dir,
            manifest_path=bad_manifest_path,
            hash_algorithm="sha256",
            retention_days=365,
            notify=NotifyTarget.STDOUT,
            output_format=OutputFormat.TEXT,
        )
        result = BackupChecker(cfg).run_all_checks()
        text = render_text_report(result)
        assert "readme.txt" in text
        assert "data/ghost-file.bin" in text
        assert "data/users.json" in text
        assert "【文件明细】" in text
        assert "【问题清单】" in text
        assert "[CRITICAL]" in text
        assert "[ERROR]" in text


class TestJsonReport:
    def test_json_schema(self, backup_dir: Path, good_manifest_path: Path, tmp_path: Path):
        from backup_checker.models import CheckConfig, NotifyTarget, OutputFormat
        cfg = CheckConfig(
            backup_dir=backup_dir,
            manifest_path=good_manifest_path,
            hash_algorithm="sha256",
            retention_days=365,
            notify=NotifyTarget.STDOUT,
            output_format=OutputFormat.JSON,
            output_path=tmp_path / "out.json",
        )
        result = BackupChecker(cfg).run_all_checks()
        text = render_json_report(result)
        data = json.loads(text)
        # 顶层字段
        for k in ("tool", "config", "manifest", "summary", "issues",
                  "file_details", "timing"):
            assert k in data, f"缺少顶层字段: {k}"
        assert data["tool"]["name"] == "backup-checker"
        assert data["tool"]["version"] == "1.0.0"
        assert isinstance(data["summary"]["passed"], bool)
        assert isinstance(data["issues"], list)
        assert isinstance(data["file_details"], list)
        # timing 字段
        assert "started_at" in data["timing"]
        assert "duration_seconds" in data["timing"]
        # 每个 issue 有必要字段
        for i in data["issues"]:
            for k in ("type", "severity", "message"):
                assert k in i

    def test_render_report_dispatch(self, backup_dir: Path, good_manifest_path: Path):
        from backup_checker.models import CheckConfig, NotifyTarget, OutputFormat
        cfg = CheckConfig(
            backup_dir=backup_dir, manifest_path=good_manifest_path,
            hash_algorithm="none", retention_days=30,
            notify=NotifyTarget.STDOUT,
        )
        result = BackupChecker(cfg).run_all_checks()
        t = render_report(result, OutputFormat.TEXT)
        j = render_report(result, OutputFormat.JSON)
        assert isinstance(t, str) and "备份完整性检查报告" in t
        # JSON 应该可以被解析
        json.loads(j)


class TestNotifier:
    def test_notify_stdout_has_issues(self, capsys, tmp_path: Path):
        r = _make_result_with_issues(tmp_path, [
            CheckIssue(type=IssueType.MISSING_FILE, severity=IssueSeverity.ERROR,
                       message="a missing"),
        ], passed=False)
        with Notifier(NotifyTarget.STDOUT) as n:
            n.notify(r)
        out, err = capsys.readouterr()
        # 有 errors 时写到 stderr
        assert "a missing" in (out + err)

    def test_notify_stderr(self, capsys, tmp_path: Path):
        r = _make_result_with_issues(tmp_path, [
            CheckIssue(type=IssueType.HASH_MISMATCH, severity=IssueSeverity.ERROR,
                       message="bad hash"),
        ], passed=False)
        with Notifier(NotifyTarget.STDERR) as n:
            n.notify(r)
        _, err = capsys.readouterr()
        assert "bad hash" in err

    def test_notify_file(self, tmp_path: Path):
        target = tmp_path / "notify.log"
        r = _make_result_with_issues(tmp_path, [
            CheckIssue(type=IssueType.MISSING_FILE, severity=IssueSeverity.ERROR,
                       message="file is gone"),
        ], passed=False)
        with Notifier(NotifyTarget.FILE, target) as n:
            n.notify(r)
        assert target.exists()
        assert "file is gone" in target.read_text(encoding="utf-8")

    def test_notify_log(self, caplog, tmp_path: Path):
        caplog.set_level(logging.WARNING, logger="backup_checker")
        r = _make_result_with_issues(tmp_path, [
            CheckIssue(type=IssueType.SIZE_MISMATCH, severity=IssueSeverity.WARNING,
                       message="size diff"),
        ])
        with Notifier(NotifyTarget.LOG) as n:
            n.notify(r)
        texts = [rec.getMessage() for rec in caplog.records]
        assert any("size diff" in t for t in texts)

    def test_notify_no_issues(self, capsys, tmp_path: Path):
        r = _make_result_with_issues(tmp_path, [])
        with Notifier(NotifyTarget.STDOUT) as n:
            n.notify(r)
        out, err = capsys.readouterr()
        assert out == "" and err == ""
