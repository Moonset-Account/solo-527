import json
import subprocess

TOKEN = "mock-jwt-token-eyJpZCI6IkEwMDEiLCJyb2xlIjoiYXRobGV0ZSJ9}"

# 第一次请求 - 缓存未命中
result1 = subprocess.run(
    ["curl", "-s", "-H", f"Authorization: Bearer {TOKEN}", 
     "http://localhost:3080/api/training/load-curve?athleteId=A001"],
    capture_output=True, text=True
)
d1 = json.loads(result1.stdout)
print('=== 负荷曲线 - 第一次请求 ===')
print('  cached:', d1.get('_meta', {}).get('cached'))
print('  数据点:', len(d1.get('data', [])))
print('  异常点:', len(d1.get('anomalies', [])))

# 第二次请求 - 缓存命中
result2 = subprocess.run(
    ["curl", "-s", "-H", f"Authorization: Bearer {TOKEN}", 
     "http://localhost:3080/api/training/load-curve?athleteId=A001"],
    capture_output=True, text=True
)
d2 = json.loads(result2.stdout)
print('\n=== 负荷曲线 - 第二次请求 ===')
print('  cached:', d2.get('_meta', {}).get('cached'))
print('  数据点:', len(d2.get('data', [])))

# 当日训练偏差
result3 = subprocess.run(
    ["curl", "-s", "-H", f"Authorization: Bearer {TOKEN}", 
     "http://localhost:3080/api/training/day/2026-04-10"],
    capture_output=True, text=True
)
d3 = json.loads(result3.stdout)
print('\n=== 当日训练详情 (2026-04-10) ===')
print('  cached:', d3.get('_meta', {}).get('cached'))
print('  hasAdjusted:', d3.get('hasAdjusted'))
print('  记录数:', len(d3.get('data', [])))

# 训练计划
result4 = subprocess.run(
    ["curl", "-s", "-H", f"Authorization: Bearer {TOKEN}", 
     "http://localhost:3080/api/training-plans?athleteId=A001"],
    capture_output=True, text=True
)
d4 = json.loads(result4.stdout)
adjusted = [p for p in d4 if p.get('adjusted')]
print(f'\n=== 训练计划 (A001) ===')
print(f'  总计划数: {len(d4)}, 调整数: {len(adjusted)}')
if adjusted:
    p = adjusted[0]
    print(f'  第一个调整: {p["date"]} {p["exercise"]}')
    print(f'    原强度: {p.get("originalIntensity")}, 调整后: {p.get("adjustedIntensity")}')
    dev = p.get('deviation', {})
    print(f'    强度偏差: {dev.get("intensityDeviation")}, 原强度偏差: {dev.get("originalIntensityDeviation")}')
