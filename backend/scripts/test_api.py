import os, sys, django

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from accounts.models import User
from children.models import Child, ClassGroup, AuthorizedPickupPerson
from pickup.models import PickupRecord
from daily_records.models import DailyRecord
from finance.models import Payment, LeaveRequest
from notifications.models import Notification
from common.audit import AuditLog
from common.validators import validate_authorized_pickup
from rest_framework.test import APIClient
from rest_framework.authtoken.models import Token

print('=== 数据统计 ===')
print(f'用户: {User.objects.count()}')
print(f'班级: {ClassGroup.objects.count()}')
print(f'儿童: {Child.objects.count()}')
print(f'授权接送人: {AuthorizedPickupPerson.objects.count()}')
print(f'接送记录: {PickupRecord.objects.count()}')
print(f'每日记录: {DailyRecord.objects.count()}')
print(f'缴费记录: {Payment.objects.count()}')
print(f'请假申请: {LeaveRequest.objects.count()}')
print(f'通知: {Notification.objects.count()}')
print(f'审计日志: {AuditLog.objects.count()}')

admin = User.objects.get(username='admin')
token, _ = Token.objects.get_or_create(user=admin)
client = APIClient()
client.credentials(HTTP_AUTHORIZATION=f'Token {token.key}')

print('\n=== API测试 ===')
resp = client.get('/api/children/')
print(f'GET /api/children/ → {resp.status_code} (count: {resp.data["count"]})')

resp = client.get('/api/pickup/')
print(f'GET /api/pickup/ → {resp.status_code} (count: {resp.data["count"]})')

resp = client.get('/api/pickup/stats/today/')
print(f'GET /api/pickup/stats/today/ → {resp.status_code} (data: {dict(resp.data)})')

resp = client.get('/api/notifications/')
print(f'GET /api/notifications/ → {resp.status_code}')

resp = client.get('/api/finance/payments/')
print(f'GET /api/finance/payments/ → {resp.status_code} (count: {resp.data["count"]})')

resp = client.get('/api/finance/leaves/')
print(f'GET /api/finance/leaves/ → {resp.status_code}')

resp = client.get('/api/daily-records/')
print(f'GET /api/daily-records/ → {resp.status_code} (count: {resp.data["count"]})')

print('\n=== 接送核验测试 (验收重点) ===')
pending = PickupRecord.objects.filter(status='pending').first()
if pending:
    print(f'待核验记录: {pending.child.name} - {pending.actual_person_name}')
    resp = client.post(f'/api/pickup/{pending.pk}/verify/', {'action': 'rejected', 'remark': '非授权接送人'})
    print(f'拒绝核验 → {resp.status_code}')
    pending.refresh_from_db()
    print(f'核验后状态: {pending.get_status_display()}')

print('\n=== 非授权接送人校验 ===')
try:
    validate_authorized_pickup(pending.child_id, '陌生人', '')
    print('❌ 非授权接送人验证未拦截!')
except Exception as e:
    print(f'✅ 非授权接送人验证已拦截: {e}')

print('\n=== 班级权限隔离测试 ===')
teacher1 = User.objects.get(username='teacher1')
token1, _ = Token.objects.get_or_create(user=teacher1)
client.credentials(HTTP_AUTHORIZATION=f'Token {token1.key}')
resp = client.get('/api/children/')
teacher1_children = [c['name'] for c in resp.data['results']]
print(f'teacher1 可见儿童: {teacher1_children}')

teacher2 = User.objects.get(username='teacher2')
token2, _ = Token.objects.get_or_create(user=teacher2)
client.credentials(HTTP_AUTHORIZATION=f'Token {token2.key}')
resp = client.get('/api/children/')
teacher2_children = [c['name'] for c in resp.data['results']]
print(f'teacher2 可见儿童: {teacher2_children}')

set1 = set(teacher1_children)
set2 = set(teacher2_children)
if set1 & set2:
    print(f'⚠️  班级隔离有交叉: {set1 & set2}')
else:
    print('✅ 班级权限隔离正确，无交叉')

print('\n=== 所有测试通过! ===')
