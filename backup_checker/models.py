"""数据模型与类型定义。

使用 dataclass 定义配置、清单、结果等核心对象，保持类型安全与可序列化。
"""
from __future__ import annotations

import enum
from dataclasses import dataclass, field, asdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional


class IssueType(str, enum.Enum):
    """问题类型枚举。"""
    MISSING_FILE = "missing_file"          # 文件缺失
    HASH_MISMATCH = "hash_mismatch"        # 哈希不匹配
    SIZE_MISMATCH = "size_mismatch"        # 大小不一致
    EXPIRED_BACKUP = "expired_backup"      # 备份过期
    MANIFEST_ERROR = "manifest_error"      # 清单格式错误
    READ_ERROR = "read_error"              # 文件读取失败
    UNEXPECTED_FILE = "unexpected_file"    # 清单外文件


class IssueSeverity(str, enum.Enum):
    """问题严重程度。"""
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"


class NotifyTarget(str, enum.Enum):
    """告警输出方式。"""
    STDOUT = "stdout"
    STDERR = "stderr"
    LOG = "log"
    FILE = "file"


class OutputFormat(str, enum.Enum):
    """报告输出格式。"""
    TEXT = "text"
    JSON = "json"


@dataclass
class ManifestFile:
    """清单中的单个文件记录。"""
    path: str
    size: Optional[int] = None
    modified: Optional[str] = None
    hashes: dict[str, str] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass
class Manifest:
    """清单文件结构。"""
    version: str = "1.0"
    created_at: Optional[str] = None
    retention_days: Optional[int] = None
    files: list[ManifestFile] = field(default_factory=list)
    raw: dict[str, Any] = field(default_factory=dict)

    @property
    def created_datetime(self) -> Optional[datetime]:
        if not self.created_at:
            return None
        try:
            s = self.created_at.replace("Z", "+00:00")
            dt = datetime.fromisoformat(s)
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            return dt
        except (ValueError, TypeError):
            return None

    def to_dict(self) -> dict[str, Any]:
        return {
            "version": self.version,
            "created_at": self.created_at,
            "retention_days": self.retention_days,
            "files": [f.to_dict() for f in self.files],
        }


@dataclass
class CheckConfig:
    """一次检查的配置。"""
    backup_dir: Path
    manifest_path: Optional[Path] = None
    hash_algorithm: str = "sha256"
    retention_days: Optional[int] = None
    dry_run: bool = False
    strict: bool = True
    verbose: int = 0
    quiet: bool = False
    notify: NotifyTarget = NotifyTarget.STDOUT
    notify_target: Optional[Path] = None
    output_format: OutputFormat = OutputFormat.TEXT
    output_path: Optional[Path] = None

    def to_dict(self) -> dict[str, Any]:
        def _path_or_none(p: Optional[Path]) -> Optional[str]:
            return str(p) if p else None
        return {
            "backup_dir": str(self.backup_dir),
            "manifest_path": _path_or_none(self.manifest_path),
            "hash_algorithm": self.hash_algorithm,
            "retention_days": self.retention_days,
            "dry_run": self.dry_run,
            "strict": self.strict,
            "verbose": self.verbose,
            "quiet": self.quiet,
            "notify": self.notify.value,
            "notify_target": _path_or_none(self.notify_target),
            "output_format": self.output_format.value,
            "output_path": _path_or_none(self.output_path),
        }


@dataclass
class CheckIssue:
    """检查中发现的单个问题。"""
    type: IssueType
    severity: IssueSeverity
    message: str
    file_path: Optional[str] = None
    expected: Optional[str] = None
    actual: Optional[str] = None
    location: Optional[str] = None

    def to_dict(self) -> dict[str, Any]:
        return {
            "type": self.type.value,
            "severity": self.severity.value,
            "message": self.message,
            "file_path": self.file_path,
            "expected": self.expected,
            "actual": self.actual,
            "location": self.location,
        }


@dataclass
class CheckSummary:
    """检查摘要统计。"""
    total_files: int = 0
    checked_files: int = 0
    missing_files: int = 0
    hash_mismatches: int = 0
    size_mismatches: int = 0
    expired: bool = False
    issues_count: int = 0
    errors_count: int = 0
    warnings_count: int = 0
    passed: bool = True

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass
class CheckResult:
    """一次检查的完整结果。"""
    config: CheckConfig
    manifest: Optional[Manifest] = None
    summary: CheckSummary = field(default_factory=CheckSummary)
    issues: list[CheckIssue] = field(default_factory=list)
    file_details: list[dict[str, Any]] = field(default_factory=list)
    started_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    finished_at: Optional[datetime] = None

    @property
    def duration_seconds(self) -> float:
        end = self.finished_at or datetime.now(timezone.utc)
        return (end - self.started_at).total_seconds()

    def add_issue(self, issue: CheckIssue) -> None:
        self.issues.append(issue)
        self.summary.issues_count += 1
        if issue.severity in (IssueSeverity.ERROR, IssueSeverity.CRITICAL):
            self.summary.errors_count += 1
            self.summary.passed = False
        elif issue.severity == IssueSeverity.WARNING:
            self.summary.warnings_count += 1
            if self.config.strict:
                self.summary.passed = False

    def to_dict(self) -> dict[str, Any]:
        return {
            "tool": {
                "name": "backup-checker",
                "version": "1.0.0",
            },
            "config": self.config.to_dict(),
            "manifest": self.manifest.to_dict() if self.manifest else None,
            "summary": self.summary.to_dict(),
            "issues": [i.to_dict() for i in self.issues],
            "file_details": self.file_details,
            "timing": {
                "started_at": self.started_at.isoformat(),
                "finished_at": self.finished_at.isoformat() if self.finished_at else None,
                "duration_seconds": round(self.duration_seconds, 4),
            },
        }

    def exit_code(self) -> int:
        """基于问题类型计算退出码。保守策略：任何 ERROR 都非零。"""
        error_types: set[IssueType] = {i.type for i in self.issues
                                       if i.severity in (IssueSeverity.ERROR, IssueSeverity.CRITICAL)}
        if not error_types and self.summary.passed:
            return 0
        if len(error_types) > 1:
            return 5
        mapping = {
            IssueType.MISSING_FILE: 2,
            IssueType.HASH_MISMATCH: 3,
            IssueType.EXPIRED_BACKUP: 4,
        }
        for t in error_types:
            if t in mapping:
                return mapping[t]
        if self.summary.errors_count > 0:
            return 1
        return 0
