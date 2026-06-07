import json
import subprocess

TOKEN = "mock-jwt-token-eyJpZCI6IkEwMDEiLCJyb2xlIjoiYXRobGV0ZSJ9"
result = subprocess.run(
    ["curl", "-s", "-H", f"Authorization: Bearer {TOKEN}", 
     "http://localhost:3080/api/training/day/2026-04-17?athleteId=A001"],
    capture_output=True,
    text=True
)

d = json.loads(result.stdout)
print('hasAdjusted:', d.get('hasAdjusted'))
print('训练记录数:', len(d.get('data', [])))

for item in d.get('data', []):
    if item.get('plan', {}).get('adjusted'):
        print('\n--- 调整后的训练记录 ---')
        print('动作:', item['training']['exercise'])
        print('  原计划强度:', item['plan']['originalIntensity'])
        print('  调整后强度:', item['plan']['adjustedIntensity'])
        print('  实际强度:', item['training']['actualIntensity'])
        dev = item.get('deviation', {})
        print('  较调整计划偏差:', dev.get('intensityDeviation'), '%')
        print('  较原计划偏差:', dev.get('originalIntensityDeviation'), '%')
        print('  负荷偏差:', dev.get('loadDeviation'))
        break
