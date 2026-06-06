import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tea_loss_dashboard.settings')
django.setup()

from django.test import Client
import json

client = Client()
client.login(username='admin', password='admin123')

report_types = ['loss_summary', 'loss_detail', 'store_ranking', 'material_analysis']
all_ok = True

for rt in report_types:
    print(f'\n测试 {rt}...')
    report_data = {'report_type': rt, 'exclude_trial': True}
    response = client.post('/api/v1/reports/generate/',
                           data=json.dumps(report_data),
                           content_type='application/json')
    result = response.json()
    if result.get('data'):
        from reports.models import ReportTask
        task = ReportTask.objects.get(task_id=result['data']['task_id'])
        print(f'  状态: {task.status}')
        if task.status == 'completed':
            print(f'  文件: {task.file_path}')
            import os
            from django.conf import settings
            full_path = os.path.join(settings.MEDIA_ROOT, task.file_path)
            print(f'  存在: {os.path.exists(full_path)}')
        elif task.status == 'failed':
            print(f'  错误: {task.error_log}')
            all_ok = False
    else:
        print(f'  失败: {result}')
        all_ok = False

print(f'\n所有报表测试: {"✅ 通过" if all_ok else "❌ 失败"}')
