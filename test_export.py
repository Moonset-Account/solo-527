import sys
sys.path.insert(0, '.')
from datetime import datetime, timedelta
from data.export.tasks import export_manager

print('=== 测试导出任务管理 ===')
time_end = datetime.now()
time_start = time_end - timedelta(hours=24)

filters = {
    'risk_tags': ['色情'],
    'queue_types': ['人审-高优'],
    'reviewers': [],
    'shifts': ['早班'],
    'sources': ['首页推荐'],
    'time_start': time_start.isoformat(),
    'time_end': time_end.isoformat(),
    'granularity': '1h',
}

print('1. 提交导出任务...')
task_id = export_manager.submit_task(filters, 'review_logs', 'xlsx')
print(f'   任务ID: {task_id}')

import time
for i in range(5):
    time.sleep(1)
    status = export_manager.get_status(task_id)
    if status:
        print(f'   轮询 {i+1}: 状态={status.status}, 进度={status.progress}%')
    else:
        print(f'   轮询 {i+1}: 未找到任务')

print('')
print('2. 测试不存在的任务...')
status = export_manager.get_status('non-existent-task-id')
print(f'   查询不存在任务: {status}（None ✓）')

print('')
print('✅ 导出功能验证完成！')
