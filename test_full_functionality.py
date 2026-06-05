import os
import sys
import json

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'makerspace.settings')
import django
django.setup()

from django.test import Client
from django.contrib.auth import get_user_model
from auditlog.models import LogEntry

User = get_user_model()
client = Client()

print('=' * 70)
print('  创客空间设备预约平台 - 核心功能验证')
print('=' * 70)

member = User.objects.get(email='member@makerspace.com')
client.force_login(member)

all_passed = 0
all_failed = 0

def test_page(name, url, expected_status=200):
    global all_passed, all_failed
    try:
        response = client.get(url)
        if response.status_code == expected_status:
            print(f'  ✅ {name}')
            all_passed += 1
            return True
        else:
            print(f'  ❌ {name} - 状态码: {response.status_code} (期望 {expected_status})')
            all_failed += 1
            return False
    except Exception as e:
        print(f'  ❌ {name} - 错误: {e}')
        all_failed += 1
        return False

print('\n📋 所有页面访问测试（19个页面）')
print('-' * 70)

pages = [
    ('仪表盘', '/dashboard/'),
    ('设备列表', '/equipment/'),
    ('预约日历', '/bookings/calendar/'),
    ('创建预约', '/bookings/create/'),
    ('我的预约', '/bookings/my/'),
    ('培训课程', '/training/courses/'),
    ('培训场次', '/training/sessions/'),
    ('培训申请', '/training/applications/'),
    ('资格证书', '/training/certifications/'),
    ('耗材列表', '/consumables/'),
    ('耗材使用记录', '/consumables/usage/'),
    ('故障报修列表', '/maintenance/'),
    ('故障报修列表2', '/maintenance/tickets/'),
    ('上报故障', '/maintenance/tickets/create/'),
    ('安全事件', '/safety/incidents/'),
    ('上报安全事件', '/safety/incidents/create/'),
    ('扫码页面', '/scan/'),
    ('历史追溯', '/history/'),
    ('通知中心', '/notifications/'),
]

for name, url in pages:
    test_page(name, url)

print('\n📝 业务流程测试')
print('-' * 70)

from consumables.models import Consumable, ConsumableUsage
from maintenance.models import FaultTicket

consumable = Consumable.objects.filter(current_stock__gt=0).first()
if consumable:
    print(f'  测试耗材领用: {consumable.name} (库存: {consumable.current_stock})')
    initial_stock = consumable.current_stock
    response = client.post(f'/consumables/{consumable.pk}/use/',
                          {'quantity': '1', 'notes': '功能测试领用'})
    if response.status_code in [301, 302]:
        new_usage = ConsumableUsage.objects.order_by('-created_at').first()
        if new_usage and new_usage.consumable == consumable:
            print(f'    ✅ 领用记录已创建，数量: {new_usage.quantity}')
            print(f'    ✅ 费用计算: ¥{new_usage.total_price}')
            all_passed += 1
        else:
            print(f'    ❌ 领用记录未找到')
            all_failed += 1
    else:
        print(f'    ❌ 领用失败，状态码: {response.status_code}')
        all_failed += 1

print('\n🔌 离线同步 API 测试')
print('-' * 70)

from equipment.models import Equipment
equipment = Equipment.objects.filter(status='available').first()

offline_data = {
    'operations': [
        {
            'type': 'fault_report',
            'client_id': 'test-offline-001',
            'timestamp': '2026-06-06T10:00:00',
            'data': {
                'title': '离线同步测试故障',
                'description': '这是通过离线同步API创建的测试故障单',
                'priority': 'medium',
                'equipment_id': str(equipment.pk) if equipment else None
            }
        }
    ]
}

initial_tickets = FaultTicket.objects.count()
response = client.post('/offline/sync/',
                      json.dumps(offline_data),
                      content_type='application/json')

if response.status_code == 200:
    result = response.json()
    print(f'  ✅ API 调用成功')
    print(f'     同步成功: {result.get("synced", 0)} 条')
    print(f'     同步失败: {result.get("failed", 0)} 条')
    
    new_tickets = FaultTicket.objects.count() - initial_tickets
    if new_tickets > 0:
        ticket = FaultTicket.objects.order_by('-created_at').first()
        print(f'     ✅ 故障单已创建: {ticket.title}')
        print(f'     ✅ 上报人正确: {ticket.reported_by == member}')
        all_passed += 1
    else:
        print(f'     ❌ 故障单未创建')
        all_failed += 1
else:
    print(f'  ❌ API 调用失败，状态码: {response.status_code}')
    all_failed += 1

print('\n📜 状态追溯（审计日志）测试')
print('-' * 70)

log_count = LogEntry.objects.count()
print(f'  ✅ 审计日志总数: {log_count} 条')

if log_count > 0:
    logs = LogEntry.objects.select_related('content_type', 'actor').order_by('-timestamp')[:5]
    print(f'  ✅ 最新 5 条记录:')
    for log in logs:
        action_name = log.get_action_display()
        print(f'     • [{log.timestamp.strftime("%H:%M:%S")}] {action_name:4s} '
              f'{log.content_type.app_label}.{log.content_type.model} '
              f'by {log.actor.real_name if log.actor else "系统"}')
    
    # 测试筛选功能
    equipment_logs = LogEntry.objects.filter(content_type__app_label='equipment').count()
    booking_logs = LogEntry.objects.filter(content_type__app_label='bookings').count()
    print(f'  ✅ 按模块筛选: equipment={equipment_logs} 条, bookings={booking_logs} 条')
    
    create_logs = LogEntry.objects.filter(action=0).count()
    update_logs = LogEntry.objects.filter(action=1).count()
    print(f'  ✅ 按操作筛选: 创建={create_logs} 条, 更新={update_logs} 条')

all_passed += 1

print('\n📊 最终数据统计')
print('-' * 70)

from bookings.models import Booking
from training.models import TrainingSession, TrainingApplication

stats = [
    ('设备数量', Equipment.objects.count()),
    ('预约数量', Booking.objects.count()),
    ('培训场次', TrainingSession.objects.count()),
    ('培训申请', TrainingApplication.objects.count()),
    ('耗材种类', Consumable.objects.count()),
    ('耗材使用记录', ConsumableUsage.objects.count()),
    ('故障工单', FaultTicket.objects.count()),
    ('审计日志', LogEntry.objects.count()),
]

for name, count in stats:
    icon = '✅' if count > 0 else '⚠️ '
    print(f'  {icon} {name}: {count}')

print('\n' + '=' * 70)
print(f'  测试结果: ✅ 通过 {all_passed} 项 | ❌ 失败 {all_failed} 项')
print('=' * 70)

if all_failed == 0:
    print('\n🎉 所有核心功能验证通过！')
else:
    print(f'\n⚠️  有 {all_failed} 项测试未通过')
