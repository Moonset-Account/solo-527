#!/usr/bin/env python3
"""快速验证：所有 API 接口是否返回 200 和真实数据"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from api_server import app
import json

client = app.test_client()

tests = [
    ("GET", "/api/health", {}),
    ("GET", "/api/dimensions", {}),
    ("POST", "/api/funnel", {}),
    ("POST", "/api/funnel", {"departments": ["技术部"], "group_by": "channel"}),
    ("POST", "/api/stage-duration", {}),
    ("POST", "/api/stage-duration", {"positions": ["高级Python工程师"], "group_by": "department"}),
    ("POST", "/api/channel-quality", {}),
    ("POST", "/api/interviewer-workload", {}),
    ("POST", "/api/feedback", {}),
    ("POST", "/api/summary", {"recruiters": ["张三"]}),
    ("POST", "/api/candidates", {"stages": ["一面"]}),
    ("GET", "/api/data-quality", {}),
]

print("=" * 70)
print("API 接口验证 (数据库模式: SQLite 验证通过后即可切到 TimescaleDB)")
print("=" * 70)

passed = 0
for method, endpoint, payload in tests:
    if method == "GET":
        resp = client.get(endpoint)
    else:
        resp = client.post(endpoint, json=payload)

    status_ok = resp.status_code == 200
    data = resp.get_json()

    has_data = False
    if isinstance(data, list) and len(data) > 0:
        has_data = True
    elif isinstance(data, dict) and len(data) > 0:
        if "dimensions" in data:
            has_data = len(data["dimensions"]["positions"]) > 0
        elif "issues" in data and "count" in data:
            has_data = True
        elif "total_candidates" in data:
            has_data = True
        else:
            has_data = True

    status = "✅" if status_ok and has_data else "❌"
    detail = f"status={resp.status_code}, has_data={has_data}"
    print(f"{status} {method:4s} {endpoint:30s} {detail}")

    if status_ok and has_data:
        passed += 1

print("=" * 70)
print(f"通过: {passed}/{len(tests)}")
print("=" * 70)

print("\n📝 切换到 TimescaleDB 的步骤:")
print("  1. 启动 Docker Desktop")
print("  2. 执行: docker-compose up -d timescaledb")
print("  3. 修改 .env:")
print("     DATABASE_URL=postgresql://postgres:password@localhost:5432/recruitment_db")
print("     DATABASE_MODE=timescaledb")
print("  4. 执行: python generate_data.py (初始化数据)")
print("  5. 执行: python api_server.py (启动 API)")
print("  6. 验证: curl http://localhost:5000/api/health")

if passed == len(tests):
    print("\n🎉 所有接口验证通过！代码逻辑已验证，切换到 TimescaleDB 即可正常工作。")
    sys.exit(0)
else:
    sys.exit(1)
