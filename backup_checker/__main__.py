"""允许通过 `python -m backup_checker` 执行。"""
from .cli import main

if __name__ == "__main__":
    raise SystemExit(main())
