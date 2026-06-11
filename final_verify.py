#!/usr/bin/env python3
"""Final verification of all fixes."""
import json
import re
import os
import sys

os.chdir(os.path.dirname(os.path.abspath(__file__)))

print("=" * 60)
print("FINAL VERIFICATION")
print("=" * 60)
print()

# 1. Verify test-report.txt has no ANSI codes
print("[1] test-report.txt ANSI cleanup")
with open("examples/reports/test-report.txt") as f:
    txt_content = f.read()
ansi_cnt = len(re.findall(r"\033\[[0-9;]*m", txt_content))
print(f"    ANSI codes: {ansi_cnt}")
assert ansi_cnt == 0, "test-report.txt should have 0 ANSI codes"
assert "Total items:" in txt_content, "Should have summary"
print("    ✓ Clean, summary fields preserved")
print()

# 2. Verify JSON report structure
print("[2] JSON report structure")
sys.path.insert(0, ".")
from backup_checker.core import CheckReport
from backup_checker.report import format_json

report = CheckReport()
report.exit_code = 3
report.dry_run = False
report.notification_results = [{"channel": "test", "success": True}]

json_str = format_json(report)
data = json.loads(json_str)

expected_keys = [
    "manifest", "summary", "integrity_results", "missing_files",
    "expired_backups", "errors", "notification_results", "config",
    "started_at", "completed_at", "duration_seconds", "exit_code", "dry_run",
]

missing = [k for k in expected_keys if k not in data]
assert not missing, f"Missing keys: {missing}"
print(f"    Keys ({len(data)} total): {sorted(data.keys())}")
print("    ✓ All expected fields present")
print()

# 3. Verify notification logic
print("[3] Notification config priority")
import subprocess

# Test: config file enables notification, no --notify flag
result = subprocess.run(
    ["python3", "run_bic.py", "--json",
     "-c", "/tmp/test-notify-fail.yaml",
     "check", "-m", "examples/manifest-valid.yaml", "-b", "examples/backup-dir"],
    capture_output=True, text=True
)
print(f"    Config enabled, no --notify: exit={result.returncode}")
assert result.returncode == 8, f"Expected exit 8, got {result.returncode}"
report_data = json.loads(result.stdout)
assert len(report_data.get("notification_results", [])) > 0
print("    ✓ Notification sent when config.enabled=true")
print()

# Test: no config, no --notify flag
result2 = subprocess.run(
    ["python3", "run_bic.py", "--json",
     "check", "-m", "examples/manifest-valid.yaml", "-b", "examples/backup-dir", "--no-expired"],
    capture_output=True, text=True
)
print(f"    No config, no --notify: exit={result2.returncode}")
assert result2.returncode == 0
report2 = json.loads(result2.stdout)
assert len(report2.get("notification_results", [])) == 0
print("    ✓ No notification when not configured")
print()

# 4. Verify human-readable report no-color by default
print("[4] Human-readable report color behavior")
from backup_checker.report import format_human_readable

no_color = format_human_readable(report, use_color=False)
with_color = format_human_readable(report, use_color=True)

assert len(re.findall(r"\033\[[0-9;]*m", no_color)) == 0
assert len(re.findall(r"\033\[[0-9;]*m", with_color)) > 0
assert "FAILURE" in no_color
assert "FAILURE" in with_color
assert "DRY RUN" not in no_color
print("    ✓ No color by default")
print("    ✓ Color when use_color=True")
print("    ✓ SUCCESS/FAILURE text preserved")
print()

print("=" * 60)
print("ALL VERIFICATIONS PASSED ✓")
print("=" * 60)
