import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'makerspace.settings')
import django
django.setup()

from django.contrib.auth import get_user_model
from equipment.models import Equipment, EquipmentCategory
from bookings.models import Booking
from training.models import TrainingCourse, TrainingApplication, TrainingSession, TrainingCertification
from consumables.models import Consumable, ConsumableUsage
from maintenance.models import FaultTicket
from safety.models import SafetyIncident
from django.utils import timezone
from datetime import timedelta

User = get_user_model()

print("生成审计日志测试数据...\n")

admin = User.objects.get(email='admin@makerspace.com')
member = User.objects.get(email='member@makerspace.com')
trainer = User.objects.get(email='trainer@makerspace.com')
tech = User.objects.get(email='tech@makerspace.com')

print("1. 创建设备变更记录...")
eq = Equipment.objects.filter(status='available').first()
if eq:
    eq.description = eq.description + " - 已校准"
    eq.save()
    print(f"   更新设备: {eq.name}")

print("\n2. 创建预约变更记录...")
booking = Booking.objects.first()
if booking:
    booking.purpose = booking.purpose + " - 用途更新"
    booking.save()
    print(f"   更新预约: {booking.equipment.name}")

print("\n3. 创建培训申请审批记录...")
app = TrainingApplication.objects.filter(status='pending').first()
if app:
    app.status = 'approved'
    app.reviewed_by = trainer
    app.reviewed_at = timezone.now()
    app.save()
    print(f"   审批培训申请: {app.user.real_name} - {app.session.course.name}")

    cert, created = TrainingCertification.objects.get_or_create(
        user=app.user,
        course=app.session.course,
        defaults={
            'certificate_number': f'CERT-{timezone.now().strftime("%Y%m%d")}-001',
            'issued_date': timezone.now().date(),
            'expiry_date': (timezone.now() + timedelta(days=365)).date(),
            'issued_by': trainer,
            'status': 'valid',
            'created_by': trainer,
        }
    )
    if created:
        print(f"   颁发证书: {cert.certificate_number}")

print("\n4. 创建耗材使用记录...")
consumable = Consumable.objects.first()
if consumable:
    usage = ConsumableUsage.objects.create(
        consumable=consumable,
        user=member,
        quantity=1,
        unit_price=consumable.unit_price,
        total_price=consumable.unit_price * 1,
        notes='测试领用',
        created_by=member,
    )
    consumable.current_stock -= 1
    consumable.save()
    print(f"   领用耗材: {consumable.name} x 1")

print("\n5. 创建故障单记录...")
equipment = Equipment.objects.filter(status='available').first()
if equipment:
    ticket = FaultTicket.objects.create(
        title='测试故障 - 设备异响',
        description='设备运行时有异常响声，需要检查',
        equipment=equipment,
        reported_by=member,
        priority='high',
        status='open',
        created_by=member,
    )
    print(f"   创建故障单: {ticket.title}")
    
    ticket.status = 'in_progress'
    ticket.assigned_to = tech
    ticket.save()
    print(f"   分配故障单给技术人员")

print("\n6. 创建安全事件记录...")
incident = SafetyIncident.objects.create(
    title='测试安全事件 - 轻微烫伤',
    description='使用焊台时轻微烫伤手指，已处理',
    severity='low',
    location='C区焊接区',
    incident_time=timezone.now(),
    reported_by=member,
    status='reported',
    created_by=member,
)
print(f"   上报安全事件: {incident.title}")

from auditlog.models import LogEntry
count = LogEntry.objects.count()
print(f"\n✅ 审计日志记录总数: {count}")
print("\n所有测试数据生成完成！")
