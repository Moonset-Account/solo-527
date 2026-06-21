import os
os.environ['DJANGO_SETTINGS_MODULE'] = 'procurement_system.settings'
os.environ['USE_SQLITE'] = 'true'
import django
django.setup()

import requests
import json

BASE = 'http://localhost:8088/api'

def login(email, password='test123456'):
    r = requests.post(f'{BASE}/token/', json={'email': email, 'password': password})
    return r.json()['access']

admin_tok = login('admin@example.com')
proc_tok = login('procurement@example.com')
project_tok = login('project@example.com')
duty_tok = login('duty@example.com')

def h(t): return {'Authorization': f'Bearer {t}'}

# ========== 步骤1：项目负责人从合同发起续签 ==========
print('=== 1. 项目负责人发起续签 ===')
# 用合同 HT-2026-E2E-002 (id=4)
r = requests.post(f'{BASE}/contracts/4/create_renewal/', headers=h(project_tok), json={
    'renewal_recommendation': '供应商表现良好，建议续签'
})
print(f'  状态: {r.status_code}')
if r.status_code == 201:
    renewal_id = r.json()['id']
    print(f'  续签记录ID: {renewal_id}')
else:
    print(f'  错误: {r.text[:200]}')
    # 可能已经有了，找一下
    r2 = requests.get(f'{BASE}/contracts/renewals/?original_contract=4&decision=pending', headers=h(admin_tok))
    results = r2.json().get('results', [])
    if results:
        renewal_id = results[0]['id']
        print(f'  找到现有续签记录: {renewal_id}')
    else:
        print('  无法获取续签记录')
        exit(1)

# ========== 步骤2：创建新合同（作为续签目标） ==========
print()
print('=== 2. 创建新合同（续签用） ===')
r = requests.post(f'{BASE}/contracts/', headers=h(proc_tok), json={
    'contract_number': 'HT-2027-E2E-RENEW',
    'title': '2027年度E2E续签合同',
    'supplier': 1,
    'project_manager': 3,
    'start_date': '2027-01-01',
    'end_date': '2027-12-31',
    'total_amount': 250000,
    'payment_terms': 'monthly',
    'status': 'active',
    'categories': [1, 3],
    'specifications': [1, 3],
    'price_lines': [
        {'specification': 1, 'unit_price': '28.00', 'minimum_quantity': 50, 'discount_rate': 5, 'effective_date': '2027-01-01'},
        {'specification': 3, 'unit_price': '540.00', 'minimum_quantity': 5, 'discount_rate': 10, 'effective_date': '2027-01-01'},
    ]
})
print(f'  状态: {r.status_code}')
if r.status_code == 201:
    new_contract_id = r.json()['id']
    print(f'  新合同ID: {new_contract_id}')
    new_prices = r.json()['prices']
    for p in new_prices:
        print(f'    {p["specification_name"]}: ¥{p["unit_price"]}')
else:
    print(f'  错误: {r.text[:300]}')
    exit(1)

# ========== 步骤3：值班人员尝试处理续签（应被拦截） ==========
print()
print('=== 3. 值班人员尝试处理续签（应被拦截） ===')
r = requests.post(f'{BASE}/contracts/renewals/{renewal_id}/handle/', headers=h(duty_tok), json={
    'decision': 'renewed',
    'new_contract': new_contract_id,
    'decision_reason': '测试'
})
print(f'  状态: {r.status_code} (预期403)')

# ========== 步骤4：项目负责人处理续签 ==========
print()
print('=== 4. 项目负责人处理续签 ===')
r = requests.post(f'{BASE}/contracts/renewals/{renewal_id}/handle/', headers=h(project_tok), json={
    'decision': 'renewed',
    'new_contract': new_contract_id,
    'decision_reason': '价格合理，同意续签'
})
print(f'  状态: {r.status_code}')
if r.status_code == 200:
    print(f'  决策: {r.json()["decision_display"]}')
    print(f'  原因: {r.json()["decision_reason"]}')

# ========== 步骤5：验证原合同状态变为expired ==========
print()
print('=== 5. 原合同状态 ===')
r = requests.get(f'{BASE}/contracts/4/', headers=h(admin_tok))
print(f'  原合同状态: {r.json()["status_display"]}')

# ========== 步骤6：验证新合同价格历史有续签标记 ==========
print()
print('=== 6. 新合同价格历史（应有续签标记） ===')
r = requests.get(f'{BASE}/contracts/price-histories/?contract={new_contract_id}&ordering=created_at', headers=h(admin_tok))
for hh in r.json()['results']:
    print(f'  {hh["specification_name"]}: ¥{hh["unit_price"]} - {hh["change_reason"]}')

# ========== 步骤7：价格看板显示续签后的价格 ==========
print()
print('=== 7. 价格波动看板（规格1 A4复印纸） ===')
r = requests.get(f'{BASE}/contracts/price-histories/fluctuation/?specification=1&months=24', headers=h(admin_tok))
data = r.json()
print(f'  月度数据点: {len(data)}')
for d in data:
    print(f'    {d["month"]}: 均价¥{d["avg_price"]:.2f}')

print()
print('=== 续签流程验证完成 ===')
