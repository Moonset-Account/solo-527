#!/usr/bin/env python3
"""Comprehensive test suite for backup integrity checker.

Tests all scenarios:
- Valid backup (exit code 0)
- Hash mismatch (exit code 3)
- Missing files (exit code 4)
- Expired backups with --fail-on-expired (exit code 5)
- Invalid manifest (exit code 6)
- JSON output format
- Dry-run mode
- Config file priority
- Environment variables
- All subcommands
"""

from __future__ import annotations

import json
import os
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List, Optional


BASE_DIR = Path(__file__).resolve().parent
EXAMPLES_DIR = BASE_DIR / "examples"
RUN_SCRIPT = BASE_DIR / "run_bic.py"


@dataclass
class TestResult:
    name: str
    expected_exit_code: int
    actual_exit_code: int
    passed: bool
    output: str
    error: str

    def to_dict(self) -> Dict:
        return {
            "name": self.name,
            "expected_exit_code": self.expected_exit_code,
            "actual_exit_code": self.actual_exit_code,
            "passed": self.passed,
        }


def run_command(args: List[str], env: Optional[Dict] = None) -> tuple[int, str, str]:
    """Run a command and capture output."""
    cmd_args = [sys.executable, str(RUN_SCRIPT)] + args
    full_env = os.environ.copy()
    if env:
        full_env.update(env)

    result = subprocess.run(
        cmd_args,
        capture_output=True,
        text=True,
        env=full_env,
        cwd=str(EXAMPLES_DIR),
    )
    return result.returncode, result.stdout, result.stderr


def print_header(text: str) -> None:
    print("\n" + "=" * 70)
    print(f"  {text}")
    print("=" * 70)


def print_test_result(result: TestResult) -> None:
    status = "✓ PASS" if result.passed else "✗ FAIL"
    color = "\033[32m" if result.passed else "\033[31m"
    reset = "\033[0m"
    print(f"  {color}{status}{reset}  {result.name}")
    if not result.passed:
        print(f"         Expected exit code: {result.expected_exit_code}")
        print(f"         Actual exit code:   {result.actual_exit_code}")
        if result.error:
            print(f"         Error: {result.error[:200]}")


def test_scenario(
    name: str,
    args: List[str],
    expected_exit_code: int,
    env: Optional[Dict] = None,
    description: str = "",
) -> TestResult:
    """Run a test scenario and return the result."""
    if description:
        print(f"\n  Test: {name}")
        print(f"  Description: {description}")
        print(f"  Command: python3 run_bic.py {' '.join(args)}")

    exit_code, stdout, stderr = run_command(args, env=env)
    passed = exit_code == expected_exit_code

    if description and not passed:
        print(f"  Exit code: {exit_code} (expected: {expected_exit_code})")
        if stdout:
            print(f"  STDOUT preview: {stdout[:300]}...")
        if stderr:
            print(f"  STDERR preview: {stderr[:300]}...")

    return TestResult(
        name=name,
        expected_exit_code=expected_exit_code,
        actual_exit_code=exit_code,
        passed=passed,
        output=stdout,
        error=stderr,
    )


