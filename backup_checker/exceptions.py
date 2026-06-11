"""Exit codes and exception definitions.

Exit codes follow standard conventions for easy integration into CI pipelines:
- 0: Success
- 1: General error
- 2: Command line usage error
- 3: Integrity check failed (hash mismatch)
- 4: Missing files detected
- 5: Expired backups detected
- 6: Manifest parse error
- 7: Configuration error
- 8: Notification error
"""

from __future__ import annotations

import enum


class ExitCode(enum.IntEnum):
    """Exit code enumeration for CI/CD pipeline integration."""

    SUCCESS = 0
    GENERAL_ERROR = 1
    USAGE_ERROR = 2
    INTEGRITY_FAILED = 3
    MISSING_FILES = 4
    EXPIRED_BACKUPS = 5
    MANIFEST_ERROR = 6
    CONFIG_ERROR = 7
    NOTIFICATION_ERROR = 8

    @classmethod
    def from_errors(
        cls,
        integrity_failed: bool = False,
        missing_files: bool = False,
        expired_backups: bool = False,
        manifest_error: bool = False,
        config_error: bool = False,
        notification_error: bool = False,
        usage_error: bool = False,
    ) -> ExitCode:
        """Determine the appropriate exit code from error flags.

        Priority: CONFIG_ERROR > MANIFEST_ERROR > USAGE_ERROR >
                  INTEGRITY_FAILED > MISSING_FILES > EXPIRED_BACKUPS >
                  NOTIFICATION_ERROR > GENERAL_ERROR > SUCCESS
        """
        if config_error:
            return cls.CONFIG_ERROR
        if manifest_error:
            return cls.MANIFEST_ERROR
        if usage_error:
            return cls.USAGE_ERROR
        if integrity_failed:
            return cls.INTEGRITY_FAILED
        if missing_files:
            return cls.MISSING_FILES
        if expired_backups:
            return cls.EXPIRED_BACKUPS
        if notification_error:
            return cls.NOTIFICATION_ERROR
        return cls.SUCCESS


class BackupCheckerError(Exception):
    """Base exception for all backup checker errors."""

    exit_code: ExitCode = ExitCode.GENERAL_ERROR

    def __init__(
        self,
        message: str,
        exit_code: ExitCode | None = None,
        details: dict | None = None,
    ) -> None:
        super().__init__(message)
        self.message = message
        if exit_code is not None:
            self.exit_code = exit_code
        self.details = details or {}

    def to_dict(self) -> dict:
        return {
            "type": self.__class__.__name__,
            "message": self.message,
            "exit_code": self.exit_code,
            "details": self.details,
        }


class UsageError(BackupCheckerError):
    """Command line usage error."""

    exit_code = ExitCode.USAGE_ERROR


class ConfigError(BackupCheckerError):
    """Configuration file error."""

    exit_code = ExitCode.CONFIG_ERROR


class ManifestError(BackupCheckerError):
    """Manifest file parsing error."""

    exit_code = ExitCode.MANIFEST_ERROR


class IntegrityError(BackupCheckerError):
    """Integrity check failed - hash mismatch."""

    exit_code = ExitCode.INTEGRITY_FAILED


class MissingFilesError(BackupCheckerError):
    """Missing files detected."""

    exit_code = ExitCode.MISSING_FILES


class ExpiredBackupError(BackupCheckerError):
    """Expired backups detected."""

    exit_code = ExitCode.EXPIRED_BACKUPS


class NotificationError(BackupCheckerError):
    """Notification delivery error."""

    exit_code = ExitCode.NOTIFICATION_ERROR


class HashAlgorithmError(BackupCheckerError):
    """Unsupported hash algorithm."""

    exit_code = ExitCode.USAGE_ERROR
