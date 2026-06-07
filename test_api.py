import sys
sys.path.insert(0, '.')
import requests
import json
import time

BASE = "http://localhost:8050"

print("=" * 60)
print("API 功能验证")
print("=" * 60)

print("\n1. 健康检查 /api/health")
r = requests.get(f"{BASE}/api/health")
print(f"   状态码: {r.status_code}")
print(f"   响应: {json.dumps(r.json(), ensure_ascii=False)}")

print("\n2. 不存在的导出任务 /api/export/status/xxx")
r = requests.get(f"{BASE}/api/export/status/non-existent-id")
print(f"   状态码: {r.status_code} (期望404)")
print(f"   响应: {json.dumps(r.json(), ensure_ascii=False)}")

print("\n3. 提交导出任务 /api/export/submit")
payload = {
    "filters": {
        "risk_tags": ["色情"],
        "queue_types": ["人审-高优"],
        "reviewers": ["r001"],
        "shifts": ["早班"],
        "sources": ["首页推荐"],
        "time_start": "2026-06-06T00:00:00",
        "time_end": "2026-06-07T00:00:00",
        "granularity": "1h"
    },
    "export_type": "review_logs",
    "format": "xlsx"
}
r = requests.post(f"{BASE}/api/export/submit", json=payload)
print(f"   状态码: {r.status_code}")
task_id = r.json().get("task_id")
print(f"   任务ID: {task_id}")

print("\n4. 轮询任务状态")
for i in range(3):
    time.sleep(1.5)
    r = requests.get(f"{BASE}/api/export/status/{task_id}")
    data = r.json()
    print(f"   轮询{i+1}: 状态={data.get('status')}, 进度={data.get('progress')}%, 下载地址={data.get('download_url')}")
    if data.get("status") == "completed":
        break

print("\n5. 测试 API 筛选参数 - /api/funnel (完整5个维度)")
payload = {
    "risk_tags": ["色情", "暴力"],
    "queue_types": ["人审-高优"],
    "reviewers": ["r001", "r002"],
    "shifts": ["早班"],
    "sources": ["首页推荐"],
    "time_start": "2026-06-06T00:00:00",
    "time_end": "2026-06-07T00:00:00",
    "granularity": "1h"
}
r = requests.post(f"{BASE}/api/funnel", json=payload)
print(f"   状态码: {r.status_code}")
data = r.json()
print(f"   漏斗步骤数: {len(data.get('data', []))}")
print(f"   应用的筛选: {list(data.get('filters_applied', {}).keys())}")

print("\n6. 测试 API 筛选参数 - /api/workload (完整5个维度)")
r = requests.post(f"{BASE}/api/workload", json=payload)
print(f"   状态码: {r.status_code}")
data = r.json()
print(f"   负载项数: {len(data.get('data', []))}")

print("\n7. 测试 API 筛选参数 - /api/appeal (完整5个维度)")
r = requests.post(f"{BASE}/api/appeal", json=payload)
print(f"   状态码: {r.status_code}")
data = r.json()
print(f"   申诉项数: {len(data.get('data', []))}")

print("\n" + "=" * 60)
print("✅ 所有 API 测试完成！")
print("=" * 60)
