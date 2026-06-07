import json
import subprocess

TOKEN = "mock-jwt-token-eyJpZCI6IkEwMDEiLCJyb2xlIjoiYXRobGV0ZSJ9}"

# 测试不带 athleteId
result1 = subprocess.run(
    ["curl", "-s", "-H", f"Authorization: Bearer {TOKEN}", 
     "http://localhost:3080/api/training/day/2026-04-10"],
    capture_output=True,
    text=True
)
d1 = json.loads(result1.stdout)
print('队员端不带 athleteId - 记录数:', len(d1.get('data', [])))

# 测试带 athleteId=A001
result2 = subprocess.run(
    ["curl", "-s", "-H", f"Authorization: Bearer {TOKEN}", 
     "http://localhost:3080/api/training/day/2026-04-10?athleteId=A001"],
    capture_output=True,
    text=True
)
d2 = json.loads(result2.stdout)
print('队员端带 athleteId=A001 - 记录数:', len(d2.get('data', [])))

# 测试训练对比接口
COACH_TOKEN = "mock-jwt-token-eyJpZCI6IkMwMDEiLCJyb2xlIjoiY29hY2gifQ=="
result3 = subprocess.run(
    ["curl", "-s", "-H", f"Authorization: Bearer {COACH_TOKEN}", 
     "http://localhost:3080/api/training/comparison?athleteIds=A001&athleteIds=A002"],
    capture_output=True,
    text=True
)
d3 = json.loads(result3.stdout)
print('\n训练对比 - 队员数:', len(d3) if isinstance(d3, list) else 0)

# 测试 Redis 缓存命中
print('\n=== 缓存测试 ===')
result4 = subprocess.run(
    ["curl", "-s", "-H", f"Authorization: Bearer {TOKEN}", 
     "http://localhost:3080/api/training/day/2026-04-10"],
    capture_output=True,
    text=True
)
d4 = json.loads(result4.stdout)
print('第二次查询 - cached:', d4.get('_meta', {}).get('cached'))
print('第二次查询 - 记录数:', len(d4.get('data', [])))
