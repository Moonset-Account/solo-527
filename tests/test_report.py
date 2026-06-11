"""Unit tests for report module."""

import json
import tempfile
from pathlib import Path

import pytest

from backup_checker.core import CheckReport, CheckResult, CheckSummary
from backup_checker.report import format_human_readable, format_json, write_report


@pytest.fixture
def sample_report():
    """Create a sample check report for testing."""
    report = CheckReport()
    report.summary = CheckSummary(
        total=5,
        passed=3,
        failed=1,
        missing=1,
        skipped=0,
        integrity_errors=1,
        expired=0,
    )
    report.integrity_results = [
        CheckResult(path="file1.txt", status="ok", expected_hash="abc123", actual_hash="abc123"),
        CheckResult(path="file2.txt", status="hash_mismatch", expected_hash="def456", actual_hash="xyz789"),
        CheckResult(path="file3.txt", status="missing", expected_hash="aaa111", error="File not found"),
        CheckResult(path="subdir/file4.txt", status="ok", expected_hash="bbb222", actual_hash="bbb222"),
        CheckResult(path="subdir/file5.txt", status="ok", expected_hash="ccc333", actual_hash="ccc333"),
    ]
    report.missing_files = [{"path": "file3.txt", "error": "File not found"}]
    report.expired_backups = []
    report.exit_code = 3
    report.started_at = "2025-01-15T10:30:00Z"
    report.completed_at = "2025-01-15T10:30:05Z"
    report.duration_seconds = 5.123
    return report


@pytest.fixture
def success_report():
    """Create a successful check report."""
    report = CheckReport()
    report.summary = CheckSummary(
        total=3,
        passed=3,
        failed=0,
        missing=0,
        skipped=0,
        integrity_errors=0,
        expired=0,
    )
    report.integrity_results = [
        CheckResult(path="file1.txt", status="ok", expected_hash="abc123", actual_hash="abc123"),
        CheckResult(path="file2.txt", status="ok", expected_hash="def456", actual_hash="def456"),
        CheckResult(path="file3.txt", status="ok", expected_hash="ghi789", actual_hash="ghi789"),
    ]
    report.exit_code = 0
    report.started_at = "2025-01-15T10:30:00Z"
    report.completed_at = "2025-01-15T10:30:02Z"
    report.duration_seconds = 2.5
    return report


class TestFormatJSON:
    """Test JSON report formatting."""

    def test_format_json_basic(self, sample_report):
        json_str = format_json(sample_report)
        data = json.loads(json_str)

        assert data["summary"]["total"] == 5
        assert data["summary"]["passed"] == 3
        assert data["summary"]["failed"] == 1
        assert data["summary"]["missing"] == 1
        assert data["exit_code"] == 3
        assert data["started_at"] == "2025-01-15T10:30:00Z"
        assert "integrity_results" in data
        assert "errors" in data

    def test_format_json_contains_error_details(self, sample_report):
        json_str = format_json(sample_report)
        data = json.loads(json_str)

        failed = [r for r in data["integrity_results"] if r["status"] == "hash_mismatch"]
        assert len(failed) == 1
        assert failed[0]["path"] == "file2.txt"
        assert failed[0]["expected_hash"] == "def456"
        assert failed[0]["actual_hash"] == "xyz789"

    def test_format_json_contains_missing_details(self, sample_report):
        json_str = format_json(sample_report)
        data = json.loads(json_str)

        missing = data["missing_files"]
        assert len(missing) == 1
        assert missing[0]["path"] == "file3.txt"

    def test_format_json_success(self, success_report):
        json_str = format_json(success_report)
        data = json.loads(json_str)

        assert data["summary"]["total"] == 3
        assert data["summary"]["passed"] == 3
        assert data["exit_code"] == 0


class TestFormatHumanReadable:
    """Test human-readable report formatting."""

    def test_format_contains_summary(self, sample_report):
        output = format_human_readable(sample_report)
        assert "BACKUP INTEGRITY CHECK REPORT" in output
        assert "Total items:" in output
        assert "5" in output
        assert "Passed:" in output
        assert "3" in output
        assert "Failed:" in output
        assert "1" in output

    def test_format_success_report(self, success_report):
        output = format_human_readable(success_report)
        assert "SUCCESS" in output
        assert "exit code: 0" in output

    def test_format_failed_report(self, sample_report):
        output = format_human_readable(sample_report)
        assert "FAILURE" in output
        assert "file2.txt" in output
        assert "HASH_MISMATCH" in output

    def test_format_contains_exit_code(self, sample_report):
        output = format_human_readable(sample_report)
        assert "Exit code:" in output
        assert "3" in output

    def test_format_contains_timestamp(self, sample_report):
        output = format_human_readable(sample_report)
        assert "2025-01-15T10:30:00Z" in output

    def test_format_contains_missing_files(self, sample_report):
        output = format_human_readable(sample_report)
        assert "Missing Files" in output
        assert "file3.txt" in output

    def test_format_verbose_mode(self, sample_report):
        output_verbose = format_human_readable(sample_report, verbose=True)
        output_normal = format_human_readable(sample_report, verbose=False)

        assert output_verbose != output_normal
        assert len(output_verbose) >= len(output_normal)
        assert "file1.txt" in output_verbose
        assert "subdir/file4.txt" in output_verbose
        assert "subdir/file5.txt" in output_verbose

    def test_format_dry_run_mode(self, sample_report):
        sample_report.dry_run = True
        output = format_human_readable(sample_report)
        assert "DRY RUN" in output

    def test_format_contains_hashes_for_errors(self, sample_report):
        output = format_human_readable(sample_report)
        assert "Expected: def456" in output
        assert "Actual:   xyz789" in output


class TestWriteReport:
    """Test writing reports to files."""

    def test_write_report_to_file_json(self, temp_dir, sample_report):
        output_file = temp_dir / "report.json"
        write_report(sample_report, str(output_file), json_output=True)
        assert output_file.exists()
        data = json.loads(output_file.read_text())
        assert data["summary"]["total"] == 5

    def test_write_report_to_file_human(self, temp_dir, sample_report):
        output_file = temp_dir / "report.txt"
        write_report(sample_report, str(output_file), json_output=False)
        assert output_file.exists()
        content = output_file.read_text()
        assert "BACKUP INTEGRITY CHECK REPORT" in content

    def test_write_report_stdout_json(self, capsys, sample_report):
        write_report(sample_report, None, json_output=True)
        captured = capsys.readouterr()
        data = json.loads(captured.out)
        assert data["summary"]["total"] == 5

    def test_write_report_stdout_human(self, capsys, sample_report):
        write_report(sample_report, None, json_output=False)
        captured = capsys.readouterr()
        assert "BACKUP INTEGRITY CHECK REPORT" in captured.out

    def test_write_report_with_verbose(self, temp_dir, sample_report):
        output_file = temp_dir / "report.txt"
        write_report(sample_report, str(output_file), json_output=False, verbose=True)
        content = output_file.read_text()
        assert "file1.txt" in content

    def test_write_report_creates_parent_dirs(self, temp_dir, sample_report):
        nested_file = temp_dir / "reports" / "subdir" / "report.json"
        write_report(sample_report, str(nested_file), json_output=True)
        assert nested_file.exists()

    def test_write_report_invalid_path(self, sample_report):
        with pytest.raises(OSError):
            write_report(sample_report, "/nonexistent/path/report.json", json_output=True)


@pytest.fixture
def temp_dir():
    """Create a temporary directory for testing."""
    with tempfile.TemporaryDirectory() as td:
        yield Path(td)
