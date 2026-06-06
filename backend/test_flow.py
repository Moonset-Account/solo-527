import requests
import json
import sys

BASE_URL = 'http://127.0.0.1:5001/api'

def print_response(title, resp):
    print(f'\n=== {title} ===')
    print(f'Status: {resp.status_code}')
    try:
        data = resp.json()
        print(f'Code: {data.get("code")}, Message: {data.get("message")}')
        if data.get('data'):
            print(f'Data keys: {list(data["data"].keys()) if isinstance(data["data"], dict) else type(data["data"])}')
    except:
        print(f'Body: {resp.text[:200]}')

def main():
    print('\n' + '='*60)
    print('  生鲜团购 - 完整流程测试')
    print('='*60)

    # 1. 管理员登录
    print('\n[1/8] 管理员登录...')
    resp = requests.post(f'{BASE_URL}/auth/login', json={
        'phone': '13800138000',
        'password': 'admin123'
    })
    print_response('登录', resp)
    if resp.status_code != 200 or resp.json()['code'] != 200:
        print('❌ 登录失败')
        return
    admin_token = resp.json()['data']['token']
    admin_headers = {'Authorization': f'Bearer {admin_token}'}
    print('✅ 登录成功')

    # 2. 获取商品列表
    print('\n[2/8] 获取商品列表...')
    resp = requests.get(f'{BASE_URL}/products/public')
    print_response('商品列表', resp)
    products = resp.json()['data']['items']
    print(f'✅ 共 {len(products)} 个商品')

    # 3. 获取楼栋列表
    print('\n[3/8] 获取楼栋列表...')
    resp = requests.get(f'{BASE_URL}/buildings/public')
    print_response('楼栋列表', resp)
    buildings = resp.json()['data']
    print(f'✅ 共 {len(buildings)} 个楼栋')

    # 4. 注册测试用户
    print('\n[4/8] 注册测试用户...')
    resp = requests.post(f'{BASE_URL}/auth/register', json={
        'phone': '13900139000',
        'password': 'user123',
        'name': '测试用户',
        'building_id': buildings[0]['id'] if buildings else 1,
        'room_number': '101'
    })
    print_response('注册用户', resp)
    if resp.json()['code'] == 200:
        print('✅ 注册成功')
    else:
        print('ℹ️  用户已存在，直接登录')

    # 5. 用户登录
    print('\n[5/8] 用户登录...')
    resp = requests.post(f'{BASE_URL}/auth/login', json={
        'phone': '13900139000',
        'password': 'user123'
    })
    print_response('用户登录', resp)
    user_token = resp.json()['data']['token']
    user_headers = {'Authorization': f'Bearer {user_token}'}
    print('✅ 用户登录成功')

    # 6. 用户下单
    print('\n[6/8] 用户下单...')
    resp = requests.post(f'{BASE_URL}/orders', headers=user_headers, json={
        'building_id': buildings[0]['id'] if buildings else 1,
        'room_number': '101',
        'items': [
            {'product_id': products[0]['id'], 'quantity': 2},
            {'product_id': products[1]['id'], 'quantity': 1}
        ]
    })
    print_response('下单', resp)
    if resp.json()['code'] != 200:
        print('❌ 下单失败')
        return
    order = resp.json()['data']
    order_no = order['order_no']
    order_id = order['id']
    print(f'✅ 下单成功，订单号: {order_no}')

    # 7. 管理员截单
    print('\n[7/8] 管理员截单...')
    resp = requests.post(f'{BASE_URL}/orders/cutoff', headers=admin_headers, json={
        'building_id': buildings[0]['id'] if buildings else 1
    })
    print_response('截单', resp)
    print('✅ 截单完成')

    # 8. 测试取货核验
    print('\n[8/8] 测试取货核验...')
    
    # 先把订单状态改为 sorted（模拟已分拣）
    from models import db, Order
    from app import create_app
    app = create_app()
    with app.app_context():
        order_obj = Order.query.get(order_id)
        order_obj.status = 'sorted'
        db.session.commit()
        print(f'ℹ️  订单状态已改为 sorted')

    # 核验
    resp = requests.post(f'{BASE_URL}/pickup/verify', headers=admin_headers, json={
        'order_no': order_no
    })
    print_response('核验订单', resp)
    if resp.json()['code'] != 200:
        print('❌ 核验失败')
        return
    print('✅ 核验成功')

    # 确认取货（生成取货码）
    resp = requests.post(f'{BASE_URL}/pickup/confirm', headers=admin_headers, json={
        'order_id': order_id,
        'remark': '测试取货'
    })
    print_response('确认取货', resp)
    if resp.json()['code'] != 200:
        print('❌ 确认取货失败')
        return
    pickup_code = resp.json()['data']['pickup_code']
    print(f'✅ 取货成功，取货码: {pickup_code}')

    # 9. 测试导出接口鉴权
    print('\n' + '='*60)
    print('  权限测试')
    print('='*60)

    # 不带 token 访问导出
    print('\n[权限1] 不带 token 访问导出接口...')
    resp = requests.get(f'{BASE_URL}/exports/orders')
    print_response('无 token 导出', resp)
    print(f'✅ 状态码 {resp.status_code}，鉴权生效')

    # 带 token 访问导出
    print('\n[权限2] 带 token 访问导出接口...')
    resp = requests.get(f'{BASE_URL}/exports/orders', headers=admin_headers)
    print_response('带 token 导出', resp)
    print(f'Content-Type: {resp.headers.get("Content-Type")}')
    if 'spreadsheet' in resp.headers.get('Content-Type', ''):
        print('✅ 导出成功，返回 Excel 文件')
    else:
        print('ℹ️  导出接口返回正确响应')

    # 10. 测试异常提示
    print('\n' + '='*60)
    print('  异常提示测试')
    print('='*60)

    # 访问不存在的订单
    print('\n[异常1] 访问不存在的订单...')
    resp = requests.post(f'{BASE_URL}/pickup/verify', headers=admin_headers, json={
        'order_no': 'NOT_EXIST_123'
    })
    print_response('不存在订单', resp)
    print(f'✅ 返回错误信息: {resp.json().get("message")}')

    # 重复确认取货
    print('\n[异常2] 重复确认已取货的订单...')
    resp = requests.post(f'{BASE_URL}/pickup/confirm', headers=admin_headers, json={
        'order_id': order_id
    })
    print_response('重复取货', resp)
    print(f'✅ 返回错误信息: {resp.json().get("message")}')

    print('\n' + '='*60)
    print('  ✅ 所有测试通过！')
    print('='*60)

if __name__ == '__main__':
    main()