def run_all_tests() -> List[TestResult]:
    """Run all test scenarios."""
    results: List[TestResult] = []

    print_header("TEST 1: Valid Backup (exit code 0)")
    results.append(test_scenario(
        "Valid backup - all checks pass",
        ["check", "--manifest", "manifest-valid.yaml", "--backup-dir", "backup-dir",
         "--retention", "30", "--no-expired"],
        expected_exit_code=0,
        description="All files exist and hashes match",
    ))

    print_header("TEST 2: Hash Mismatch (exit code 3)")
    results.append(test_scenario(
        "Hash mismatch - integrity check fails",
        ["check", "--manifest", "manifest-hash-mismatch.yaml", "--backup-dir", "backup-dir",
         "--no-expired", "--no-missing"],
        expected_exit_code=3,
        description="file2.txt has wrong hash in manifest",
    ))

    print_header("TEST 3: Missing Files (exit code 4)")
    results.append(test_scenario(
        "Missing files - detection fails",
        ["check", "--manifest", "manifest-missing-file.yaml", "--backup-dir", "backup-dir",
         "--no-expired", "--no-integrity"],
        expected_exit_code=4,
        description="deleted.txt is listed but doesn't exist",
    ))

    print_header("TEST 4: Expired Backups (exit code 5 with --fail-on-expired)")
    results.append(test_scenario(
        "Expired backup with fail-on-expired",
        ["check", "--manifest", "manifest-expired.yaml", "--backup-dir", "backup-dir",
         "--retention", "30", "--fail-on-expired", "--no-integrity", "--no-missing"],
        expected_exit_code=5,
        description="Backup is from 2024, retention is 30 days, with --fail-on-expired",
    ))

    print_header("TEST 5: Expired Backups (exit code 0 without --fail-on-expired)")
    results.append(test_scenario(
        "Expired backup without fail-on-expired",
        ["check", "--manifest", "manifest-expired.yaml", "--backup-dir", "backup-dir",
         "--retention", "30", "--no-integrity", "--no-missing"],
        expected_exit_code=0,
        description="Expired but --fail-on-expired not set",
    ))

    print_header("TEST 6: Invalid Manifest (exit code 6)")
    results.append(test_scenario(
        "Invalid manifest - schema validation fails",
        ["check", "--manifest", "manifest-invalid.yaml", "--backup-dir", "backup-dir"],
        expected_exit_code=6,
        description="Manifest is missing required 'files' field",
    ))

    print_header("TEST 7: JSON Output Format")
    result = test_scenario(
        "JSON output format",
        ["--json", "check", "--manifest", "manifest-valid.yaml", "--backup-dir", "backup-dir",
         "--no-expired"],
        expected_exit_code=0,
        description="Verify JSON output is valid and contains expected fields",
    )
    results.append(result)

    if result.passed:
        try:
            json_data = json.loads(result.output)
            required_fields = ["summary", "exit_code", "integrity_results", "started_at", "completed_at"]
            all_present = all(field in json_data for field in required_fields)
            summary_fields = ["total", "passed", "failed", "missing", "expired", "skipped"]
            summary_ok = all(field in json_data["summary"] for field in summary_fields)

            if not all_present or not summary_ok:
                results[-1].passed = False
                results[-1].error = f"JSON missing required fields. all_present={all_present}, summary_ok={summary_ok}"
            else:
                print(f"  ✓ JSON structure valid, all required fields present")
                print(f"  ✓ Summary: {json_data['summary']}")
                print(f"  ✓ Exit code in JSON: {json_data['exit_code']}")
        except json.JSONDecodeError as e:
            results[-1].passed = False
            results[-1].error = f"Invalid JSON: {e}"

    print_header("TEST 8: Dry-Run Mode")
    results.append(test_scenario(
        "Dry-run mode",
        ["--dry-run", "check", "--manifest", "manifest-hash-mismatch.yaml", "--backup-dir", "backup-dir",
         "--no-expired"],
        expected_exit_code=0,
        description="Dry-run should always return 0 even with errors",
    ))

    print_header("TEST 9: Config File Priority")
    results.append(test_scenario(
        "Using config file",
        ["-c", "backup-checker.yaml", "check"],
        expected_exit_code=0,
        description="Load configuration from YAML file",
    ))

    print_header("TEST 10: Environment Variables")
    results.append(test_scenario(
        "Environment variable configuration",
        ["check", "--no-expired"],
        expected_exit_code=0,
        env={
            "BACKUP_CHECKER_MANIFEST": "manifest-valid.yaml",
            "BACKUP_CHECKER_BACKUP_DIR": "backup-dir",
        },
        description="Configuration from environment variables",
    ))

    print_header("TEST 11: CLI Override Environment")
    results.append(test_scenario(
        "CLI args override environment variables",
        ["check", "--manifest", "manifest-valid.yaml", "--backup-dir", "backup-dir",
         "--no-expired"],
        expected_exit_code=0,
        env={
            "BACKUP_CHECKER_MANIFEST": "manifest-invalid.yaml",
            "BACKUP_CHECKER_BACKUP_DIR": "nonexistent",
        },
        description="CLI arguments should take priority over env vars",
    ))

    print_header("TEST 12: Subcommand - verify")
    results.append(test_scenario(
        "verify subcommand (integrity only)",
        ["verify", "--manifest", "manifest-valid.yaml", "--backup-dir", "backup-dir"],
        expected_exit_code=0,
        description="verify is shortcut for check --no-missing --no-expired",
    ))

    print_header("TEST 13: Subcommand - manifest validate")
    results.append(test_scenario(
        "manifest validate subcommand",
        ["manifest", "validate", "--manifest", "manifest-valid.yaml"],
        expected_exit_code=0,
        description="Validate manifest format and schema",
    ))

    print_header("TEST 14: Subcommand - manifest validate (invalid)")
    results.append(test_scenario(
        "manifest validate with invalid manifest",
        ["manifest", "validate", "--manifest", "manifest-invalid.yaml"],
        expected_exit_code=6,
        description="Invalid manifest should fail validation",
    ))

    print_header("TEST 15: Subcommand - manifest show")
    results.append(test_scenario(
        "manifest show subcommand",
        ["manifest", "show", "--manifest", "manifest-valid.yaml"],
        expected_exit_code=0,
        description="Show manifest contents",
    ))

    print_header("TEST 16: Subcommand - config show")
    results.append(test_scenario(
        "config show subcommand",
        ["-c", "backup-checker.yaml", "config", "show"],
        expected_exit_code=0,
        description="Show effective configuration",
    ))

    print_header("TEST 17: Subcommand - config validate")
    results.append(test_scenario(
        "config validate subcommand",
        ["-c", "backup-checker.yaml", "config", "validate"],
        expected_exit_code=0,
        description="Validate configuration",
    ))

    print_header("TEST 18: Subcommand - generate (dry-run)")
    results.append(test_scenario(
        "generate subcommand with dry-run",
        ["--dry-run", "generate", "--backup-dir", "backup-dir", "--output", "/tmp/test-manifest.yaml"],
        expected_exit_code=0,
        description="Generate manifest in dry-run mode",
    ))

    print_header("TEST 19: Unsupported Hash Algorithm")
    results.append(test_scenario(
        "Unsupported hash algorithm",
        ["check", "--manifest", "manifest-valid.yaml", "--backup-dir", "backup-dir",
         "--hash", "invalid-algo", "--no-expired"],
        expected_exit_code=2,
        description="Invalid hash algorithm should return usage error",
    ))

    print_header("TEST 20: Negative Retention Days")
    results.append(test_scenario(
        "Negative retention days",
        ["check", "--manifest", "manifest-valid.yaml", "--backup-dir", "backup-dir",
         "--retention", "-1"],
        expected_exit_code=2,
        description="Negative retention should return usage error",
    ))

    print_header("TEST 21: Verbose Mode")
    results.append(test_scenario(
        "Verbose output mode",
        ["-v", "check", "--manifest", "manifest-valid.yaml", "--backup-dir", "backup-dir",
         "--no-expired"],
        expected_exit_code=0,
        description="Verbose mode should work without errors",
    ))

    print_header("TEST 22: JSON with Hash Mismatch")
    result = test_scenario(
        "JSON output with hash mismatch",
        ["--json", "check", "--manifest", "manifest-hash-mismatch.yaml", "--backup-dir", "backup-dir",
         "--no-expired", "--no-missing"],
        expected_exit_code=3,
        description="Verify JSON contains detailed error information",
    )
    results.append(result)

    if result.passed:
        try:
            json_data = json.loads(result.output)
            failed_results = [r for r in json_data["integrity_results"] if r["status"] != "ok"]
            if failed_results:
                failed = failed_results[0]
                print(f"  ✓ Failed file identified: {failed['path']}")
                print(f"  ✓ Expected hash: {failed['expected_hash']}")
                print(f"  ✓ Actual hash: {failed['actual_hash']}")
                print(f"  ✓ Status: {failed['status']}")
                print(f"  ✓ Error message: {failed['error']}")
            else:
                results[-1].passed = False
                results[-1].error = "No failed results found in JSON output"
        except (json.JSONDecodeError, KeyError) as e:
            results[-1].passed = False
            results[-1].error = f"JSON parsing error: {e}"

    print_header("TEST 23: Write Report to File")
    results.append(test_scenario(
        "Write report to file",
        ["check", "--manifest", "manifest-valid.yaml", "--backup-dir", "backup-dir",
         "--no-expired", "--output", "reports/test-report.txt"],
        expected_exit_code=0,
        description="Report should be written to file",
    ))
    if results[-1].passed:
        report_file = EXAMPLES_DIR / "reports" / "test-report.txt"
        if report_file.exists():
            print(f"  ✓ Report file created: {report_file}")
            print(f"  ✓ File size: {report_file.stat().st_size} bytes")
        else:
            results[-1].passed = False
            results[-1].error = f"Report file not created: {report_file}"

    print_header("TEST 24: Combined Issues (hash mismatch + missing + expired)")
    results.append(test_scenario(
        "Combined issues - highest priority exit code",
        ["check", "--manifest", "manifest-combined.yaml", "--backup-dir", "backup-dir",
         "--retention", "30", "--fail-on-expired"],
        expected_exit_code=3,
        description="Hash mismatch (3) should take priority over missing (4) and expired (5)",
    ))

    print_header("TEST 25: No Fail on Missing")
    results.append(test_scenario(
        "Missing files but --no-fail-on-missing",
        ["check", "--manifest", "manifest-missing-file.yaml", "--backup-dir", "backup-dir",
         "--no-expired", "--no-integrity", "--no-fail-on-missing"],
        expected_exit_code=0,
        description="Should return 0 when --no-fail-on-missing is set",
    ))

    return results


