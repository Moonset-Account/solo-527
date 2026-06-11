"""报告生成模块单元测试。"""

import io
import json
import csv

import pytest

from csv_validator.errors import (
    ValidationErrorCode,
    ValidationIssue,
    ValidationResult,
    ValidationSeverity,
)
from csv_validator.report import ReportGenerator


def _make_result_with_issues() -> ValidationResult:
    result = ValidationResult(valid=False, total_rows=3, total_columns=4)
    result.add_issue(ValidationIssue(
        code=ValidationErrorCode.MISSING_VALUE,
        row=2,
        column="id",
        value="",
        message="必填字段为空",
        suggestion="请填写id值",
    ))
    result.add_issue(ValidationIssue(
        code=ValidationErrorCode.TYPE_MISMATCH,
        row=3,
        column="age",
        value="abc",
        message="类型不匹配",
        suggestion="填入合法的整数",
    ))
    result.add_issue(ValidationIssue(
        code=ValidationErrorCode.UNKNOWN_COLUMN,
        row=1,
        column="extra",
        value="extra",
        message="未知列",
        suggestion="移除或在Schema中定义",
        severity=ValidationSeverity.WARNING,
    ))
    result.finalize()
    return result


class TestReportGenerator:
    def test_json_output_valid_and_parseable(self):
        result = _make_result_with_issues()
        out = ReportGenerator.generate(result, output_format="json")
        parsed = json.loads(out)
        assert parsed["valid"] is False
        assert parsed["total_rows"] == 3
        assert parsed["total_columns"] == 4
        assert parsed["error_count"] == 2
        assert parsed["warning_count"] == 1
        assert len(parsed["issues"]) == 3
        assert "sample_errors" in parsed
        assert "fix_preview" in parsed

    def test_human_output_contains_key_parts(self):
        result = _make_result_with_issues()
        out = ReportGenerator.generate(result, output_format="human")
        assert "失败" in out or "成功" in out
        assert "总行数" in out
        assert "MISSING_VALUE" in out
        assert "第2行" in out
        assert "列[id]" in out

    def test_markdown_output_contains_key_parts(self):
        result = _make_result_with_issues()
        out = ReportGenerator.generate(result, output_format="markdown")
        assert "# CSV校验报告" in out
        assert "| 错误码 |" in out
        assert "MISSING_VALUE" in out

    def test_csv_output_is_parseable(self):
        result = _make_result_with_issues()
        out = ReportGenerator.generate(result, output_format="csv")
        reader = csv.DictReader(io.StringIO(out))
        rows = list(reader)
        assert len(rows) == 3
        assert rows[0]["code"] in {"MISSING_VALUE", "TYPE_MISMATCH", "UNKNOWN_COLUMN"}
        assert "severity" in rows[0]

    def test_unsupported_format_raises(self):
        result = ValidationResult(valid=True)
        with pytest.raises(ValueError):
            ReportGenerator.generate(result, output_format="xml")

    def test_hide_fix_preview(self):
        result = _make_result_with_issues()
        out = ReportGenerator.generate(
            result, output_format="human", show_fix_preview=False, show_samples=False,
        )
        assert "修复建议" not in out
        assert "典型错误" not in out

    def test_write_to_stream(self):
        result = _make_result_with_issues()
        buf = io.StringIO()
        ReportGenerator.write(result, buf, output_format="json")
        buf.seek(0)
        parsed = json.load(buf)
        assert parsed["valid"] is False

    def test_empty_valid_result(self):
        result = ValidationResult(valid=True, total_rows=0, total_columns=0)
        result.finalize()
        for fmt in ["human", "json", "markdown", "csv"]:
            out = ReportGenerator.generate(result, output_format=fmt)
            assert isinstance(out, str)
            assert len(out) > 0

    def test_json_contains_stats(self):
        result = _make_result_with_issues()
        out = ReportGenerator.generate(result, output_format="json")
        parsed = json.loads(out)
        assert "MISSING_VALUE" in parsed["stats"]
        assert parsed["stats"]["MISSING_VALUE"] == 1
