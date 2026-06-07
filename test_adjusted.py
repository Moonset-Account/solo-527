import json
import subprocess

TOKEN = "mock-jwt-token-eyJpZCI6IkEwMDEiLCJyb2xlIjoiYXRobGV0ZSJ9}"

# 找一个有调整计划的日期
result = subprocess.run(
    ["curl", "-s", "-H", f"Authorization: Bearer {TOKEN}", 
     "http://localhost:3080/api/training-plans?athleteId=A001"],
    capture_output=True, text=True
)
d = json.loads(result.stdout)
adjusted = [p for p in d if p.get('adjusted')]

# 取有 actual 数据的调整计划
for p in adjusted[:5]:
    date = p['date']
    exercise = p['exercise']
    print(f'\n检查: {date} {exercise}')
    
    # 查看当日训练
    result2 = subprocess.run(
        ["curl", "-s", "-H", f"Authorization: Bearer {TOKEN}", 
         f"http://localhost:3080/api/training/day/{date}"],
        capture_output=True, text=True
    )
    d2 = json.loads(result2.stdout)
    items = d2.get('data', [])
    print(f'  hasAdjusted: {d2.get("hasAdjusted")}')
    print(f'  训练数: {len(items)}')
    
    # 找调整项
    for item in items:
        if item.get('plan', {}).get('adjusted'):
            print(f'  找到调整项: {item["training"]["exercise"]}')
            print(f'    原强度: {item["plan"]["originalIntensity"]}')
            print(f'    调整后: {item["plan"]["adjustedIntensity"]}')
            print(f'    deviation: {item.get("deviation")}')
            break
    else:
        print('  未找到调整项')
    
    if d2.get('hasAdjusted') and len(items) > 0:
        break
