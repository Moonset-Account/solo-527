import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'makerspace.settings')
import django
django.setup()

from django.test import Client
from django.contrib.auth import get_user_model
from auditlog.models import LogEntry

User = get_user_model()
client = Client()

user = User.objects.get(email='member@makerspace.com')
client.force_login(user)

print('=' * 60)
print('页面访问测试')
print('=' * 60)

test_urls = [
    ('设备列表', '/equipment/'),
    ('设备详情', '/equipment/'),
    ('预约日历', '/bookings/calendar/'),
    ('创建预约', '/bookings/create/'),
    ('我的预约', '/bookings/my/'),
    ('培训课程', '/training/courses/'),
    ('培训场次详情', '/training/sessions/'),
    ('培训申请', '/training/applications/'),
    ('资格证书', '/training/certifications/'),
    ('耗材列表', '/consumables/'),
    ('耗材使用记录', '/consumables/usage/'),
    ('故障报修列表', '/maintenance/'),
    ('故障报修列表2', '/maintenance/tickets/'),
    ('上报故障', '/maintenance/tickets/create/'),
    ('安全事件', '/safety/incidents/'),
    ('上报安全事件', '/safety/incidents/create/'),
    ('扫码', '/scan/'),
    ('历史追溯', '/history/'),
    ('通知中心', '/notifications/'),
]

all_ok = True
for name, url in test_urls:
    try:
        response = client.get(url)
        status = '✅' if response.status_code == 200 else '❌'
        print(f'  {status} {name:20s} - {url} - {response.status_code}')
        if response.status_code != 200:
            all_ok = False
    except Exception as e:
        print(f'  ❌ {name:20s} - {url} - 错误: {e}')
        all_ok = False

print()
print('=' * 60)
print('数据统计')
print('=' * 60)

from equipment.models import Equipment
from bookings.models import Booking
from training.models import TrainingCourse, TrainingSession, TrainingApplication, TrainingCertification
from consumables.models import Consumable, ConsumableUsage
from maintenance.models import FaultTicket
from safety.models import SafetyIncident

print(f'  设备数量: {Equipment.objects.count()}')
print(f'  预约数量: {Booking.objects.count()}')
print(f'  培训课程: {TrainingCourse.objects.count()}')
print(f'  培训场次: {TrainingSession.objects.count()}')
print(f'  培训申请: {TrainingApplication.objects.count()}')
print(f'  资格证书: {TrainingCertification.objects.count()}')
print(f'  耗材种类: {Consumable.objects.count()}')
print(f'  耗材使用记录: {ConsumableUsage.objects.count()}')
print(f'  故障工单: {FaultTicket.objects.count()}')
print(f'  安全事件: {SafetyIncident.objects.count()}')
print(f'  审计日志: {LogEntry.objects.count()} 条')

print()
if all_ok:
    print('🎉 所有页面访问正常！')
else:
    print('⚠️  有页面访问失败，请检查')
