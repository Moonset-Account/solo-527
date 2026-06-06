import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tea_loss_dashboard.settings')
django.setup()

from django.test import Client
import json

client = Client()
client.login(username='admin', password='admin123')

print('测试 material_analysis 报表...')
report_data = {
    'report_type': 'material_analysis',
    'exclude_trial': True
}
response = client.post('/api/v1/reports/generate/',
                       data=json.dumps(report_data),
                       content_type='application/json')
print(f'状态码: {response.status_code}')
result = response.json()
print(f'响应: {result}')

if result.get('data'):
    task_id = result['data']['task_id']
    from reports.models import ReportTask
    task = ReportTask.objects.get(task_id=task_id)
    print(f'任务状态: {task.status}')
    if task.status == 'failed':
        print(f'错误日志: {task.error_log}')
    elif task.status == 'completed':
        print(f'文件路径: {task.file_path}')
