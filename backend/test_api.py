import requests
import json

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
else:
    print(f"❌ 获取用户失败: {r.status_code}")

r = requests.get(f'{BASE}/api/counselors', headers=headers)
if r.status_code == 200:
    counselors = r.json()
    print(f"✅ 3. 咨询师列表: {len(counselors)} 条")
else:
    print(f"❌ 咨询师列表失败: {r.status_code}")

r = requests.get(f'{BASE}/api/time-slots', headers=headers)
if r.status_code == 200:
    slots = r.json()
    print(f"✅ 4. 时段列表: {len(slots)} 条")
else:
    print(f"❌ 时段列表失败: {r.status_code}")

r = requests.get(f'{BASE}/api/schedules', headers=headers)
if r.status_code == 200:
    schedules = r.json()
    print(f"✅ 5. 排班列表: {len(schedules)} 条")
else:
    print(f"❌ 排班列表失败: {r.status_code}")

r = requests.get(f'{BASE}/api/appointments', headers=headers)
if r.status_code == 200:
    appts = r.json()
    print(f"✅ 6. 预约列表: {len(appts) if isinstance(appts, list) else 0} 条")
else:
    print(f"❌ 预约列表失败: {r.status_code}")

r = requests.get(f'{BASE}/api/no-show-list', headers=headers)
if r.status_code == 200:
    ns = r.json()
    print(f"✅ 7. 爽约名单: {len(ns)} 条")
else:
    print(f"❌ 爽约名单失败: {r.status_code}")

r = requests.get(f'{BASE}/api/operation-logs', headers=headers, params={'limit': 10})
if r.status_code == 200:
    logs = r.json()
    print(f"✅ 8. 操作日志: {len(logs)} 条")
else:
    print(f"❌ 操作日志失败: {r.status_code}")

print()
print("--- 报表导出测试 ---")

r = requests.post(f'{BASE}/api/reports/export', json={
    'include_utilization': True,
    'include_conflicts': True,
    'include_operations': True
}, headers=headers)

if r.status_code == 200:
    task = r.json()
    task_id = task['task_id']
    print(f"✅ 9. 创建导出任务: task_id={task_id}, status={task['status']}")

    r = requests.get(f'{BASE}/api/reports/download/{task_id}', headers=headers, stream=True)
    if r.status_code == 200:
        ct = r.headers.get('content-type')
        cl = len(r.content)
        print(f"✅ 10. 下载Excel成功: {cl} bytes, type={ct}")
        cd = r.headers.get('content-disposition', '')
        print(f"    文件名头: {cd[:80]}")
        with open('/tmp/test_report.xlsx', 'wb') as f:
            f.write(r.content)
        print(f"    已保存到 /tmp/test_report.xlsx")
    else:
        print(f"❌ 下载失败: {r.status_code} - {r.text[:200]}")
else:
    print(f"❌ 创建导出任务失败: {r.status_code} - {r.text[:300]}")

r = requests.get(f'{BASE}/api/tasks', headers=headers, params={'limit': 5})
if r.status_code == 200:
    tasks = r.json()
    print(f"✅ 11. 任务监控列表: {len(tasks)} 条")
else:
    print(f"❌ 任务列表失败: {r.status_code}")

print()
print("=" * 60)
print("✅ 全部API测试完成！")
print("=" * 60)