def print_summary(results: List[TestResult]) -> None:
    """Print test summary."""
    passed = sum(1 for r in results if r.passed)
    total = len(results)
    failed = total - passed

    print("\n" + "=" * 70)
    print("  TEST SUMMARY")
    print("=" * 70)
    print(f"\n  Total:  {total}")
    print(f"  Passed: {passed}")
    print(f"  Failed: {failed}")
    print(f"  Result: {'✓ ALL TESTS PASSED' if failed == 0 else '✗ SOME TESTS FAILED'}")
    print()

    if failed > 0:
        print("  Failed tests:")
        for r in results:
            if not r.passed:
                print(f"    - {r.name}: expected {r.expected_exit_code}, got {r.actual_exit_code}")
        print()

    exit_code = 0 if failed == 0 else 1
    print(f"  Exit code: {exit_code}")
    return exit_code


def main() -> int:
    print("\n" + "#" * 70)
    print("#  Backup Integrity Checker - Comprehensive Test Suite")
    print("#" * 70)

    results = run_all_tests()
    exit_code = print_summary(results)

    result_json = [r.to_dict() for r in results]
    with open(EXAMPLES_DIR / "reports" / "test-results.json", "w") as f:
        json.dump(result_json, f, indent=2)
    print(f"  Detailed results written to: {EXAMPLES_DIR / 'reports' / 'test-results.json'}")
    print()

    return exit_code


if __name__ == "__main__":
    sys.exit(main())
