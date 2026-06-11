"""Unit tests for exceptions module."""


from backup_checker.exceptions import (
    BackupCheckerError,
    ConfigError,
    ExitCode,
    ExpiredBackupError,
    HashAlgorithmError,
    IntegrityError,
    ManifestError,
    MissingFilesError,
    NotificationError,
    UsageError,
)


class TestExitCode:
    """Test ExitCode enumeration."""

    def test_exit_code_values(self):
        assert ExitCode.SUCCESS == 0
        assert ExitCode.GENERAL_ERROR == 1
        assert ExitCode.USAGE_ERROR == 2
        assert ExitCode.INTEGRITY_FAILED == 3
        assert ExitCode.MISSING_FILES == 4
        assert ExitCode.EXPIRED_BACKUPS == 5
        assert ExitCode.MANIFEST_ERROR == 6
        assert ExitCode.CONFIG_ERROR == 7
        assert ExitCode.NOTIFICATION_ERROR == 8

    def test_from_errors_priority(self):
        assert ExitCode.from_errors(config_error=True) == ExitCode.CONFIG_ERROR
        assert ExitCode.from_errors(manifest_error=True, config_error=False) == ExitCode.MANIFEST_ERROR
        assert ExitCode.from_errors(usage_error=True) == ExitCode.USAGE_ERROR
        assert ExitCode.from_errors(integrity_failed=True) == ExitCode.INTEGRITY_FAILED
        assert ExitCode.from_errors(missing_files=True) == ExitCode.MISSING_FILES
        assert ExitCode.from_errors(expired_backups=True) == ExitCode.EXPIRED_BACKUPS
        assert ExitCode.from_errors(notification_error=True) == ExitCode.NOTIFICATION_ERROR
        assert ExitCode.from_errors() == ExitCode.SUCCESS

    def test_from_errors_priority_order(self):
        assert ExitCode.from_errors(
            integrity_failed=True,
            missing_files=True,
            expired_backups=True,
        ) == ExitCode.INTEGRITY_FAILED

        assert ExitCode.from_errors(
            manifest_error=True,
            integrity_failed=True,
        ) == ExitCode.MANIFEST_ERROR

        assert ExitCode.from_errors(
            config_error=True,
            manifest_error=True,
            integrity_failed=True,
        ) == ExitCode.CONFIG_ERROR


class TestExceptions:
    """Test custom exceptions."""

    def test_backup_checker_error_base(self):
        error = BackupCheckerError("test message")
        assert str(error) == "test message"
        assert error.exit_code == ExitCode.GENERAL_ERROR
        assert error.details == {}

    def test_backup_checker_error_with_details(self):
        details = {"key": "value", "number": 42}
        error = BackupCheckerError("test", details=details)
        assert error.details == details

    def test_backup_checker_error_to_dict(self):
        error = BackupCheckerError("test message", details={"foo": "bar"})
        error_dict = error.to_dict()
        assert error_dict["type"] == "BackupCheckerError"
        assert error_dict["message"] == "test message"
        assert error_dict["exit_code"] == ExitCode.GENERAL_ERROR
        assert error_dict["details"] == {"foo": "bar"}

    def test_specific_exceptions_have_correct_exit_codes(self):
        assert UsageError("test").exit_code == ExitCode.USAGE_ERROR
        assert ConfigError("test").exit_code == ExitCode.CONFIG_ERROR
        assert ManifestError("test").exit_code == ExitCode.MANIFEST_ERROR
        assert IntegrityError("test").exit_code == ExitCode.INTEGRITY_FAILED
        assert MissingFilesError("test").exit_code == ExitCode.MISSING_FILES
        assert ExpiredBackupError("test").exit_code == ExitCode.EXPIRED_BACKUPS
        assert NotificationError("test").exit_code == ExitCode.NOTIFICATION_ERROR
        assert HashAlgorithmError("test").exit_code == ExitCode.USAGE_ERROR

    def test_custom_exit_code(self):
        error = BackupCheckerError("test", exit_code=ExitCode.MANIFEST_ERROR)
        assert error.exit_code == ExitCode.MANIFEST_ERROR
