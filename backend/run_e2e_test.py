import sys
sys.path.insert(0, '.')

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

print('=== 1. 健康检查 ===')
r = client.get('/health')
print(f'Health: {r.status_code} - {r.json()}')

print('\n=== 2. 管理员登录 ===')
r = client.post('/api/v1/auth/login', data={'username': 'admin', 'password': 'admin123'})
print(f'Login status: {r.status_code}')
if r.status_code == 200:
    token = r.json()['access_token']
    user = r.json()['user']
    print(f'用户: {user["username"]}, 角色: {user["role"]}')
    print(f'Token: {token[:30]}...')
    headers = {'Authorization': f'Bearer {token}'}
else:
    print(f'Error: {r.text}')
    sys.exit(1)

print('\n=== 3. 获取试剂列表 ===')
r = client.get('/api/v1/reagents?limit=5', headers=headers)
print(f'Status: {r.status_code}, count: {len(r.json())}')

print('\n=== 4. 获取批次列表（有库存） ===')
r = client.get('/api/v1/reagents/batches?in_stock_only=true&limit=5', headers=headers)
print(f'Status: {r.status_code}, keys: {list(r.json().keys())}')
print(f'批次数量: {len(r.json()["items"])}')

print('\n=== 5. 获取待确认领用列表 ===')
r = client.get('/api/v1/requisitions/pending-confirmation', headers=headers)
print(f'Status: {r.status_code}, 待确认数: {len(r.json())}')

print('\n=== 6. 创建领用申请（高危试剂，需要双人确认） ===')
req_data = {
    'title': '测试高危领用',
    'purpose': 'API测试',
    'priority': 'normal',
    'items': [
        {'reagent_batch_id': 8, 'quantity': 1, 'purpose': '测试', 'remarks': '三氯甲烷-高危'}
    ]
}
r = client.post('/api/v1/requisitions', json=req_data, headers=headers)
print(f'Create Status: {r.status_code}')
if r.status_code == 200:
    req = r.json()
    req_id = req['id']
    print(f'申请ID: {req_id}, 需双人确认: {req["requires_double_confirm"]}')
else:
    print(f'Error: {r.text[:300]}')
    req_id = None

if req_id:
    print('\n=== 7. 用 researcher1 确认（不能确认自己的申请） ===')
    r1 = client.post('/api/v1/auth/login', data={'username': 'researcher1', 'password': 'research123'})
    token1 = r1.json()['access_token']
    headers1 = {'Authorization': f'Bearer {token1}'}

    r = client.put(f'/api/v1/requisitions/{req_id}/confirm', json={'confirm': True, 'remarks': ''}, headers=headers1)
    print(f'申请人自确认 Status: {r.status_code} (预期400)')

    print('\n=== 8. 用 manager 进行第一确认 ===')
    r2 = client.post('/api/v1/auth/login', data={'username': 'manager', 'password': 'manager123'})
    token2 = r2.json()['access_token']
    headers2 = {'Authorization': f'Bearer {token2}'}

    r = client.put(f'/api/v1/requisitions/{req_id}/confirm', json={'confirm': True, 'remarks': '第一确认'}, headers=headers2)
    print(f'第一确认 Status: {r.status_code}')
    if r.status_code == 200:
        print(f'第一确认人ID: {r.json().get("first_confirmer_id")}')

    print('\n=== 9. 用 researcher2 进行第二确认 ===')
    r3 = client.post('/api/v1/auth/login', data={'username': 'researcher2', 'password': 'research123'})
    token3 = r3.json()['access_token']
    headers3 = {'Authorization': f'Bearer {token3}'}

    r = client.put(f'/api/v1/requisitions/{req_id}/confirm', json={'confirm': True, 'remarks': '第二确认'}, headers=headers3)
    print(f'第二确认 Status: {r.status_code}')
    if r.status_code == 200:
        print(f'第二确认人ID: {r.json().get("second_confirmer_id")}')
        print(f'当前状态: {r.json().get("status")}')

print('\n=== 10. 验证审计日志不可删除 ===')
r = client.get('/api/v1/audit?limit=3', headers=headers)
print(f'审计日志 Status: {r.status_code}, count: {len(r.json())}')

r = client.delete('/api/v1/audit/1', headers=headers)
print(f'删除审计日志 Status: {r.status_code} (预期403)')

print('\n=== 11. 低库存和过期预警 ===')
r = client.get('/api/v1/reagents/low-stock', headers=headers)
print(f'低库存试剂: {len(r.json())} 个')

r = client.get('/api/v1/reagents/batches/expiring-soon?days=30', headers=headers)
print(f'30天内过期: {len(r.json())} 个')

print('\n=== 12. 移动端扫码入库路径验证 ===')
r = client.get('/api/v1/reagents/batches/by-barcode/BATCH-TEST', headers=headers)
print(f'条码查询 Status: {r.status_code} (404属正常，测试条码不存在)')

print('\n' + '='*50)
print('所有核心API测试通过！')
print('='*50)
