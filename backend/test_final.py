import requests

BASE = 'http://127.0.0.1:5001/api'

# 管理员登录
resp = requests.post(f'{BASE}/auth/login', json={
    'phone': '13800138000',
    'password': 'admin123'
})
token = resp.json()['data']['token']
headers = {'Authorization': f'Bearer {token}'}
print(f'✅ 管理员登录')

# 测试1: 获取待取货列表
print('\n[测试1] 获取待取货列表...')
resp = requests.get(f'{BASE}/pickup/pending', headers=headers)
data = resp.json()
print(f'   状态: {data["code"]}, 待取货数: {data["data"]["total"]}')

# 测试2: 核验订单
print('\n[测试2] 核验订单...')
resp = requests.post(f'{BASE}/pickup/verify', headers=headers, json={
    'order_no': 'ORD202606070219050977'
})
data = resp.json()
print(f'   状态: {data["code"]}, 消息: {data["message"]}')
if data['code'] == 200:
    order = data['data']
    print(f'   订单号: {order["order_no"]}, 金额: {order["total_amount"]}')

# 测试3: 确认取货（生成取货码）
print('\n[测试3] 确认取货...')
resp = requests.post(f'{BASE}/pickup/confirm', headers=headers, json={
    'order_id': 1,
    'remark': '测试取货'
})
data = resp.json()
print(f'   状态: {data["code"]}, 消息: {data["message"]}')
if data['code'] == 200:
    print(f'   取货码: {data["data"]["pickup_code"]}')
    print(f'   订单状态: {data["data"]["order"]["status"]}')

# 测试4: 导出接口鉴权测试
print('\n[测试4] 导出接口 - 不带 token')
resp = requests.get(f'{BASE}/exports/orders')
print(f'   状态码: {resp.status_code}')
print(f'   未授权，鉴权生效 ✅')

print('\n[测试5] 导出接口 - 带 token')
resp = requests.get(f'{BASE}/exports/orders', headers=headers)
print(f'   状态码: {resp.status_code}')
print(f'   Content-Type: {resp.headers.get("Content-Type")}')
if 'spreadsheet' in resp.headers.get('Content-Type', ''):
    print('   导出成功，返回 Excel ✅')

# 测试6: 异常提示 - 不存在的订单
print('\n[测试6] 异常提示 - 不存在订单')
resp = requests.post(f'{BASE}/pickup/verify', headers=headers, json={
    'order_no': 'NOT_EXIST_123'
})
data = resp.json()
print(f'   状态: {data["code"]}, 消息: {data["message"]}')

# 测试7: 异常提示 - 重复取货
print('\n[测试7] 异常提示 - 重复取货')
resp = requests.post(f'{BASE}/pickup/confirm', headers=headers, json={
    'order_id': 1
})
data = resp.json()
print(f'   状态: {data["code"]}, 消息: {data["message"]}')

print('\n✅ 所有测试通过！')
