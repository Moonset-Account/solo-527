import requests
BASE = 'http://127.0.0.1:5001/api'

resp = requests.post(f'{BASE}/auth/login', json={'phone':'13800138000','password':'admin123'})
token = resp.json()['data']['token']
h = {'Authorization': f'Bearer {token}'}

# 测试多状态过滤
print('=== 测试多状态过滤 ===')
resp = requests.get(f'{BASE}/orders?status=pending,sorting,sorted&per_page=100', headers=h)
data = resp.json()
print(f'code={data["code"]}, msg={data["message"]}')
print(f'订单总数: {data["data"]["total"]}')
for o in data['data']['items'][:5]:
    print(f'  - {o["order_no"]} status={o["status"]}')

# 测试单状态过滤
print()
print('=== 测试单状态过滤 ===')
resp = requests.get(f'{BASE}/orders?status=pending&per_page=10', headers=h)
data = resp.json()
print(f'pending 状态订单数: {data["data"]["total"]}')

# 测试无 token 访问导出
print()
print('=== 测试无 token 导出 ===')
resp = requests.get(f'{BASE}/exports/orders')
print(f'无 token 导出 code={resp.status_code}: {resp.json()}')

# 测试普通用户导出
resp = requests.post(f'{BASE}/auth/login', json={'phone':'13900139000','password':'user123'})
user_token = resp.json()['data']['token']
uh = {'Authorization': f'Bearer {user_token}'}
resp = requests.get(f'{BASE}/exports/orders', headers=uh)
print(f'普通用户导出 code={resp.status_code}: {resp.json()}')

# 测试管理员导出
resp = requests.get(f'{BASE}/exports/orders', headers=h)
print(f'管理员导出 code={resp.status_code}')

# 测试普通用户审批退款（权限拦截）
print()
print('=== 测试普通用户审批退款 ===')
resp = requests.put(f'{BASE}/refunds/99999/approve', headers=uh, json={'approved': True})
print(f'普通用户审批 code={resp.status_code}: {resp.json()}')
