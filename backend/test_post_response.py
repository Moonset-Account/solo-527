import os
import json

os.environ['DJANGO_SETTINGS_MODULE'] = 'config.settings'

from django.conf import settings
settings.DATABASES['default'] = {
    'ENGINE': 'django.db.backends.sqlite3',
    'NAME': ':memory:',
}

import django
django.setup()

from django.core.management import call_command
from django.test import RequestFactory
from rest_framework.test import force_authenticate

call_command('migrate', verbosity=0, interactive=False)
call_command('init_data', verbosity=0)

from apps.users.models import User
from apps.repairs.views import RepairRequestViewSet

student = User.objects.get(username='student')
factory = RequestFactory()

print("=" * 60)
print("  验证 POST /api/repairs/ 201 响应包含完整详情")
print("=" * 60)

view = RepairRequestViewSet.as_view({'post': 'create'})
request = factory.post('/api/repairs/', json.dumps({
    'title': '测试完整响应',
    'description': '验证创建后返回完整详情',
    'repair_type': 'plumbing',
    'priority': 'medium',
    'dorm_building': '1号楼',
    'dorm_room': '301',
    'contact_name': '张三',
    'contact_phone': '13800138000',
}), content_type='application/json')
force_authenticate(request, user=student)
response = view(request)

print(f"\n  HTTP 状态: {response.status_code}")
assert response.status_code == 201, f"期望 201，实际 {response.status_code}"

data = response.data
print(f"  响应类型: {type(data).__name__}")
print(f"  响应字段数: {len(data.keys())}")
print()

required_fields = [
    'id', 'title', 'status', 'status_display',
    'progresses', 'last_progress', 'processing_time_hours',
    'repair_type', 'priority', 'applicant_info',
    'created_at', 'updated_at',
]

print("  核心字段验证:")
all_ok = True
for field in required_fields:
    ok = field in data
    prefix = "✅" if ok else "❌"
    val = data.get(field)
    if field in ('progresses', 'applicant_info', 'last_progress'):
        val_str = f"{type(val).__name__}"
        if isinstance(val, list):
            val_str += f" ({len(val)} 项)"
    else:
        val_str = str(val)[:40]
    print(f"    {prefix} {field}: {val_str}")
    if not ok:
        all_ok = False

if all_ok:
    print(f"\n  progresses 详情（{len(data['progresses'])} 条）:")
    for p in data['progresses']:
        print(f"    - {p['status_display']}: {p['remark']}")
        print(f"      操作人: {p['operator_info']['real_name']}")

    print(f"\n  last_progress:")
    lp = data['last_progress']
    print(f"    状态: {lp['status_display']}")
    print(f"    备注: {lp['remark']}")
    print(f"    操作人: {lp['operator_info']['real_name']}")

print()
if all_ok:
    print("🎉 POST /api/repairs/ 201 响应完整返回详情！")
else:
    print("❌ 有缺失字段")

print("=" * 60)
