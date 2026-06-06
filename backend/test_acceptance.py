import requests
import json

BASE = 'http://127.0.0.1:5001/api'

def login(phone, password):
    resp = requests.post(f'{BASE}/auth/login', json={'phone': phone, 'password': password})
    return resp.json()['data']['token']

admin_token = login('13800138000', 'admin123')
user_token = login('13900139000', 'user123')

ah = {'Authorization': f'Bearer {admin_token}'}
uh = {'Authorization': f'Bearer {user_token}'}

passed = 0
failed = 0

def test(name, actual, expected):
    global passed, failed
    ok = actual == expected
    if ok:
        passed += 1
        print(f'  ✅ {name}')
    else:
        failed += 1
        print(f'  ❌ {name}: 期望={expected}, 实际={actual}')
    return ok

print('=' * 60)
print('【新增路径】权限拦截和异常提示测试')
print('=' * 60)

# 1. 普通用户访问内部订单列表（403）
resp = requests.get(f'{BASE}/orders', headers=uh)
test('普通用户访问内部订单列表 - 403', resp.status_code, 403)
test('返回信息包含"权限不足"', '权限' in resp.json().get('message', ''), True)

# 2. 管理员访问订单列表 - 正常
resp = requests.get(f'{BASE}/orders?per_page=10', headers=ah)
test('管理员访问订单列表 - 200', resp.status_code, 200)

# 3. 记录缺货 - 订单项不存在（404）
resp = requests.post(f'{BASE}/shortages', headers=ah, json={
    'order_item_id': 99999,
    'shortage_quantity': 1
})
test('记录缺货 - 订单项不存在 - 404', resp.status_code, 404)

# 4. 用户创建退款申请 - 正常
# 先找一个用户的订单
resp = requests.get(f'{BASE}/orders/my?per_page=1', headers=uh)
user_order = resp.json()['data']['items'][0] if resp.json()['data']['items'] else None
if user_order:
    order_id = user_order['id']
    order_item_id = user_order['items'][0]['id'] if user_order['items'] else None
    if order_item_id:
        resp = requests.post(f'{BASE}/refunds', headers=uh, json={
            'order_item_id': order_item_id,
            'reason': '测试退款申请',
            'amount': 10.0
        })
        test('用户创建退款申请 - 200', resp.status_code, 200)
    else:
        print('  ⚠️  跳过: 用户订单无订单项')
else:
    print('  ⚠️  跳过: 用户暂无订单')

print()
print('=' * 60)
print('【审批路径】权限拦截和异常提示测试')
print('=' * 60)

# 1. 普通用户审批退款（403）
resp = requests.post(f'{BASE}/refunds/99999/approve', headers=uh, json={'remark': 'test'})
test('普通用户审批退款 - 403', resp.status_code, 403)
test('返回信息包含"权限"', '权限' in resp.json().get('message', ''), True)

# 2. 审批不存在的退款（404）
resp = requests.post(f'{BASE}/refunds/99999/approve', headers=ah, json={'remark': 'test'})
test('审批不存在的退款 - 404', resp.status_code, 404)
test('返回信息包含"不存在"', '不存在' in resp.json().get('message', ''), True)

# 3. 管理员提交缺货替换方案 - 正常
# 先找一个缺货记录
resp = requests.get(f'{BASE}/shortages?per_page=1', headers=ah)
shortage = resp.json()['data']['items'][0] if resp.json()['data']['items'] else None
if shortage:
    shortage_id = shortage['id']
    resp = requests.post(f'{BASE}/shortages/{shortage_id}/propose', headers=ah, json={
        'replace_product_name': '替换商品',
        'replace_quantity': 1,
        'replace_unit': '份'
    })
    test('管理员提交替换方案 - 200 或 400(状态不正确)', resp.status_code in [200, 400], True)
else:
    print('  ⚠️  跳过: 暂无缺货记录')

print()
print('=' * 60)
print('【撤回路径】权限拦截和异常提示测试')
print('=' * 60)

# 1. 撤回不存在的退款（404）
resp = requests.post(f'{BASE}/refunds/99999/withdraw', headers=uh)
test('撤回不存在的退款 - 404', resp.status_code, 404)
test('返回信息包含"不存在"', '不存在' in resp.json().get('message', ''), True)

# 2. 截单后取消订单 - 业务逻辑拦截
# 先找一个已截单的订单
resp = requests.get(f'{BASE}/orders?is_cutoff=true&per_page=1', headers=ah)
cutoff_order = resp.json()['data']['items'][0] if resp.json()['data']['items'] else None
if cutoff_order:
    order_id = cutoff_order['id']
    resp = requests.put(f'{BASE}/orders/my/{order_id}/cancel', headers=uh)
    test('截单后取消订单 - 400 拦截', resp.status_code, 400)
else:
    print('  ⚠️  跳过: 暂无已截单订单')

print()
print('=' * 60)
print('【导出路径】权限拦截和异常提示测试')
print('=' * 60)

# 1. 无 token 导出订单（401）
resp = requests.get(f'{BASE}/exports/orders')
test('无 token 导出订单 - 401', resp.status_code, 401)

# 2. 普通用户导出订单（403）
resp = requests.get(f'{BASE}/exports/orders', headers=uh)
test('普通用户导出订单 - 403', resp.status_code, 403)
test('返回信息包含"内部账号权限"', '内部' in resp.json().get('message', ''), True)

# 3. 管理员导出订单 - 200
resp = requests.get(f'{BASE}/exports/orders', headers=ah)
test('管理员导出订单 - 200', resp.status_code, 200)

# 4. 管理员导出分拣单 - 200
# 先找一个楼栋
from random import randint
building_id = 1
resp = requests.get(f'{BASE}/exports/sorting/{building_id}', headers=ah)
test(f'管理员导出分拣单(楼栋{building_id}) - 200 或 404', resp.status_code in [200, 404], True)

# 5. 管理员导出退款 - 200
resp = requests.get(f'{BASE}/exports/refunds', headers=ah)
test('管理员导出退款 - 200', resp.status_code, 200)

# 6. 管理员导出缺货 - 200
resp = requests.get(f'{BASE}/exports/shortages', headers=ah)
test('管理员导出缺货 - 200', resp.status_code, 200)

print()
print('=' * 60)
print(f'测试结果: 通过 {passed} / 总 {passed + failed}')
print('=' * 60)
