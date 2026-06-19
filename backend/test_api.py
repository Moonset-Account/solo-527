import requests
import json
from datetime import date

BASE = 'http://localhost:8001'

print("=" * 60)
print("心理咨询排班系统 - API功能测试")
print("=" * 60)

r = requests.post(f'{BASE}/api/auth/login', json={
    'username': 'dispatcher',
    'password': 'dispatcher123'
})
if r.status_code != 200:
    print(f"❌ 登录失败: {r.status_code} {r.text}")
    exit(1)
token = r.json()['access_token']
print("✅ 1. 登录成功，获取token")

headers = {'Authorization': f'Bearer {token}'}

r = requests.get(f'{BASE}/api/auth/me', headers=headers)
if r.status_code == 200:
    me = r.json()
    print(f"✅ 2. 获取当前用户: {me['real_name']} (角色: {me['role']})")

print()
print("--- 带日期参数的报表导出测试 ---")

r = requests.post(f'{BASE}/api/reports/export', json={
    'start_date': '2026-06-01',
    'end_date': '2026-06-30',
    'include_utilization': True,
    'include_conflicts': True,
    'include_operations': True
}, headers=headers)

if r.status_code == 200:
    task = r.json()
    task_id = task['task_id']
    print(f"✅ 3. 创建带日期范围的导出任务: task_id={task_id}, status={task['status']}")

    print(f"   request_data类型: {type(task['request_data'])}")
    print(f"   request_data内容: {json.dumps(task['request_data'], ensure_ascii=False)}")

    rd = task['request_data']
    start_date_val = rd.get('start_date')
    print(f"   start_date值: {start_date_val}, 类型: {type(start_date_val)}")
    if isinstance(start_date_val, str) or start_date_val is None:
        print("   ✅ request_data 中的日期是字符串类型（或None），可JSON序列化正常")
    else:
        print("   ❌ request_data 中的日期是 date 对象，无法JSON序列化")

    r = requests.get(f'{BASE}/api/reports/download/{task_id}', headers=headers, stream=True)
    if r.status_code == 200:
        ct = r.headers.get('content-type')
        cl = len(r.content)
        print(f"✅ 4. 下载Excel成功: {cl} bytes, type={ct}")
        cd = r.headers.get('content-disposition', '')
        print(f"    文件名头: {cd[:80]}")
        with open('/tmp/test_report_dates.xlsx', 'wb') as f:
            f.write(r.content)
        print(f"    已保存到 /tmp/test_report_dates.xlsx")
    else:
        print(f"❌ 下载失败: {r.status_code} - {r.text[:200]}")
else:
    print(f"❌ 创建导出任务失败: {r.status_code} - {r.text[:300]}")

print()
print("--- 任务监控测试 ---")

r = requests.get(f'{BASE}/api/tasks', headers=headers, params={'limit': 5})
if r.status_code == 200:
    tasks = r.json()
    print(f"✅ 5. 任务监控列表: {len(tasks)} 条")
    if tasks:
        latest = tasks[0]
        print(f"   最新任务: {latest['task_name']} - {latest['status']}")
        rd = latest.get('request_data') or {}
        sd = rd.get('start_date')
        print(f"   request_data中start_date类型: {type(sd)}")

print()
print("--- 任务预览测试 ---")
if 'task_id' in dir():
    r = requests.get(f'{BASE}/api/reports/{task_id}/preview', headers=headers)
    if r.status_code == 200:
        data = r.json()
        print(f"✅ 6. 任务预览成功")
        keys = list(data.keys())
        print(f"   包含数据: {keys}")
        if 'utilization' in data:
            print(f"   utilization列名: {list(data['utilization'][0].keys()) if data['utilization'] else '空'}")
        if 'conflicts' in data:
            print(f"   conflicts列名: {list(data['conflicts'][0].keys()) if data['conflicts'] else '空'}")
        if 'operations' in data:
            print(f"   operations列名: {list(data['operations'][0].keys()) if data['operations'] else '空'}")
        if 'summary' in data:
            print(f"   summary: {json.dumps(data['summary'], ensure_ascii=False)}")
    else:
        print(f"❌ 任务预览失败: {r.status_code} - {r.text[:200]}")

print()
print("=" * 60)
print("✅ 全部API测试完成！")
print("=" * 60)
