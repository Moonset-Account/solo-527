#!/usr/bin/env python3
"""Test color output behavior for human-readable reports."""
import io
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from backup_checker.core import CheckReport, CheckSummary
from backup_checker.report import format_human_readable, format_json, write_report

ANSI_RE = re.compile(r'\033\[[0-9;]*m')


def count_ansi(text: str) -> int:
    return len(ANSI_RE.findall(text))


def make_report():
    report = CheckReport()
    report.summary = CheckSummary(total=5, passed=3, failed=1, missing=1, integrity_errors=1)
    report.exit_code = 3
    report.started_at = "2025-01-01T00:00:00Z"
    report.completed_at = "2025-01-01T00:00:05Z"
    report.duration_seconds = 5.0
    report.dry_run = False
    return report


def test_no_color_by_default():
    report = make_report()
    text = format_human_readable(report)
    cnt = count_ansi(text)
    assert cnt == 0, f"Expected 0 ANSI codes by default, got {cnt}"
    assert "FAILURE" in text
    assert "Total items:" in text
    assert "Exit code:" in text
    print("  PASS: No ANSI codes by default")


def test_use_color_true():
    report = make_report()
    text = format_human_readable(report, use_color=True)
    cnt = count_ansi(text)
    assert cnt > 0, f"Expected >0 ANSI codes with use_color=True, got {cnt}"
    assert "\033[31m" in text
    assert "\033[0m" in text
    print(f"  PASS: {cnt} ANSI color codes present with use_color=True")


def test_dry_run_color():
    report = make_report()
    report.dry_run = True
    text = format_human_readable(report, use_color=True)
    assert "DRY RUN" in text
    assert "\033[33m" in text
    print("  PASS: DRY RUN with yellow color")


def test_dry_run_no_color():
    report = make_report()
    report.dry_run = True
    text = format_human_readable(report, use_color=False)
    assert "DRY RUN" in text
    cnt = count_ansi(text)
    assert cnt == 0
    print("  PASS: DRY RUN preserved without color")


def test_write_report_to_file():
    report = make_report()
    test_file = "/tmp/test-report-color.txt"
    if os.path.exists(test_file):
        os.remove(test_file)
    write_report(report, output_file=test_file, json_output=False, verbose=False)
    with open(test_file) as f:
        content = f.read()
    cnt = count_ansi(content)
    assert cnt == 0, f"Expected 0 ANSI codes in file, got {cnt}"
    assert "FAILURE" in content
    assert "exit code: 3" in content
    print("  PASS: No ANSI codes when writing to file")


def test_write_report_non_tty_stdout():
    report = make_report()
    mock_stdout = io.StringIO()
    write_report(report, output_file=None, json_output=False, verbose=False, stdout=mock_stdout)
    content = mock_stdout.getvalue()
    cnt = count_ansi(content)
    assert cnt == 0, f"Expected 0 ANSI codes for non-TTY, got {cnt}"
    assert "FAILURE" in content
    print(f"  PASS: No ANSI codes for non-TTY stdout (isatty={mock_stdout.isatty()})")


def test_json_report_structure():
    report = make_report()
    json_str = format_json(report)
    data = json.loads(json_str)
    expected_keys = {
        "manifest", "summary", "integrity_results", "missing_files",
        "expired_backups", "errors", "notification_results", "config",
        "started_at", "completed_at", "duration_seconds", "exit_code", "dry_run",
    }
    actual_keys = set(data.keys())
    assert expected_keys.issubset(actual_keys), f"Missing: {expected_keys - actual_keys}"
    assert data["exit_code"] == 3
    assert data["dry_run"] is False
    assert data["summary"]["total"] == 5
    print(f"  PASS: JSON report has all {len(actual_keys)} expected keys")


def test_success_status():
    report = make_report()
    report.exit_code = 0
    text = format_human_readable(report, use_color=True)
    assert "SUCCESS" in text
    assert "\033[32m" in text
    print("  PASS: SUCCESS with green color")


def main():
    print("=" * 60)
    print("COLOR OUTPUT TESTS")
    print("=" * 60)
    print()

    tests = [
        ("No color by default", test_no_color_by_default),
        ("use_color=True adds ANSI codes", test_use_color_true),
        ("DRY RUN with color", test_dry_run_color),
        ("DRY RUN preserved without color", test_dry_run_no_color),
        ("Write report to file (no color)", test_write_report_to_file),
        ("Write report to non-TTY stdout (no color)", test_write_report_non_tty_stdout),
        ("JSON report structure preserved", test_json_report_structure),
        ("SUCCESS status has green color", test_success_status),
    ]

    passed = 0
    failed = 0
    for name, fn in tests:
        print(f"[{name}]")
        try:
            fn()
            passed += 1
        except AssertionError as e:
            print(f"  FAIL: {e}")
            failed += 1
        except Exception as e:
            print(f"  ERROR: {type(e).__name__}: {e}")
            failed += 1
        print()

    print("=" * 60)
    print(f"RESULT: {passed} passed, {failed} failed")
    print("=" * 60)
    return 0 if failed == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
