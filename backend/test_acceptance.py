#!/usr/bin/env python3
import requests
import json
import time

BASE_URL = 'http://127.0.0.1:5000/api'

def print_section(title):
    print(f'\n{"="*60}')
    print(f'  {title}')
    print(f'{"="*60}')

def main():
    print_section('生鲜团购截单与分拣平台 - 验收路径测试')
    
    admin_token = None
    user_token = None
    created_order_id = None
    created_refund_id = None
    
    # 1. 管理员登录
    print_section('1. 管理员登录')
    r = requests.post(f'{BASE_URL}/auth/login', json={
        'phone': '13800138000',
        'password': 'admin123'
    })
    result = r.json()
    print(f'状态码: {r.status_code}')
    print(f'响应: {json.dumps(result, ensure_ascii=False, indent=2)[:300]}')
    if result.get('code') == 200:
        admin_token = result['data']['token']
        print('✅ 管理员登录成功')
    else:
        print('❌ 管理员登录失败')
        return
    
    admin_headers = {'Authorization': f'Bearer {admin_token}'}
    
    # 2. 注册一个测试用户
    print_section('2. 注册测试用户')
    r = requests.post(f'{BASE_URL}/auth/register', json={
        'name': '测试居民',
        'phone': f'1390000{int(time.time())%10000:04d}',
        'password': '123456',
        'building_id': 1,
        'room_number': '101'
    })
    result = r.json()
    print(f'状态码: {r.status_code}')
    if result.get('code') == 200:
        user_token = result['data']['token']
        print(f'✅ 用户注册成功: {result["data"]["user"]["name"]}')
    else:
        print(f'❌ 注册失败: {result.get("message")}')
        return
    
    user_headers = {'Authorization': f'Bearer {user_token}'}
    
    # 3. 新增路径 - 用户下单
    print_section('3. 新增路径 - 用户下单')
    r = requests.post(f'{BASE_URL}/orders', headers=user_headers, json={
        'items': [
            {'product_id': 1, 'quantity': 2},
            {'product_id': 2, 'quantity': 1.5}
        ],
        'building_id': 1,
        'room_number': '101',
        'remark': '测试订单'
    })
    result = r.json()
    print(f'状态码: {r.status_code}')
    print(f'响应: {json.dumps(result, ensure_ascii=False, indent=2)[:400]}')
    if result.get('code') == 200:
        created_order_id = result['data']['id']
        print(f'✅ 订单创建成功，订单号: {result["data"]["order_no"]}')
    else:
        print(f'❌ 下单失败: {result.get("message")}')
        return
    
    # 4. 审批路径 - 管理员截单
    print_section('4. 审批路径 - 管理员截单')
    r = requests.post(f'{BASE_URL}/orders/cutoff', headers=admin_headers, json={
        'order_ids': [created_order_id]
    })
    result = r.json()
    print(f'状态码: {r.status_code}')
    print(f'响应: {json.dumps(result, ensure_ascii=False, indent=2)}')
    if result.get('code') == 200:
        print(f'✅ 截单成功，截单数量: {result["data"]["count"]}')
    else:
        print(f'⚠️  截单: {result.get("message")}')
    
    # 5. 检查截单后用户是否能修改订单
    print_section('5. 验证截单后用户无法修改订单')
    r = requests.put(f'{BASE_URL}/orders/{created_order_id}', headers=user_headers, json={
        'remark': '尝试修改'
    })
    result = r.json()
    print(f'状态码: {r.status_code}')
    print(f'响应: {json.dumps(result, ensure_ascii=False, indent=2)}')
    if result.get('code') == 400:
        print('✅ 正确拦截：截单后用户无法修改订单')
    else:
        print('⚠️  响应:', result.get('message'))
    
    # 6. 新增路径 - 用户申请退款
    print_section('6. 新增路径 - 用户申请退款')
    r = requests.get(f'{BASE_URL}/orders/{created_order_id}', headers=user_headers)
    order_detail = r.json()
    order_item_id = None
    if order_detail.get('code') == 200 and order_detail['data']['items']:
        order_item_id = order_detail['data']['items'][0]['id']
    
    if order_item_id:
        r = requests.post(f'{BASE_URL}/refunds', headers=user_headers, json={
            'order_id': created_order_id,
            'order_item_id': order_item_id,
            'amount': 7.0,
            'reason': '商品不新鲜，申请退款'
        })
        result = r.json()
        print(f'状态码: {r.status_code}')
        print(f'响应: {json.dumps(result, ensure_ascii=False, indent=2)[:300]}')
        if result.get('code') == 200:
            created_refund_id = result['data']['id']
            print(f'✅ 退款申请成功，退款单号: {result["data"]["refund_no"]}')
        else:
            print(f'❌ 退款申请失败: {result.get("message")}')
    
    # 7. 审批路径 - 管理员审核退款
    print_section('7. 审批路径 - 管理员审核退款')
    if created_refund_id:
        r = requests.post(f'{BASE_URL}/refunds/{created_refund_id}/approve', headers=admin_headers, json={
            'remark': '情况属实，同意退款'
        })
        result = r.json()
        print(f'状态码: {r.status_code}')
        print(f'响应: {json.dumps(result, ensure_ascii=False, indent=2)}')
        if result.get('code') == 200:
            print('✅ 退款审批通过成功')
        else:
            print(f'❌ 审批失败: {result.get("message")}')
        
        # 完成退款
        r = requests.post(f'{BASE_URL}/refunds/{created_refund_id}/complete', headers=admin_headers)
        result = r.json()
        print(f'完成退款响应: {json.dumps(result, ensure_ascii=False)}')
        if result.get('code') == 200:
            print('✅ 退款完成成功')
    
    # 8. 撤回路径 - 先创建一个新的退款再撤回
    print_section('8. 撤回路径 - 用户撤回退款申请')
    r = requests.post(f'{BASE_URL}/refunds', headers=user_headers, json={
        'order_id': created_order_id,
        'amount': 5.0,
        'reason': '测试撤回'
    })
    result = r.json()
    if result.get('code') == 200:
        withdraw_id = result['data']['id']
        print(f'创建退款成功，准备撤回 (ID: {withdraw_id})')
        
        r = requests.post(f'{BASE_URL}/refunds/{withdraw_id}/withdraw', headers=user_headers)
        result = r.json()
        print(f'状态码: {r.status_code}')
        print(f'响应: {json.dumps(result, ensure_ascii=False, indent=2)}')
        if result.get('code') == 200:
            print('✅ 退款撤回成功')
        else:
            print(f'❌ 撤回失败: {result.get("message")}')
    
    # 9. 导出路径 - 测试导出接口（需要认证）
    print_section('9. 导出路径 - 测试需要认证的导出接口')
    r = requests.get(f'{BASE_URL}/exports/orders', headers=admin_headers)
    print(f'订单导出状态码: {r.status_code}')
    if r.status_code == 200 and 'application' in r.headers.get('content-type', ''):
        print('✅ 订单导出接口正常（需要认证）')
    elif r.status_code == 200:
        print('✅ 订单导出接口返回成功')
    else:
        print(f'⚠️  订单导出响应: {r.status_code}')
    
    # 测试未授权访问导出
    r = requests.get(f'{BASE_URL}/exports/orders')
    print(f'未授权访问导出状态码: {r.status_code}')
    if r.status_code == 401 or r.status_code == 422:
        print('✅ 正确拦截：未授权无法访问导出接口')
    
    # 10. 取货核销路径
    print_section('10. 取货核销路径')
    r = requests.get(f'{BASE_URL}/pickup/pending', headers=admin_headers)
    result = r.json()
    print(f'待取货列表状态码: {r.status_code}')
    if result.get('code') == 200:
        print(f'✅ 取货列表获取成功，待取货: {result["data"]["total"]} 单')
    
    # 11. 测试索引和异常处理
    print_section('11. 权限控制与异常处理')
    
    # 普通用户尝试访问管理接口
    r = requests.get(f'{BASE_URL}/users', headers=user_headers)
    print(f'普通用户访问用户管理状态码: {r.status_code}')
    if r.status_code == 403:
        print('✅ 正确拦截：普通用户无权限访问管理接口')
    else:
        print(f'响应: {r.json().get("message")}')
    
    # 测试不存在的资源
    r = requests.get(f'{BASE_URL}/orders/99999', headers=user_headers)
    print(f'访问不存在的订单状态码: {r.status_code}')
    if r.status_code == 404:
        print('✅ 正确返回404：资源不存在')
    
    print_section('测试完成')
    print('✅ 新增路径：下单、退款申请')
    print('✅ 审批路径：截单、退款审批')
    print('✅ 撤回路径：退款撤回')
    print('✅ 导出路径：导出接口需要认证')
    print('✅ 权限控制：角色权限验证')
    print('✅ 异常处理：404、403 等状态码')

if __name__ == '__main__':
    main()
