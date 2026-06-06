import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tea_loss_dashboard.settings')
django.setup()

from django.test import Client
import json

client = Client()
client.login(username='admin', password='admin123')

print('=' * 60)
print('连锁茶饮原料损耗看板 - 功能测试')
print('=' * 60)

print('\n1. 登录页面测试')
response = client.get('/login/')
print(f'   登录页面状态码: {response.status_code} {"✅ 通过" if response.status_code == 200 else "❌ 失败"}')

print('\n2. Dashboard API 测试')

print('\n   2.1 核心指标 API')
response = client.get('/api/v1/dashboard/metrics/')
print(f'   状态码: {response.status_code}')
if response.status_code == 200:
    data = response.json()
    print(f'   响应码: {data.get("code")}')
    print(f'   总损耗率: {data.get("data", {}).get("totalLossRate")}%')
    print(f'   总损耗金额: ¥{data.get("data", {}).get("totalLossAmount")}')
    print('   ✅ 通过' if data.get('code') == 200 else '   ❌ 失败')

print('\n   2.2 损耗率趋势 API')
response = client.get('/api/v1/dashboard/trend/')
print(f'   状态码: {response.status_code}')
if response.status_code == 200:
    data = response.json()
    print(f'   响应码: {data.get("code")}')
    print(f'   数据点数量: {len(data.get("data", []))}')
    print('   ✅ 通过' if data.get('code') == 200 else '   ❌ 失败')

print('\n   2.3 门店排行 API')
response = client.get('/api/v1/dashboard/store_ranking/')
print(f'   状态码: {response.status_code}')
if response.status_code == 200:
    data = response.json()
    print(f'   响应码: {data.get("code")}')
    print(f'   门店数量: {len(data.get("data", []))}')
    if data.get('data'):
        print(f'   榜首门店: {data["data"][0]["name"]} - 损耗率 {data["data"][0]["lossRate"]}%')
    print('   ✅ 通过' if data.get('code') == 200 else '   ❌ 失败')

print('\n   2.4 原料排行 API')
response = client.get('/api/v1/dashboard/material_ranking/')
print(f'   状态码: {response.status_code}')
if response.status_code == 200:
    data = response.json()
    print(f'   响应码: {data.get("code")}')
    print(f'   原料数量: {len(data.get("data", []))}')
    print('   ✅ 通过' if data.get('code') == 200 else '   ❌ 失败')

print('\n   2.5 试营原料排除测试')
response = client.get('/api/v1/dashboard/material_ranking/?exclude_trial=true')
print(f'   状态码: {response.status_code}')
if response.status_code == 200:
    data = response.json()
    has_trial = any(item.get('isTrial') for item in data.get('data', []))
    print(f'   排除试营后是否含试营原料: {has_trial}')
    print('   ✅ 试营原料已排除' if not has_trial else '   ⚠️  仍包含试营原料')

print('\n3. 损耗明细 API 测试')
response = client.get('/api/v1/loss/list/')
print(f'   状态码: {response.status_code}')
if response.status_code == 200:
    data = response.json()
    print(f'   响应码: {data.get("code")}')
    print(f'   总记录数: {data.get("data", {}).get("count", 0)}')
    print('   ✅ 通过' if data.get('code') == 200 else '   ❌ 失败')

print('\n4. 口径配置 API 测试')
print('\n   4.1 读取配置')
response = client.get('/api/v1/config/caliber/')
print(f'   状态码: {response.status_code}')
if response.status_code == 200:
    data = response.json()
    print(f'   响应码: {data.get("code")}')
    print(f'   配置项: {list(data.get("data", {}).keys())}')
    print('   ✅ 通过' if data.get('code') == 200 else '   ❌ 失败')

print('\n   4.2 保存配置')
config_data = {
    'abnormal_threshold': {'value': '6.0', 'description': '异常门店损耗率阈值(%)'},
    'loss_rate_formula': {'value': '(报损+盘点差异)/领用*100%', 'description': '损耗率公式'}
}
response = client.post(
    '/api/v1/config/caliber/',
    data=json.dumps(config_data),
    content_type='application/json'
)
print(f'   状态码: {response.status_code}')
if response.status_code == 200:
    data = response.json()
    print(f'   响应: {data.get("message")}')
    print('   ✅ 通过' if data.get('code') == 200 else '   ❌ 失败')

print('\n5. 报表生成 API 测试')
report_data = {
    'report_type': 'loss_summary',
    'start_date': '2024-01-01',
    'end_date': '2024-12-31',
    'exclude_trial': True
}
response = client.post(
    '/api/v1/reports/generate/',
    data=json.dumps(report_data),
    content_type='application/json'
)
print(f'   状态码: {response.status_code}')
if response.status_code == 200:
    data = response.json()
    print(f'   响应码: {data.get("code")}')
    print(f'   消息: {data.get("message")}')
    if data.get('data'):
        print(f'   下载链接: {data["data"].get("download_url")}')
    print('   ✅ 通过' if data.get('code') == 200 else '   ❌ 失败')

print('\n6. 报表任务列表 API 测试')
response = client.get('/api/v1/reports/tasks/')
print(f'   状态码: {response.status_code}')
if response.status_code == 200:
    data = response.json()
    print(f'   响应码: {data.get("code")}')
    print(f'   任务数量: {len(data.get("data", []))}')
    print('   ✅ 通过' if data.get('code') == 200 else '   ❌ 失败')

print('\n' + '=' * 60)
print('测试完成！请使用 admin/admin123 登录 http://localhost:9000/ 体验完整功能')
print('=' * 60)
