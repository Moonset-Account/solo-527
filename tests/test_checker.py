"""checker.py 核心检查器测试：缺失、哈希、大小、过期、跨平台路径。"""
from __future__ import annotations

import json
from datetime import datetime, timedelta, timezone
from pathlib import Path

import pytest

from backup_checker.checker import BackupChecker
from backup_checker.models import (
    CheckConfig,
    CheckIssue,
    IssueSeverity,
    IssueType,
    NotifyTarget,
    OutputFormat,
)


def _make_config(backup_dir: Path, manifest_path: Path, **overrides) -> CheckConfig:
    kwargs = dict(
        backup_dir=backup_dir,
        manifest_path=manifest_path,
        hash_algorithm="sha256",
        retention_days=None,
        dry_run=False,
        strict=True,
        verbose=0,
        quiet=False,
        notify=NotifyTarget.STDOUT,
        notify_target=None,
        output_format=OutputFormat.TEXT,
        output_path=None,
    )
    kwargs.update(overrides)
    return CheckConfig(**kwargs)


class TestBackupCheckerBasics:
    def test_all_pass(self, backup_dir: Path, good_manifest_path: Path):
        cfg = _make_config(backup_dir, good_manifest_path,
                           retention_days=365, verbose=0)
        checker = BackupChecker(cfg)
        result = checker.run_all_checks()
        assert result.summary.passed is True
        assert result.summary.total_files == 4
        assert result.summary.missing_files == 0
        assert result.summary.hash_mismatches == 0
        assert result.summary.size_mismatches == 0
        assert result.summary.expired is False
        assert result.summary.errors_count == 0
        assert result.exit_code() == 0
        # file_details 中所有文件应当存在且被检查
        for d in result.file_details:
            assert d["exists"] is True
            assert d["checked"] is True
            assert d["actual_hash"] == d["expected_hash"]

    def test_backup_dir_not_found(self, tmp_path: Path, good_manifest_path: Path):
        cfg = _make_config(tmp_path / "nope", good_manifest_path)
        result = BackupChecker(cfg).run_all_checks()
        assert any(i.type == IssueType.MANIFEST_ERROR
                   and i.severity == IssueSeverity.CRITICAL
                   for i in result.issues)
        assert result.exit_code() == 1

    def test_missing_manifest(self, backup_dir: Path):
        cfg = _make_config(backup_dir, None)
        result = BackupChecker(cfg).run_all_checks()
        assert any(i.type == IssueType.MANIFEST_ERROR for i in result.issues)
        assert result.exit_code() == 1

    def test_missing_manifest_path(self, backup_dir: Path, tmp_path: Path):
        cfg = _make_config(backup_dir, tmp_path / "no.json")
        result = BackupChecker(cfg).run_all_checks()
        assert any(i.type == IssueType.MANIFEST_ERROR for i in result.issues)
        assert result.exit_code() == 1


class TestMissingFile:
    def test_detect_missing(self, backup_dir: Path, bad_manifest_path: Path):
        cfg = _make_config(backup_dir, bad_manifest_path)
        result = BackupChecker(cfg).run_all_checks()
        assert result.summary.missing_files == 1
        missing = [i for i in result.issues if i.type == IssueType.MISSING_FILE]
        assert len(missing) == 1
        assert missing[0].file_path == "data/ghost-file.bin"
        # 定位信息存在
        assert missing[0].location is not None
        assert result.exit_code() == 5  # 有多个问题


class TestHashAndSize:
    def test_detect_hash_mismatch(self, backup_dir: Path, bad_manifest_path: Path):
        cfg = _make_config(backup_dir, bad_manifest_path)
        result = BackupChecker(cfg).run_all_checks()
        assert result.summary.hash_mismatches == 1
        bad = [i for i in result.issues if i.type == IssueType.HASH_MISMATCH]
        assert len(bad) == 1
        assert bad[0].severity == IssueSeverity.CRITICAL
        assert bad[0].file_path == "readme.txt"
        assert bad[0].expected == "deadbeef" * 8
        assert bad[0].actual is not None and bad[0].actual != bad[0].expected

    def test_detect_size_mismatch(self, backup_dir: Path, bad_manifest_path: Path):
        cfg = _make_config(backup_dir, bad_manifest_path)
        result = BackupChecker(cfg).run_all_checks()
        assert result.summary.size_mismatches == 1
        bad = [i for i in result.issues if i.type == IssueType.SIZE_MISMATCH]
        assert len(bad) == 1
        assert bad[0].file_path == "data/users.json"

    def test_hash_none_skips(self, backup_dir: Path, bad_manifest_path: Path):
        # hash=none 时，即使哈希写坏也不应报 HASH_MISMATCH（但 SIZE 仍会）
        cfg = _make_config(backup_dir, bad_manifest_path, hash_algorithm="none")
        result = BackupChecker(cfg).run_all_checks()
        assert result.summary.hash_mismatches == 0
        assert not any(i.type == IssueType.HASH_MISMATCH for i in result.issues)
        # 大小和缺失仍应被检测
        assert result.summary.size_mismatches == 1
        assert result.summary.missing_files == 1

    def test_unsupported_hash_aborts(self, backup_dir: Path, good_manifest_path: Path):
        # 通过配置设置不支持的算法（CLI 层本会拦截，但直接调用仍应安全）
        cfg = _make_config(backup_dir, good_manifest_path, hash_algorithm="crc32")
        result = BackupChecker(cfg).run_all_checks()
        assert any(i.type == IssueType.MANIFEST_ERROR for i in result.issues)
        assert result.exit_code() == 1

    def test_file_read_error(self, backup_dir: Path, good_manifest_path: Path, monkeypatch):
        # 模拟文件读失败
        from backup_checker import checker as chk_mod
        orig = chk_mod.compute_file_hash

        def fake(path, algo, **_):
            if path.name == "readme.txt":
                raise PermissionError("denied")
            return orig(path, algo)

        monkeypatch.setattr(chk_mod, "compute_file_hash", fake)
        cfg = _make_config(backup_dir, good_manifest_path)
        result = BackupChecker(cfg).run_all_checks()
        read_errs = [i for i in result.issues if i.type == IssueType.READ_ERROR]
        assert len(read_errs) >= 1


