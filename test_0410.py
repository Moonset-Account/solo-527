import json
import subprocess

TOKEN = "mock-jwt-token-eyJpZCI6IkEwMDEiLCJyb2xlIjoiYXRobGV0ZSJ9"

result = subprocess.run(
    ["curl", "-s", "-H", f"Authorization: Bearer {TOKEN}", 
     "http://localhost:3080/api/training/day/2026-04-10"],
    capture_output=True,
    text=True
)

d = json.loads(result.stdout)
print('hasAdjusted:', d.get('hasAdjusted'))
print('训练记录数:', len(d.get('data', [])))

for i, item in enumerate(d.get('data', [])[:3]):
    print(f'\n--- 记录 {i+1} ---')
    print('动作:', item.get('training', {}).get('exercise'))
    print('计划存在:', item.get('plan') is not None)
    dev = item.get('deviation', {})
    if dev:
        print('强度偏差:', dev.get('intensityDeviation'))
        print('原强度偏差:', dev.get('originalIntensityDeviation'))
    else:
        print('deviation 为空')
