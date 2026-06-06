import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tea_loss_dashboard.settings')
django.setup()

from django.test import Client
import json

client = Client()
client.login(username='admin', password='admin123')

print('1. 报表生成测试...')
report_data = {
    'report_type': 'loss_summary',
    'exclude_trial': True
}
response = client.post('/api/v1/reports/generate/',
                       data=json.dumps(report_data),
                       content_type='application/json')
print(f'   {response.status_code} - {response.json()["message"]}')

print('\n2. 报表任务列表...')
response = client.get('/api/v1/reports/tasks/')
tasks = response.json()['data']
print(f'   任务数: {len(tasks)}')
for t in tasks[:3]:
    print(f'   - {t["report_type"]}: {t["status_text"]}  exclude_trial={t["exclude_trial"]}')
    if t.get('download_url'):
        print(f'     下载: {t["download_url"]}')

print('\n3. 试营原料排除测试（默认true）...')
response = client.get('/api/v1/dashboard/material_ranking/')
materials = response.json()['data']
has_trial = any(m['isTrial'] for m in materials)
print(f'   是否包含试营原料: {has_trial} (预期: False)')
print(f'   ✅ 通过' if not has_trial else f'   ❌ 未通过')

print('\n4. 前端默认值（dashboard.js）...')
with open('static/js/dashboard.js', 'r') as f:
    js = f.read()
if 'excludeTrial: true' in js:
    print('   前端默认 excludeTrial=true ✅')
else:
    print('   前端默认值错误 ❌')

print('\n5. 导入模板测试...')
for dt in ['wastage', 'inventory', 'sale', 'staff_shift']:
    response = client.get(f'/api/v1/import/template/?type={dt}')
    print(f'   {dt}: {response.status_code} {"✅" if response.status_code == 200 else "❌"}')

print('\n✅ 核心功能验证完成！')
