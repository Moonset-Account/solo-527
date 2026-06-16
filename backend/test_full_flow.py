import os
import sys
import json

os.environ['DJANGO_SETTINGS_MODULE'] = 'config.settings'

from django.conf import settings
settings.DATABASES['default'] = {
    'ENGINE': 'django.db.backends.sqlite3',
    'NAME': '/tmp/test_full_flow.db',
}

import django
django.setup()

from django.core.management import call_command
from django.test import RequestFactory
from rest_framework.test import force_authenticate

print("=" * 60)
print("  端到端测试: migrate -> init_data -> /api/repairs/")
print("=" * 60)

print("\n[1/5] 执行数据库迁移...")
call_command('migrate', verbosity=0, interactive=False)
print("  ✅ 所有迁移执行成功")

print("\n[2/5] 初始化默认数据...")
call_command('init_data', verbosity=0)
print("  ✅ 默认数据初始化完成")

from apps.users.models import User, Role, RoleConfig
from apps.repairs.models import RepairRequest, RepairStatus
from apps.repairs.views import RepairRequestViewSet

student = User.objects.get(username='student')
admin = User.objects.get(username='admin')
worker = User.objects.get(username='worker')
print(f"  ✅ 学生账号: {student}")
print(f"  ✅ 管理员账号: {admin}")
print(f"  ✅ 维修人员: {worker}")

factory = RequestFactory()

print("\n[3/5] 学生提交报修申请 (POST /api/repairs/)...")
view = RepairRequestViewSet.as_view({'post': 'create'})
request = factory.post('/api/repairs/', json.dumps({
    'title': '卫生间水龙头漏水',
    'description': '1号楼301卫生间水龙头持续滴水，水量约每秒1滴',
    'repair_type': 'plumbing',
    'priority': 'high',
    'dorm_building': '1号楼',
    'dorm_room': '301',
    'contact_name': '张三',
    'contact_phone': '13800138000',
}), content_type='application/json')
force_authenticate(request, user=student)
response = view(request)
print(f"  HTTP状态: {response.status_code}")
assert response.status_code == 201, f"创建失败: {response.data}"

repair_id = None
if isinstance(response.data, dict):
    if 'id' in response.data:
        repair_id = response.data['id']
    elif 'results' in response.data and response.data['results']:
        repair_id = response.data['results'][0]['id']

if not repair_id:
    repair = RepairRequest.objects.latest('id')
    repair_id = repair.id

print(f"  ✅ 报修创建成功，ID: {repair_id}")

repair = RepairRequest.objects.get(id=repair_id)
print(f"  数据库验证 - 状态: {repair.status} ({repair.get_status_display()})")
print(f"  数据库验证 - 进度记录数: {repair.progresses.count()}")
assert repair.progresses.count() >= 1, "没有自动创建处理进度记录"
progress = repair.progresses.first()
print(f"  进度记录: {progress.get_status_display()} - {progress.remark}")

print("\n[4/5] 管理员指派维修人员 (POST /api/repairs/{id}/assign/)...")
view = RepairRequestViewSet.as_view({'post': 'assign'})
request = factory.post(f'/api/repairs/{repair_id}/assign/', json.dumps({
    'assignee_id': worker.id,
    'remark': '请尽快处理，学生反映比较紧急',
}), content_type='application/json')
force_authenticate(request, user=admin)
response = view(request, pk=repair_id)
print(f"  HTTP状态: {response.status_code}")
assert response.status_code == 200, f"指派失败: {response.data}"
print(f"  ✅ 指派成功给 {worker.real_name}")

repair.refresh_from_db()
print(f"  数据库验证 - 状态: {repair.status} ({repair.get_status_display()})")
print(f"  数据库验证 - 处理人: {repair.assignee.real_name}")
print(f"  数据库验证 - 进度记录数: {repair.progresses.count()}")

print("\n[5/5] 查询报修详情 (GET /api/repairs/{id}/)...")
view = RepairRequestViewSet.as_view({'get': 'retrieve'})
request = factory.get(f'/api/repairs/{repair_id}/')
force_authenticate(request, user=student)
response = view(request, pk=repair_id)
print(f"  HTTP状态: {response.status_code}")
assert response.status_code == 200, f"查询失败: {response.data}"

data = response.data
print(f"\n  ✅ 报修详情返回成功")
print(f"  ├── ID: {data.get('id')}")
print(f"  ├── 标题: {data.get('title')}")
print(f"  ├── 状态: {data.get('status')} ({data.get('status_display')})")
print(f"  ├── 优先级: {data.get('priority')} ({data.get('priority_display')})")
print(f"  ├── 类型: {data.get('repair_type')} ({data.get('repair_type_display')})")
print(f"  ├── 处理时长: {data.get('processing_time_hours')} 小时")
print(f"  ├── 处理人: {data.get('assignee_info', {}).get('real_name') if data.get('assignee_info') else '未指派'}")
print(f"  ├── 进度记录: {len(data.get('progresses', []))} 条")

for i, p in enumerate(data.get('progresses', []), 1):
    print(f"  │   [{i}] {p.get('status_display')} - {p.get('remark')}")
    print(f"  │       操作人: {p.get('operator_info', {}).get('real_name')}")

print(f"  ├── 最新进度: {data.get('last_progress', {}).get('status_display') if data.get('last_progress') else '无'}")
print(f"  └── 照片: {len(data.get('photos', []))} 张")

print("\n[验证核心字段完整性]")
required_fields = ['id', 'status', 'status_display', 'progresses', 'last_progress', 'processing_time_hours']
for field in required_fields:
    assert field in data, f"缺少字段: {field}"
    print(f"  ✅ {field}: {data.get(field)}")

print(f"\n[列表查询] GET /api/repairs/...")
view = RepairRequestViewSet.as_view({'get': 'list'})
request = factory.get('/api/repairs/')
force_authenticate(request, user=student)
response = view(request)
print(f"  HTTP状态: {response.status_code}")
assert response.status_code == 200
assert 'count' in response.data
assert response.data['count'] >= 1
print(f"  ✅ 列表查询成功，共 {response.data['count']} 条记录")
if response.data.get('results'):
    first = response.data['results'][0]
    print(f"  第一条记录: #{first.get('id')} - {first.get('title')} - {first.get('status_display')}")

print("\n" + "=" * 60)
print("  🎉 所有端到端测试通过！")
print("=" * 60)

import os
if os.path.exists('/tmp/test_full_flow.db'):
    os.remove('/tmp/test_full_flow.db')
    print("\n  🧹 测试数据库已清理")
