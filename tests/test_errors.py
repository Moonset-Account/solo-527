"""错误定义相关单元测试。"""

import json

import pytest

from csv_validator.errors import (
    ExitCode,
    ValidationErrorCode,
    ValidationError,
    ValidationIssue,
    ValidationResult,
    ValidationSeverity,
)


class TestValidationErrorCode:
    def test_all_codes_are_strings(self):
        for code in ValidationErrorCode:
            assert isinstance(code.value, str)

    def test_codes_are_unique(self):
        values = [c.value for c in ValidationErrorCode]
        assert len(values) == len(set(values))


class TestValidationIssue:
    def test_issue_to_dict(self):
        issue = ValidationIssue(
            code=ValidationErrorCode.MISSING_VALUE,
            row=3,
            column="user_id",
            value="",
            message="必填字段为空",
            suggestion="请填写值",
        )
        d = issue.to_dict()
        assert d["code"] == "MISSING_VALUE"
        assert d["row"] == 3
        assert d["column"] == "user_id"
        assert d["severity"] == "error"

    def test_issue_format_location_with_row_and_column(self):
        issue = ValidationIssue(
            code=ValidationErrorCode.TYPE_MISMATCH,
            row=5,
            column="age",
            value="abc",
            message="类型错误",
        )
        assert "第5行" in issue.format_location()
        assert "列[age]" in issue.format_location()

    def test_issue_format_location_global(self):
        issue = ValidationIssue(
            code=ValidationErrorCode.EMPTY_FILE,
            row=None,
            column=None,
            value=None,
            message="空文件",
        )
        assert issue.format_location() == "全局"

    def test_warning_severity(self):
        issue = ValidationIssue(
            code=ValidationErrorCode.UNKNOWN_COLUMN,
            row=1,
            column="extra",
            value="extra",
            message="未知列",
            severity=ValidationSeverity.WARNING,
        )
        assert issue.severity == ValidationSeverity.WARNING
        assert issue.to_dict()["severity"] == "warning"


class TestValidationResult:
    def test_empty_result_is_valid(self):
        result = ValidationResult(valid=True)
        assert result.valid is True
        assert result.error_count == 0
        assert result.warning_count == 0

    def test_add_error_invalidates_result(self):
        result = ValidationResult(valid=True)
        result.add_issue(ValidationIssue(
            code=ValidationErrorCode.MISSING_VALUE,
            row=2,
            column="id",
            value="",
            message="必填为空",
        ))
        assert result.valid is False
        assert result.error_count == 1
        assert result.warning_count == 0
        assert result.stats["MISSING_VALUE"] == 1

    def test_warning_does_not_invalidate(self):
        result = ValidationResult(valid=True)
        result.add_issue(ValidationIssue(
            code=ValidationErrorCode.UNKNOWN_COLUMN,
            row=1,
            column="x",
            value="x",
            message="未知列",
            severity=ValidationSeverity.WARNING,
        ))
        assert result.valid is True
        assert result.warning_count == 1

    def test_to_dict_json_serializable(self):
        result = ValidationResult(valid=True, total_rows=10, total_columns=3)
        result.add_issue(ValidationIssue(
            code=ValidationErrorCode.DUPLICATE_KEY,
            row=3,
            column="id",
            value="123",
            message="重复",
            suggestion="改为唯一值",
        ))
        result.finalize()
        d = result.to_dict()
        serialized = json.dumps(d, ensure_ascii=False)
        assert json.loads(serialized) == d

    def test_finalize_generates_samples_and_fixes(self):
        result = ValidationResult(valid=True)
        result.add_issue(ValidationIssue(
            code=ValidationErrorCode.INVALID_ENUM,
            row=2,
            column="status",
            value="BAD",
            message="非法枚举",
            suggestion="从允许列表选择",
        ))
        result.finalize()
        assert len(result.sample_errors) >= 1
        assert len(result.fix_preview) >= 1

    def test_stats_aggregation(self):
        result = ValidationResult(valid=True)
        for _ in range(3):
            result.add_issue(ValidationIssue(
                code=ValidationErrorCode.MISSING_VALUE,
                row=2,
                column="a",
                value="",
                message="",
            ))
        result.add_issue(ValidationIssue(
            code=ValidationErrorCode.TYPE_MISMATCH,
            row=3,
            column="b",
            value="x",
            message="",
        ))
        assert result.stats["MISSING_VALUE"] == 3
        assert result.stats["TYPE_MISMATCH"] == 1


class TestValidationError:
    def test_default_exit_code(self):
        err = ValidationError("some error")
        assert err.exit_code == ExitCode.VALIDATION_ERRORS

    def test_custom_exit_code(self):
        err = ValidationError("schema bad", ExitCode.SCHEMA_ERROR)
        assert err.exit_code == ExitCode.SCHEMA_ERROR


class TestExitCode:
    def test_exit_codes_are_unique(self):
        codes = [v for k, v in ExitCode.__dict__.items() if not k.startswith("_")]
        assert len(codes) == len(set(codes))
