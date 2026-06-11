#!/usr/bin/env python3
"""Wrapper script to run backup integrity checker with correct path."""

import sys
from pathlib import Path

project_root = Path(__file__).resolve().parent
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

from backup_checker.cli import main

if __name__ == "__main__":
    main()
