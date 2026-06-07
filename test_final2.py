import json
import subprocess

TOKEN = "mock-jwt-token-eyJpZCI6IkEwMDEiLCJyb2xlIjoiYXRobGV0ZSJ9}"

# 训练计划偏差
result = subprocess.run(
    ["curl", "-s", "-H", f"Authorization: Bearer {TOKEN}", 
     "http://localhost:3080/api/training-plans?athleteId=A001"],
    capture_output=True, text=True
)
d = json.loads(result.stdout)
adjusted = [p for p in d if p.get('adjusted')]
print(f'=== 训练计划 (A001) ===')
print(f'总计划数: {len(d)}, 调整数: {len(adjusted)}')
if adjusted:
    p = adjusted[0]
    print(f'第一个调整: {p["date"]} {p["exercise"]}')
    print(f'  原强度: {p.get("originalIntensity")}, 调整后: {p.get("adjustedIntensity")}')
    dev = p.get('deviation', {})
    print(f'  deviation: {dev}')
    if dev:
        print(f'  强度偏差: {dev.get("intensityDeviation")}, 原强度偏差: {dev.get("originalIntensityDeviation")}')

# 当日训练偏差
result2 = subprocess.run(
    ["curl", "-s", "-H", f"Authorization: Bearer {TOKEN}", 
     "http://localhost:3080/api/training/day/2026-04-10"],
    capture_output=True, text=True
)
d2 = json.loads(result2.stdout)
print(f'\n=== 当日训练 (2026-04-10) ===')
print(f'hasAdjusted: {d2.get("hasAdjusted")}')
for i, item in enumerate(d2.get('data', [])[:2]):
    print(f'  [{i+1}] {item["training"]["exercise"]}')
    dev = item.get('deviation', {})
    print(f'    deviation: {dev}')

# Redis 缓存验证 - 第二次请求
result3 = subprocess.run(
    ["curl", "-s", "-H", f"Authorization: Bearer {TOKEN}", 
     "http://localhost:3080/api/training-plans?athleteId=A001"],
    capture_output=True, text=True
)
d3 = json.loads(result3.stdout)
# 检查是否有 cached 标志
# 注: 训练计划直接返回数组，不带 _meta

# 系统统计
COACH_TOKEN = "mock-jwt-token-eyJpZCI6IkMwMDEiLCJyb2xlIjoiY29hY2gifQ=="
result4 = subprocess.run(
    ["curl", "-s", "-H", f"Authorization: Bearer {COACH_TOKEN}", 
     "http://localhost:3080/api/system/stats"],
    capture_output=True, text=True
)
d4 = json.loads(result4.stdout)
print(f'\n=== 系统统计 ===')
ch = d4.get('clickhouse', {})
rd = d4.get('redis', {})
print(f'ClickHouse 查询数: {ch.get("total_queries", 0)}')
print(f'Redis keys: {rd.get("keys", 0)}, hits: {rd.get("hits", 0)}, hit_rate: {rd.get("hit_rate", "0%")}')
