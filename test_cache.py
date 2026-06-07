import json
import subprocess

TOKEN = "mock-jwt-token-eyJpZCI6IkEwMDEiLCJyb2xlIjoiYXRobGV0ZSJ9"

# 第一次请求（应该是缓存未命中）
print("=== 第一次请求 ===")
result = subprocess.run(
    ["curl", "-s", "-H", f"Authorization: Bearer {TOKEN}", 
     "http://localhost:3080/api/training/day/2026-04-11"],
    capture_output=True,
    text=True
)

d = json.loads(result.stdout)
print('hasAdjusted:', d.get('hasAdjusted'))
print('训练记录数:', len(d.get('data', [])))
print('cached:', d.get('_meta', {}).get('cached'))
print('cacheKey:', d.get('_meta', {}).get('cacheKey'))

# 第二次请求（应该是缓存命中）
print("\n=== 第二次请求 ===")
result2 = subprocess.run(
    ["curl", "-s", "-H", f"Authorization: Bearer {TOKEN}", 
     "http://localhost:3080/api/training/day/2026-04-11"],
    capture_output=True,
    text=True
)

d2 = json.loads(result2.stdout)
print('hasAdjusted:', d2.get('hasAdjusted'))
print('训练记录数:', len(d2.get('data', [])))
print('cached:', d2.get('_meta', {}).get('cached'))

# 如果有数据，打印前 2 条
items = d2.get('data', [])
if len(items) > 0:
    print("\n=== 数据样本 ===")
    for i, item in enumerate(items[:2]):
        print(f'  [{i+1}] 动作:', item.get('training', {}).get('exercise'))
        dev = item.get('deviation', {})
        print('      强度偏差:', dev.get('intensityDeviation'))
        print('      计划调整:', item.get('plan', {}).get('adjusted'))
else:
    print("\n返回的原始数据:")
    print(json.dumps(d2, indent=2, ensure_ascii=False)[:500])
