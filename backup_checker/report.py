"""Report generation module.

Supports both human-readable and JSON formatted reports for CI/CD pipelines.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any, TextIO

from .core import CheckReport


def _format_summary_table(report: CheckReport) -> str:
    """Format the summary as an ASCII table."""
    s = report.summary
    lines = [
        "",
        "┌──────────────────────────────────────────────┐",
        "│              CHECK SUMMARY                   │",
        "├──────────────────────────────────────────────┤",
        f"│  Total items:          {s.total:<28}│",
        f"│  Passed:               {s.passed:<28}│",
        f"│  Failed:               {s.failed:<28}│",
        f"│  Missing:              {s.missing:<28}│",
        f"│  Expired:              {s.expired:<28}│",
        f"│  Skipped:              {s.skipped:<28}│",
        f"│  Integrity errors:     {s.integrity_errors:<28}│",
        "├──────────────────────────────────────────────┤",
        f"│  Exit code:            {report.exit_code:<28}│",
        "└──────────────────────────────────────────────┘",
        "",
    ]
    return "\n".join(lines)


def _format_integrity_results(report: CheckReport) -> str:
    """Format integrity check results."""
    if not report.integrity_results:
        return "  No integrity checks performed\n"

    lines = ["", "### Integrity Check Results ###", ""]
    ok_count = sum(1 for r in report.integrity_results if r.is_ok)
    fail_count = len(report.integrity_results) - ok_count

    lines.append(f"  {ok_count} passed, {fail_count} failed")
    lines.append("")

    failed = [r for r in report.integrity_results if not r.is_ok]
    if failed:
        lines.append("  FAILED ITEMS:")
        for result in failed:
            lines.append(f"    - [{result.status.upper()}] {result.path}")
            if result.error:
                lines.append(f"        Error: {result.error}")
            if result.actual_hash:
                lines.append(f"        Expected: {result.expected_hash}")
                lines.append(f"        Actual:   {result.actual_hash}")
        lines.append("")

    if report.summary.passed > 0:
        passed = [r for r in report.integrity_results if r.is_ok]
        lines.append(f"  PASSED ITEMS ({len(passed)}):")
        for result in passed[:10]:
            lines.append(f"    - [OK] {result.path}")
        if len(passed) > 10:
            lines.append(f"    ... and {len(passed) - 10} more")
        lines.append("")

    return "\n".join(lines)


def _format_missing_files(report: CheckReport) -> str:
    """Format missing files list."""
    if not report.missing_files:
        return "  No missing files detected\n"

    lines = ["", "### Missing Files ###", ""]
    lines.append(f"  {len(report.missing_files)} missing file(s) detected:")
    lines.append("")
    for item in report.missing_files:
        lines.append(f"    - {item['path']}")
        if item.get("error"):
            lines.append(f"        Error: {item['error']}")
    lines.append("")
    return "\n".join(lines)


def _format_expired_backups(report: CheckReport) -> str:
    """Format expired backups list."""
    if not report.expired_backups:
        return "  No expired backups detected\n"

    lines = ["", "### Expired Backups ###", ""]
    lines.append(f"  {len(report.expired_backups)} expired item(s) detected:")
    lines.append("")
    for item in report.expired_backups:
        lines.append(f"    - {item['source']}")
        lines.append(f"        Date: {item['date']}")
        lines.append(f"        Age: {item['age_days']} days (retention: {item['retention_days']} days)")
        lines.append(f"        Expired by: {item['expired_by_days']} days")
    lines.append("")
    return "\n".join(lines)


def _format_errors(report: CheckReport) -> str:
    """Format errors list."""
    if not report.errors:
        return ""

    lines = ["", "### Errors ###", ""]
    lines.append(f"  {len(report.errors)} error(s) occurred:")
    lines.append("")
    for error in report.errors:
        lines.append(f"    - [{error.get('type', 'Unknown')}] {error.get('message', 'No message')}")
        details = error.get("details")
        if details:
            for key, value in details.items():
                lines.append(f"        {key}: {value}")
    lines.append("")
    return "\n".join(lines)


def _format_manifest_info(report: CheckReport) -> str:
    """Format manifest information."""
    if not report.manifest:
        return "  Manifest: not parsed\n"

    manifest = report.manifest
    lines = ["", "### Manifest Information ###", ""]
    if manifest.backup_id:
        lines.append(f"  Backup ID:     {manifest.backup_id}")
    if manifest.version:
        lines.append(f"  Version:       {manifest.version}")
    if manifest.created_at:
        lines.append(f"  Created:       {manifest.created_at}")
    if manifest.description:
        lines.append(f"  Description:   {manifest.description}")
    if manifest.hash_algorithm:
        lines.append(f"  Hash algorithm: {manifest.hash_algorithm}")
    lines.append(f"  Files:         {len(manifest.files)}")
    lines.append("")
    return "\n".join(lines)


def format_human_readable(report: CheckReport, verbose: bool = False) -> str:
    """Format report as human-readable text.

    Args:
        report: CheckReport to format
        verbose: If True, include more details

    Returns:
        Formatted string
    """
    parts = [
        "=" * 58,
        "         BACKUP INTEGRITY CHECK REPORT",
        "=" * 58,
    ]

    if getattr(report, "dry_run", False):
        parts.append("")
        parts.append("  ****************************")
        parts.append("  *     DRY RUN MODE         *")
        parts.append("  *  No changes were made    *")
        parts.append("  ****************************")

    parts.extend([
        "",
        f"  Started:     {report.started_at}",
        f"  Completed:   {report.completed_at}",
        f"  Duration:    {report.duration_seconds:.2f}s" if report.duration_seconds is not None else "  Duration:    N/A",
    ])

    parts.append(_format_summary_table(report))

    if verbose or report.manifest:
        parts.append(_format_manifest_info(report))

    parts.append(_format_integrity_results(report))
    parts.append(_format_missing_files(report))
    parts.append(_format_expired_backups(report))
    parts.append(_format_errors(report))

    if report.exit_code == 0:
        status = "SUCCESS"
        status_color = "\033[32m"
    else:
        status = "FAILURE"
        status_color = "\033[31m"

    reset = "\033[0m" if sys.stdout.isatty() else ""
    parts.append("")
    parts.append("=" * 58)
    parts.append(f"  STATUS: {status_color}{status}{reset} (exit code: {report.exit_code})")
    parts.append("=" * 58)
    parts.append("")

    return "\n".join(parts)


def format_json(report: CheckReport, indent: int = 2) -> str:
    """Format report as JSON for machine-readable output.

    Args:
        report: CheckReport to format
        indent: JSON indentation level

    Returns:
        JSON string
    """
    return json.dumps(report.to_dict(), indent=indent, ensure_ascii=False, default=str)


def write_report(
    report: CheckReport,
    output_file: str | None = None,
    json_output: bool = False,
    verbose: bool = False,
    stdout: TextIO | None = None,
) -> str | None:
    """Write report to file or stdout.

    Args:
        report: CheckReport to write
        output_file: Path to output file (or None for stdout)
        json_output: If True, output JSON format
        verbose: If True, include verbose details in human-readable format
        stdout: stdout stream to use (defaults to sys.stdout)

    Returns:
        The formatted report as a string
    """
    formatted = format_json(report) if json_output else format_human_readable(report, verbose=verbose)

    out = stdout or sys.stdout

    if output_file:
        path = Path(output_file)
        path.parent.mkdir(parents=True, exist_ok=True)
        with open(path, "w", encoding="utf-8") as f:
            f.write(formatted)
            if not formatted.endswith("\n"):
                f.write("\n")
    else:
        out.write(formatted)
        if not formatted.endswith("\n"):
            out.write("\n")
        out.flush()

    return formatted


def get_summary_dict(report: CheckReport) -> dict[str, Any]:
    """Get a concise summary dictionary for quick parsing.

    Args:
        report: CheckReport to summarize

    Returns:
        Concise summary dictionary
    """
    return {
        "total": report.summary.total,
        "passed": report.summary.passed,
        "failed": report.summary.failed,
        "missing": report.summary.missing,
        "expired": report.summary.expired,
        "skipped": report.summary.skipped,
        "integrity_errors": report.summary.integrity_errors,
        "exit_code": report.exit_code,
        "has_errors": report.has_errors,
        "duration_seconds": report.duration_seconds,
    }
