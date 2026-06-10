"""备份完整性检查器 (backup-checker)

面向团队的备份完整性校验命令行工具。

使用示例::

    from backup_checker.checker import BackupChecker
    from backup_checker.models import CheckConfig

    config = CheckConfig(
        backup_dir="/backups/2026-06-01",
        manifest_path="/backups/2026-06-01/manifest.json",
        hash_algorithm="sha256",
    )
    checker = BackupChecker(config)
    result = checker.run_all_checks()
"""

from .models import (
    CheckConfig,
    CheckResult,
    CheckIssue,
    IssueSeverity,
    IssueType,
    ManifestFile,
    Manifest,
)

__version__ = "1.0.0"
__all__ = [
    "__version__",
    "CheckConfig",
    "CheckResult",
    "CheckIssue",
    "IssueSeverity",
    "IssueType",
    "ManifestFile",
    "Manifest",
]
