#!/usr/bin/env python3
"""Test notification config priority fix."""
import json
import subprocess
import sys
import os

os.chdir(os.path.dirname(os.path.abspath(__file__)))

tests = []

# Test 1: Config file enables notification, no --notify flag
# Should still send notification (and fail because webhook is invalid)
# Exit code should be 8 (notification error)
tests.append({
    "name": "Config notification.enabled=true, no --notify flag",
    "cmd": ["python3", "run_bic.py", "--json",
            "-c", "/tmp/test-notify-fail.yaml",
            "check", "-m", "examples/manifest-valid.yaml", "-b", "examples/backup-dir"],
    "expected_exit": 8,
    "check": lambda r: len(json.loads(r.stdout).get("notification_results", [])) > 0,
    "check_desc": "notification_results present",
})

# Test 2: No notification config, no --notify flag
# Should NOT send notification, exit code should be 0
tests.append({
    "name": "No notification config, no --notify flag",
    "cmd": ["python3", "run_bic.py", "--json",
            "check", "-m", "examples/manifest-valid.yaml", "-b", "examples/backup-dir", "--no-expired"],
    "expected_exit": 0,
    "check": lambda r: len(json.loads(r.stdout).get("notification_results", [])) == 0,
    "check_desc": "no notification_results",
})

# Test 3: --notify flag explicitly set
# Should send notification
tests.append({
    "name": "--notify flag explicitly set",
    "cmd": ["python3", "run_bic.py", "--json",
            "-c", "/tmp/test-notify-fail.yaml",
            "check", "-m", "examples/manifest-valid.yaml", "-b", "examples/backup-dir",
            "--notify"],
    "expected_exit": 8,
    "check": lambda r: len(json.loads(r.stdout).get("notification_results", [])) > 0,
    "check_desc": "notification_results present",
})

# Test 4: Config file has notification.enabled=false, --notify overrides
# Need to create a config with disabled notification, then --notify should enable it
tests.append({
    "name": "--notify overrides config notification.enabled=false",
    "cmd": ["python3", "run_bic.py", "--json",
            "-c", "/tmp/test-notify-disabled.yaml",
            "check", "-m", "examples/manifest-valid.yaml", "-b", "examples/backup-dir",
            "--notify"],
    "expected_exit": 8,
    "check": lambda r: len(json.loads(r.stdout).get("notification_results", [])) > 0,
    "check_desc": "notification_results present (--notify overrides)",
})

# Create disabled config
with open("/tmp/test-notify-disabled.yaml", "w") as f:
    f.write("""
notification:
  enabled: false
  channels:
    - webhook
  webhook_url: "http://127.0.0.1:19999/invalid"
  notify_on:
    - always
""")

print("=" * 60)
print("NOTIFICATION CONFIG PRIORITY TESTS")
print("=" * 60)
print()

passed = 0
failed = 0

for test in tests:
    print(f"[{test['name']}]")
    result = subprocess.run(test["cmd"], capture_output=True, text=True)

    exit_ok = result.returncode == test["expected_exit"]
    print(f"  Exit code: {result.returncode} (expected {test['expected_exit']}) {'✓' if exit_ok else '✗'}")

    check_ok = False
    try:
        check_ok = test["check"](result)
        print(f"  {test['check_desc']}: {'✓' if check_ok else '✗'}")
    except Exception as e:
        print(f"  Check error: {e}")
        print(f"  stdout preview: {result.stdout[:200]}...")

    if exit_ok and check_ok:
        passed += 1
        print("  RESULT: PASS")
    else:
        failed += 1
        print("  RESULT: FAIL")
    print()

print("=" * 60)
print(f"RESULT: {passed} passed, {failed} failed")
print("=" * 60)

sys.exit(0 if failed == 0 else 1)
