#!/usr/bin/env python3
"""Quick exit code verification tests."""
import subprocess
import os
import sys

os.chdir(os.path.dirname(os.path.abspath(__file__)))

tests = [
    ("Hash mismatch (expect 3)", ["python3", "run_bic.py", "check", "--manifest", "examples/manifest-hash-mismatch.yaml", "--backup-dir", "examples/backup-dir", "--no-expired"], 3),
    ("Missing file (expect 4)", ["python3", "run_bic.py", "check", "--manifest", "examples/manifest-missing-file.yaml", "--backup-dir", "examples/backup-dir", "--no-expired", "--no-integrity"], 4),
    ("Expired + fail (expect 5)", ["python3", "run_bic.py", "check", "--manifest", "examples/manifest-expired.yaml", "--backup-dir", "examples/backup-dir", "--retention", "30", "--fail-on-expired"], 5),
    ("Expired no-fail (expect 0)", ["python3", "run_bic.py", "check", "--manifest", "examples/manifest-expired.yaml", "--backup-dir", "examples/backup-dir", "--retention", "30"], 0),
    ("Invalid manifest (expect 6)", ["python3", "run_bic.py", "check", "--manifest", "examples/manifest-invalid.yaml", "--backup-dir", "examples/backup-dir", "--no-expired"], 6),
    ("Valid + dry-run (expect 0)", ["python3", "run_bic.py", "--dry-run", "check", "--manifest", "examples/manifest-valid.yaml", "--backup-dir", "examples/backup-dir", "--no-expired"], 0),
    ("no-fail-on-missing (expect 0)", ["python3", "run_bic.py", "check", "--manifest", "examples/manifest-missing-file.yaml", "--backup-dir", "examples/backup-dir", "--no-expired", "--no-integrity", "--no-fail-on-missing"], 0),
    ("Config dry_run=true (expect 0)", ["python3", "run_bic.py", "-c", "/tmp/test-config-priority.yaml", "check", "-m", "examples/manifest-valid.yaml", "-b", "examples/backup-dir"], 0),
    ("Notify fail (expect 8)", ["python3", "run_bic.py", "--json", "-c", "/tmp/test-notify-fail.yaml", "check", "-m", "examples/manifest-valid.yaml", "-b", "examples/backup-dir", "--notify"], 8),
]

print("=" * 60)
print("EXIT CODE VERIFICATION")
print("=" * 60)

passed = 0
failed = 0

for name, cmd, expected in tests:
    r = subprocess.run(cmd, capture_output=True)
    status = "PASS" if r.returncode == expected else "FAIL"
    if status == "PASS":
        passed += 1
    else:
        failed += 1
    print(f"  [{status}] {name}: got {r.returncode} (expected {expected})")

print()
print(f"Result: {passed} passed, {failed} failed")
sys.exit(0 if failed == 0 else 1)
