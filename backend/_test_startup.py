#!/usr/bin/env python3
"""
⚠️  ⚠️  ⚠️  此文件已废弃 ⚠️  ⚠️  ⚠️

请运行隔离后的测试脚本（零污染真实数据库）：

  cd backend
  python3 -m tests.test_startup   # 启动/登录/路由验证
  python3 -m tests.test_rollback  # 严格模式 rollback 双分支验证

此文件仅保留占位，不执行任何操作，避免误删 app.db 或插入脏数据。
"""
import sys

def _stub():
    print(__doc__)
    sys.exit(0)

if __name__ == "__main__":
    _stub()