class TestRetention:
    def test_detect_expired(self, backup_dir: Path, expired_manifest_path: Path):
        cfg = _make_config(backup_dir, expired_manifest_path)
        result = BackupChecker(cfg).run_all_checks()
        assert result.summary.expired is True
        expired_issues = [i for i in result.issues if i.type == IssueType.EXPIRED_BACKUP
                          and i.severity == IssueSeverity.ERROR]
        assert len(expired_issues) == 1
        # 退出码：有哈希通过，只有过期 -> 4
        assert result.exit_code() == 4

    def test_retention_override(self, backup_dir: Path, expired_manifest_path: Path):
        # CLI 指定 retention=999d，覆盖清单中的 30d，因此不会过期
        cfg = _make_config(backup_dir, expired_manifest_path, retention_days=999)
        result = BackupChecker(cfg).run_all_checks()
        assert result.summary.expired is False
        errors = [i for i in result.issues
                  if i.type == IssueType.EXPIRED_BACKUP and i.severity in (IssueSeverity.ERROR, IssueSeverity.CRITICAL)]
        assert len(errors) == 0
        assert result.exit_code() == 0

    def test_no_retention_warning(self, backup_dir: Path, good_manifest_path: Path):
        # 将清单中的 retention_days 清零
        data = json.loads(good_manifest_path.read_text(encoding="utf-8"))
        del data["retention_days"]
        p = good_manifest_path.with_name("no-ret.json")
        p.write_text(json.dumps(data), encoding="utf-8")
        cfg = _make_config(backup_dir, p)
        result = BackupChecker(cfg).run_all_checks()
        warnings = [i for i in result.issues if i.type == IssueType.EXPIRED_BACKUP]
        assert any(i.severity == IssueSeverity.WARNING for i in warnings)


class TestDryRun:
    def test_dry_run_skips_hash(self, backup_dir: Path, bad_manifest_path: Path):
        # dry-run 模式下，哈希错不会被检测（因为没算），但缺失/大小仍检测
        cfg = _make_config(backup_dir, bad_manifest_path, dry_run=True)
        result = BackupChecker(cfg).run_all_checks()
        assert result.summary.hash_mismatches == 0
        assert not any(i.type == IssueType.HASH_MISMATCH for i in result.issues)
        # file_details 应当标记 hash_skipped
        assert any(d.get("hash_skipped") for d in result.file_details)
        # 缺失和大小仍会被检测
        assert result.summary.missing_files == 1
        assert result.summary.size_mismatches == 1


class TestStrictMode:
    def test_strict_fails_on_warning(self, backup_dir: Path, tmp_path: Path):
        # 制造只有 WARNING 的场景：清单中未提供 sha256 哈希
        data = json.loads(good_manifest_data_without_sha256(backup_dir, tmp_path))
        p = tmp_path / "w.json"
        p.write_text(json.dumps(data), encoding="utf-8")
        cfg = _make_config(backup_dir, p, strict=True, verbose=0, hash_algorithm="sha256")
        result = BackupChecker(cfg).run_all_checks()
        # strict 模式：WARNING 也导致 passed=False
        assert result.summary.passed is False

    def test_no_strict_passes_warnings(self, backup_dir: Path, tmp_path: Path):
        data = json.loads(good_manifest_data_without_sha256(backup_dir, tmp_path))
        p = tmp_path / "w.json"
        p.write_text(json.dumps(data), encoding="utf-8")
        cfg = _make_config(backup_dir, p, strict=False, verbose=0, hash_algorithm="sha256")
        result = BackupChecker(cfg).run_all_checks()
        # no-strict：WARNING 不影响 passed
        assert result.summary.passed is True


# 辅助函数
def good_manifest_data_without_sha256(backup_dir: Path, tmp_path: Path) -> str:
    from backup_checker.utils import compute_file_hash
    files = []
    for p in sorted(backup_dir.rglob("*")):
        if not p.is_file():
            continue
        rel = p.relative_to(backup_dir).as_posix()
        raw = p.read_bytes()
        # 故意不提供 sha256，只提供 md5
        files.append({
            "path": rel,
            "size": p.stat().st_size,
            "modified": datetime.now(timezone.utc).isoformat(),
            "hashes": {"md5": compute_file_hash(p, "md5")},
        })
    return json.dumps({
        "version": "1.0",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "retention_days": 30,
        "files": files,
    })


class TestCrossPlatformPaths:
    def test_windows_style_paths_in_manifest(self, backup_dir: Path,
                                             windows_style_manifest_path: Path):
        # 清单中用反斜杠，当前平台（macOS/Linux）也能正确匹配
        cfg = _make_config(backup_dir, windows_style_manifest_path,
                           hash_algorithm="none", retention_days=365)
        result = BackupChecker(cfg).run_all_checks()
        # 所有文件都能被找到
        assert result.summary.missing_files == 0
        assert result.summary.passed is True
        assert result.exit_code() == 0
