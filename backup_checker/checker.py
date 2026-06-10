"""核心检查器：编排所有备份完整性检查。"""
from __future__ import annotations

import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from .manifest import load_manifest
from .models import (
    CheckConfig,
    CheckIssue,
    CheckResult,
    CheckSummary,
    IssueSeverity,
    IssueType,
    Manifest,
)
from .utils import (
    compute_file_hash,
    format_size,
    is_backup_expired,
    is_supported_hash,
    make_location_hint,
    manifest_to_native_path,
    native_to_manifest_path,
)

log = logging.getLogger("backup_checker")


class BackupChecker:
    """备份完整性检查执行器。

    典型用法::

        checker = BackupChecker(config)
        result = checker.run_all_checks()
        print(result.exit_code())
    """

    def __init__(self, config: CheckConfig) -> None:
        self.config = config
        self.result = CheckResult(config=config)

    # ------------------------------------------------------------------
    # 入口
    # ------------------------------------------------------------------

    def run_all_checks(self) -> CheckResult:
        """执行全部检查并返回结果。"""
        try:
            self._validate_basic_paths()
            self._load_manifest()
            if self.result.manifest is not None:
                self._check_expiration()
                self._check_files_existence()
                self._check_file_hashes_and_sizes()
                self._check_unexpected_files()
        except _AbortCheck as exc:
            # 预期内的中止，问题已被记录
            log.debug("检查提前中止：%s", exc)
        except Exception as exc:  # pragma: no cover - 防御性
            self.result.add_issue(CheckIssue(
                type=IssueType.MANIFEST_ERROR,
                severity=IssueSeverity.CRITICAL,
                message=f"检查运行时出现未预期异常：{type(exc).__name__}: {exc}",
            ))
            log.exception("检查运行时异常")
        finally:
            self.result.finished_at = datetime.now(timezone.utc)
            self.result.summary.total_files = (
                len(self.result.manifest.files) if self.result.manifest else 0
            )
            self.result.summary.checked_files = (
                self.result.summary.total_files - self.result.summary.missing_files
            )
        return self.result

    # ------------------------------------------------------------------
    # 基本校验
    # ------------------------------------------------------------------

    def _validate_basic_paths(self) -> None:
        cfg = self.config
        backup_dir = cfg.backup_dir
        if not backup_dir.exists():
            self.result.add_issue(CheckIssue(
                type=IssueType.MANIFEST_ERROR,
                severity=IssueSeverity.CRITICAL,
                message=f"备份目录不存在：{backup_dir}",
                location=make_location_hint(backup_dir),
            ))
            raise _AbortCheck("备份目录不存在")
        if not backup_dir.is_dir():
            self.result.add_issue(CheckIssue(
                type=IssueType.MANIFEST_ERROR,
                severity=IssueSeverity.CRITICAL,
                message=f"备份路径不是目录：{backup_dir}",
                location=make_location_hint(backup_dir),
            ))
            raise _AbortCheck("备份路径不是目录")
        if cfg.hash_algorithm.lower() != "none" and not is_supported_hash(cfg.hash_algorithm):
            self.result.add_issue(CheckIssue(
                type=IssueType.MANIFEST_ERROR,
                severity=IssueSeverity.CRITICAL,
                message=(
                    f"哈希算法不支持：'{cfg.hash_algorithm}'。"
                    f"可选值：md5 / sha1 / sha256 / sha512 / none"
                ),
            ))
            raise _AbortCheck("哈希算法不支持")
        if cfg.notify_target and cfg.notify.value == "file":
            parent = cfg.notify_target.parent
            if str(parent) and not parent.exists():
                # 尝试创建目录
                try:
                    parent.mkdir(parents=True, exist_ok=True)
                except OSError as exc:
                    self.result.add_issue(CheckIssue(
                        type=IssueType.MANIFEST_ERROR,
                        severity=IssueSeverity.WARNING,
                        message=f"告警日志目录创建失败：{exc}（将退回到 stderr）",
                        location=make_location_hint(parent),
                    ))

    # ------------------------------------------------------------------
    # 加载清单
    # ------------------------------------------------------------------

    def _load_manifest(self) -> None:
        if self.config.manifest_path is None:
            self.result.add_issue(CheckIssue(
                type=IssueType.MANIFEST_ERROR,
                severity=IssueSeverity.CRITICAL,
                message="未指定清单文件（--manifest 参数缺失）。保守模式下拒绝继续执行。",
            ))
            raise _AbortCheck("未指定清单")
        manifest, issues = load_manifest(self.config.manifest_path)
        for i in issues:
            self.result.add_issue(i)
        if manifest is None:
            raise _AbortCheck("清单加载失败")
        self.result.manifest = manifest

    # ------------------------------------------------------------------
    # 过期检测
    # ------------------------------------------------------------------

    def _check_expiration(self) -> None:
        assert self.result.manifest is not None
        retention = self.config.retention_days
        if retention is None:
            retention = self.result.manifest.retention_days
        created = self.result.manifest.created_datetime
        expired, delta = is_backup_expired(created, retention)
        if retention is None or created is None:
            if retention is None:
                self.result.add_issue(CheckIssue(
                    type=IssueType.EXPIRED_BACKUP,
                    severity=IssueSeverity.WARNING,
                    message="未设置保留周期（清单和 --retention 参数均未指定），无法判断是否过期",
                    location="retention",
                ))
            return
        if expired:
            self.result.summary.expired = True
            self.result.add_issue(CheckIssue(
                type=IssueType.EXPIRED_BACKUP,
                severity=IssueSeverity.ERROR,
                message=(
                    f"备份已过期：创建于 {created.isoformat()}，"
                    f"保留 {retention} 天，已超期 {_fmt_delta(delta)}"
                ),
                location="manifest.created_at",
                expected=f"年龄 <= {retention}d",
                actual=f"超期 {_fmt_delta(delta)}",
            ))
        elif self.config.verbose >= 1:
            self.result.add_issue(CheckIssue(
                type=IssueType.EXPIRED_BACKUP,
                severity=IssueSeverity.INFO,
                message=(
                    f"备份仍在保留期内，剩余 {_fmt_delta(delta)}"
                ),
                location="manifest.created_at",
            ))

    # ------------------------------------------------------------------
    # 文件存在性检测
    # ------------------------------------------------------------------

    def _check_files_existence(self) -> None:
        assert self.result.manifest is not None
        backup_dir = self.config.backup_dir
        for mf in self.result.manifest.files:
            local_path = manifest_to_native_path(mf.path, backup_dir)
            detail: dict = {
                "manifest_path": mf.path,
                "local_path": str(local_path),
                "expected_size": mf.size,
                "exists": False,
                "checked": False,
            }
            if not local_path.exists():
                self.result.summary.missing_files += 1
                self.result.add_issue(CheckIssue(
                    type=IssueType.MISSING_FILE,
                    severity=IssueSeverity.ERROR,
                    message=f"文件缺失：{mf.path}",
                    file_path=mf.path,
                    location=make_location_hint(local_path),
                ))
            else:
                detail["exists"] = True
                if local_path.is_symlink():
                    target = local_path.resolve()
                    if not target.exists():
                        self.result.summary.missing_files += 1
                        self.result.add_issue(CheckIssue(
                            type=IssueType.MISSING_FILE,
                            severity=IssueSeverity.ERROR,
                            message=f"符号链接指向不存在的目标：{mf.path} -> {target}",
                            file_path=mf.path,
                            location=make_location_hint(local_path),
                        ))
                        detail["exists"] = False
            self.result.file_details.append(detail)

    # ------------------------------------------------------------------
    # 哈希 & 大小校验
    # ------------------------------------------------------------------

    def _check_file_hashes_and_sizes(self) -> None:
        assert self.result.manifest is not None
        cfg = self.config
        algo = cfg.hash_algorithm.lower()
        skip_hash = (algo == "none")
        backup_dir = cfg.backup_dir
        detail_map: dict[str, dict] = {d["manifest_path"]: d for d in self.result.file_details}

        for mf in self.result.manifest.files:
            detail = detail_map.get(mf.path)
            if detail is None or not detail.get("exists"):
                continue
            local_path = Path(detail["local_path"])
            detail["checked"] = True
            # 大小校验
            if mf.size is not None:
                try:
                    actual_size = local_path.stat().st_size
                    detail["actual_size"] = actual_size
                    if actual_size != mf.size:
                        self.result.summary.size_mismatches += 1
                        self.result.add_issue(CheckIssue(
                            type=IssueType.SIZE_MISMATCH,
                            severity=IssueSeverity.ERROR,
                            message=(
                                f"文件大小不一致：{mf.path} "
                                f"（期望 {format_size(mf.size)}，实际 {format_size(actual_size)}）"
                            ),
                            file_path=mf.path,
                            expected=str(mf.size),
                            actual=str(actual_size),
                            location=make_location_hint(local_path),
                        ))
                except OSError as exc:
                    self.result.add_issue(CheckIssue(
                        type=IssueType.READ_ERROR,
                        severity=IssueSeverity.ERROR,
                        message=f"读取文件大小失败：{mf.path}：{exc}",
                        file_path=mf.path,
                        location=make_location_hint(local_path),
                    ))
                    continue

            # 哈希校验
            if skip_hash:
                continue
            if cfg.dry_run:
                detail["hash_skipped"] = True
                detail["hash_algorithm"] = algo
                continue
            expected_hash = mf.hashes.get(algo)
            if expected_hash is None:
                # 保守策略：只要用户明确指定了非 none 的算法且清单未提供，就告警
                # （sha256/md5 总是告警；其他算法在严格或 verbose 模式下也告警）
                if algo in {"sha256", "md5"} or cfg.strict or cfg.verbose >= 1:
                    self.result.add_issue(CheckIssue(
                        type=IssueType.MANIFEST_ERROR,
                        severity=IssueSeverity.WARNING,
                        message=f"清单中未提供 {algo} 哈希，跳过哈希校验：{mf.path}",
                        file_path=mf.path,
                        location=f"files[].hashes.{algo}",
                    ))
                detail["hash"] = None
                detail["expected_hash"] = None
                continue
            try:
                actual_hash = compute_file_hash(local_path, algo)
            except (OSError, PermissionError) as exc:
                self.result.add_issue(CheckIssue(
                    type=IssueType.READ_ERROR,
                    severity=IssueSeverity.ERROR,
                    message=f"读取文件计算哈希失败：{mf.path}：{exc}",
                    file_path=mf.path,
                    location=make_location_hint(local_path),
                ))
                continue
            detail["hash_algorithm"] = algo
            detail["expected_hash"] = expected_hash
            detail["actual_hash"] = actual_hash
            if actual_hash.lower() != expected_hash.lower():
                self.result.summary.hash_mismatches += 1
                self.result.add_issue(CheckIssue(
                    type=IssueType.HASH_MISMATCH,
                    severity=IssueSeverity.CRITICAL,
                    message=f"哈希校验失败：{mf.path}（{algo}）",
                    file_path=mf.path,
                    expected=expected_hash,
                    actual=actual_hash,
                    location=make_location_hint(local_path),
                ))

    # ------------------------------------------------------------------
    # 清单外文件检测（info 级别，仅 verbose 时）
    # ------------------------------------------------------------------

    def _check_unexpected_files(self) -> None:
        if self.config.verbose < 2:
            return
        assert self.result.manifest is not None
        backup_dir = self.config.backup_dir
        manifest_paths = {mf.path for mf in self.result.manifest.files}
        manifest_path = self.config.manifest_path
        for entry in backup_dir.rglob("*"):
            if not entry.is_file():
                continue
            if manifest_path and entry.resolve() == manifest_path.resolve():
                continue
            rel = native_to_manifest_path(entry, backup_dir)
            if rel not in manifest_paths:
                self.result.add_issue(CheckIssue(
                    type=IssueType.UNEXPECTED_FILE,
                    severity=IssueSeverity.INFO,
                    message=f"清单外文件（未在清单中登记）：{rel}",
                    file_path=rel,
                ))


class _AbortCheck(Exception):
    """内部异常：指示检查流程应当提前中止。"""


def _fmt_delta(td) -> str:
    from .utils import format_timedelta
    return format_timedelta(td)
