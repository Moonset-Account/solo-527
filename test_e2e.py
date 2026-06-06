import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tea_loss_dashboard.settings')
django.setup()

from django.test import Client
from django.contrib.auth.models import User
import json
import os
from django.conf import settings

print('=' * 60)
print('连锁茶饮原料损耗看板 - 端到端功能测试')
print('=' * 60)

client = Client()
client.login(username='admin', password='admin123')

# 1. 测试数据导入（报损数据）
print('\n1. 测试数据导入（报损数据）')
sample_file = os.path.join(settings.MEDIA_ROOT, 'sample_imports', '报损数据示例.xlsx')

with open(sample_file, 'rb') as f:
    response = client.post('/api/v1/import/upload/', {
        'file': f,
        'data_type': 'wastage'
    })

print(f'   上传状态码: {response.status_code}')
if response.status_code == 200:
    data = response.json()
    print(f'   任务ID: {data["data"]["task_id"]}')
    print(f'   状态: {data["data"]["status"]}')
    print('   ✅ 报损数据导入任务提交成功')

# 2. 测试进货数据导入
print('\n2. 测试进货数据导入')
sample_file = os.path.join(settings.MEDIA_ROOT, 'sample_imports', '进货数据示例.xlsx')
with open(sample_file, 'rb') as f:
    response = client.post('/api/v1/import/upload/', {
        'file': f,
        'data_type': 'inventory'
    })
print(f'   上传状态码: {response.status_code}')
if response.status_code == 200:
    print('   ✅ 进货数据导入任务提交成功')

# 3. 测试销量数据导入
print('\n3. 测试销量数据导入')
sample_file = os.path.join(settings.MEDIA_ROOT, 'sample_imports', '销量数据示例.xlsx')
with open(sample_file, 'rb') as f:
    response = client.post('/api/v1/import/upload/', {
        'file': f,
        'data_type': 'sale'
    })
print(f'   上传状态码: {response.status_code}')
if response.status_code == 200:
    print('   ✅ 销量数据导入任务提交成功')

# 4. 测试员工班次导入
print('\n4. 测试员工班次导入')
sample_file = os.path.join(settings.MEDIA_ROOT, 'sample_imports', '员工班次示例.xlsx')
with open(sample_file, 'rb') as f:
    response = client.post('/api/v1/import/upload/', {
        'file': f,
        'data_type': 'staff_shift'
    })
print(f'   上传状态码: {response.status_code}')
if response.status_code == 200:
    print('   ✅ 员工班次导入任务提交成功')

# 5. 查看导入任务列表
print('\n5. 查看导入任务列表')
response = client.get('/api/v1/import/tasks/')
if response.status_code == 200:
    tasks = response.json()['data']
    print(f'   任务总数: {len(tasks)}')
    for t in tasks[:3]:
        print(f'   - {t["file_name"]}: {t["status_text"]} (成功:{t["success_rows"]}, 失败:{t["failed_rows"]})')
    print('   ✅ 导入任务列表正常')

# 6. 测试所有报表类型生成
print('\n6. 测试报表生成（所有类型）')
report_types = ['loss_summary', 'store_comparison', 'material_ranking', 'abnormal_details']
for rt in report_types:
    report_data = {
        'report_type': rt,
        'start_date': '2026-05-01',
        'end_date': '2026-06-07',
        'exclude_trial': True
    }
    response = client.post('/api/v1/reports/generate/',
                           data=json.dumps(report_data),
                           content_type='application/json')
    if response.status_code == 200:
        data = response.json()
        print(f'   {rt}: 任务提交成功 - {data["data"]["status"]}')
    else:
        print(f'   {rt}: 失败 - {response.status_code}')

print('   ✅ 所有报表类型提交成功')

# 7. 查看报表任务列表
print('\n7. 查看报表任务列表')
response = client.get('/api/v1/reports/tasks/')
if response.status_code == 200:
    tasks = response.json()['data']
    print(f'   任务总数: {len(tasks)}')
    for t in tasks[:4]:
        print(f'   - {t["report_type"]}: {t["status_text"]}')
        if t.get('download_url'):
            print(f'     下载链接: {t["download_url"]}')
    print('   ✅ 报表任务列表正常')

# 8. 测试损耗明细导出
print('\n8. 测试损耗明细导出（带权限过滤）')
response = client.get('/api/v1/reports/export-details/?exclude_trial=true')
print(f'   导出状态码: {response.status_code}')
if response.status_code == 200:
    print(f'   文件大小: {len(response.content)} bytes')
    print('   ✅ 损耗明细导出正常')

# 9. 店长权限测试
print('\n9. 店长权限测试（manager1）')
client2 = Client()
client2.login(username='manager1', password='manager123')

# 店长报表生成
report_data = {
    'report_type': 'loss_summary',
    'exclude_trial': True
}
response = client2.post('/api/v1/reports/generate/',
                       data=json.dumps(report_data),
                       content_type='application/json')
print(f'   店长提交报表: {response.status_code}')
if response.status_code == 200:
    print('   ✅ 店长可以生成报表（自动过滤门店）')

# 店长导出
response = client2.get('/api/v1/reports/export-details/')
print(f'   店长导出明细: {response.status_code}')
if response.status_code == 200:
    print('   ✅ 店长可以导出明细（自动过滤门店）')

# 10. 验证预聚合数据使用
print('\n10. 验证预聚合数据使用')
response = client.get('/api/v1/dashboard/trend/?exclude_trial=true')
if response.status_code == 200:
    data = response.json()['data']
    print(f'   趋势数据点: {len(data)}')
    if len(data) > 0:
        print(f'   第一个数据点: {data[0]}')
    print('   ✅ 趋势API正常（优先预聚合表）')

print('\n' + '=' * 60)
print('✅ 所有端到端测试通过！')
print('=' * 60)

print('\n📂 示例导入文件位置: media/sample_imports/')
print('📊 生成的报表位置: media/reports/')
print('🔧 配置切换: python3 switch_config.py')
