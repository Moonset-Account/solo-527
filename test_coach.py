import json
import subprocess

# 测试教练端 token
COACH_TOKEN = "mock-jwt-token-eyJpZCI6IkMwMDEiLCJyb2xlIjoiY29hY2gifQ=="

result = subprocess.run(
    ["curl", "-s", "-H", f"Authorization: Bearer {COACH_TOKEN}", 
     "http://localhost:3080/api/training/day/2026-04-10?athleteId=A001"],
    capture_output=True,
    text=True
)

d = json.loads(result.stdout)
print('教练端 hasAdjusted:', d.get('hasAdjusted'))
print('教练端 训练记录数:', len(d.get('data', [])))

for i, item in enumerate(d.get('data', [])[:3]):
    print(f'\n--- 记录 {i+1} ---')
    print('动作:', item.get('training', {}).get('exercise'))
    dev = item.get('deviation', {})
    if dev:
        print('强度偏差:', dev.get('intensityDeviation'))
        print('原强度偏差:', dev.get('originalIntensityDeviation'))
        print('负荷偏差:', dev.get('loadDeviation'))
        print('计划调整:', item.get('plan', {}).get('adjusted'))
    else:
        print('deviation 为空')
