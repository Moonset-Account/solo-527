import httpx

base = 'http://localhost:8080'
client = httpx.Client()

print("=== 角色权限测试 ===")

r = client.post(f'{base}/api/auth/login', json={'username': 'tenant01', 'password': '123456'})
cookies = r.cookies
print(f'租客登录: {r.status_code}')

r = client.get(f'{base}/api/risks/', cookies=cookies)
print(f'租客访问风险(应403): {r.status_code}')

r = client.get(f'{base}/api/deposits/', cookies=cookies)
print(f'租客访问押金(应403): {r.status_code}')

r = client.get(f'{base}/api/apartments/', cookies=cookies)
print(f'租客访问房源(应200): {r.status_code}')

r = client.post(f'{base}/api/apartments/', json={'apartment_no': 'T1', 'monthly_rent': 1000}, cookies=cookies)
print(f'租客创建房源(应403): {r.status_code}')

r = client.post(f'{base}/api/appointments/', json={
    'apartment_id': 1,
    'appointment_date': '2026-06-20',
    'appointment_time': '10:00',
    'tenant_name': '测试'
}, cookies=cookies)
print(f'租客创建预约(应200): {r.status_code}')

print()
print("=== 客服权限测试 ===")

r = client.post(f'{base}/api/auth/login', json={'username': 'cs01', 'password': '123456'})
cs_cookies = r.cookies
print(f'客服登录: {r.status_code}')

r = client.get(f'{base}/api/risks/', cookies=cs_cookies)
print(f'客服访问风险(应200): {r.status_code}')

r = client.get(f'{base}/api/dict-types', cookies=cs_cookies)
print(f'客服访问字典类型(应200): {r.status_code}')

r = client.post(f'{base}/api/dict-types', json={'dict_code': 'test', 'dict_name': '测试'}, cookies=cs_cookies)
print(f'客服创建字典类型(应403): {r.status_code}')

print()
print("=== 顾问权限测试 ===")

r = client.post(f'{base}/api/auth/login', json={'username': 'consultant', 'password': '123456'})
con_cookies = r.cookies
print(f'顾问登录: {r.status_code}')

r = client.get(f'{base}/api/appointments/consultants/available', cookies=con_cookies)
print(f'顾问看可用顾问(应200): {r.status_code}')

r = client.get(f'{base}/api/risks/', cookies=con_cookies)
print(f'顾问访问风险(应403): {r.status_code}')

print()
print("=== 合同风险测试 ===")

r = client.post(f'{base}/api/auth/login', json={'username': 'admin', 'password': 'admin123'})
admin_cookies = r.cookies

r = client.post(f'{base}/api/risks/', json={
    'risk_type': 'payment_delay',
    'risk_level': 'high',
    'description': '测试风险上报',
    'tenant_name': '测试租客'
}, cookies=admin_cookies)
print(f'创建风险(应200): {r.status_code}')

risk_data = r.json()
risk_id = risk_data['id']
print(f'  风险ID: {risk_id}, 编号: {risk_data.get("risk_no")}')

r = client.post(f'{base}/api/risks/{risk_id}/handle', json={
    'handle_result': '已与租客沟通，约定三日内补缴',
    'handle_reason': '租客资金周转困难',
    'status': 'processing'
}, cookies=cs_cookies)
print(f'客服处理风险(应200): {r.status_code}')

print()
print("=== 修改历史测试 ===")

r = client.put(f'{base}/api/apartments/1', json={
    'monthly_rent': 3300,
    'description': '测试修改描述'
}, cookies=admin_cookies)
print(f'修改房源(应200): {r.status_code}')

r = client.get(f'{base}/api/apartments/1/change-logs', cookies=admin_cookies)
logs = r.json()
print(f'修改历史记录数: {len(logs)}')

print()
print("=== 所有测试完成 ===")
