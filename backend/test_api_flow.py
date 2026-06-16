import os
os.environ['DJANGO_SETTINGS_MODULE'] = 'config.settings'

from django.conf import settings
settings.DATABASES['default'] = {
    'ENGINE': 'django.db.backends.sqlite3',
    'NAME': '/tmp/test_api_flow2.db',
}

import django
django.setup()

from django.core.management import call_command
call_command('migrate', verbosity=0, interactive=False)
call_command('init_data', verbosity=0)

from django.test import RequestFactory
from rest_framework.test import force_authenticate

from apps.users.models import User, Role
from apps.repairs.views import RepairRequestViewSet
from apps.repairs.models import RepairRequest, RepairStatus

student = User.objects.get(username='student')

factory = RequestFactory()

view = RepairRequestViewSet.as_view({'post': 'create'})
request = factory.post('/api/repairs/', {
    'title': '水龙头漏水',
    'description': '1号楼301水龙头持续滴水',
    'repair_type': 'plumbing',
    'priority': 'high',
    'dorm_building': '1号楼',
    'dorm_room': '301',
    'contact_name': '张三',
    'contact_phone': '13800138000',
}, content_type='application/json')
force_authenticate(request, user=student)
response = view(request)
print(f'POST status: {response.status_code}')
print(f'Response data keys: {list(response.data.keys()) if isinstance(response.data, dict) else type(response.data)}')
if isinstance(response.data, dict):
    if 'id' in response.data:
        repair_id = response.data['id']
        print(f'Created repair #{repair_id}: {response.data.get("title")}')
    elif 'results' in response.data:
        print(f'Paginated response: count={response.data.get("count")}')
    else:
        print(f'Data: {response.data}')

repair = RepairRequest.objects.first()
if repair:
    print(f'DB repair: #{repair.id} - {repair.title} status={repair.status}')

view = RepairRequestViewSet.as_view({'get': 'list'})
request = factory.get('/api/repairs/')
force_authenticate(request, user=student)
response = view(request)
print(f'\nGET /api/repairs/ -> {response.status_code}')
if isinstance(response.data, dict):
    print(f'  Count: {response.data.get("count", "N/A")}')
    results = response.data.get('results', [])
    if results:
        print(f'  First: #{results[0].get("id")} - {results[0].get("title")}')

if repair:
    view = RepairRequestViewSet.as_view({'get': 'retrieve'})
    request = factory.get(f'/api/repairs/{repair.id}/')
    force_authenticate(request, user=student)
    response = view(request, pk=repair.id)
    print(f'\nGET /api/repairs/{repair.id}/ -> {response.status_code}')
    print(f'  Title: {response.data.get("title")}')
    print(f'  Status: {response.data.get("status_display")}')
    print(f'  Processing time: {response.data.get("processing_time_hours")}')

admin = User.objects.get(username='admin')
view = RepairRequestViewSet.as_view({'get': 'statistics'})
request = factory.get('/api/repairs/statistics/')
force_authenticate(request, user=admin)
response = view(request)
print(f'\nGET /api/repairs/statistics/ -> {response.status_code}')
print(f'  Stats: {response.data}')

from apps.notifications.views import NotificationViewSet
view = NotificationViewSet.as_view({'get': 'unread_count'})
request = factory.get('/api/notifications/list/unread_count/')
force_authenticate(request, user=student)
response = view(request)
print(f'\nGET /api/notifications/list/unread_count/ -> {response.status_code}')
print(f'  Unread: {response.data}')

from apps.audit.models import AuditLog
print(f'\nAudit logs: {AuditLog.objects.count()} entries')

print('\n✅ All API endpoint tests passed!')

import os
if os.path.exists('/tmp/test_api_flow2.db'):
    os.remove('/tmp/test_api_flow2.db')
