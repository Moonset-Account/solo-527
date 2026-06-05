import os
import sys
import django

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'makerspace.settings')
django.setup()

from training.models import TrainingCourse, TrainingSession, TrainingApplication
from bookings.models import Booking
from core.models import User
from equipment.models import Equipment
from django.utils import timezone
from datetime import timedelta

print("开始添加测试数据...")

trainer = User.objects.get(email='trainer@makerspace.com')
member = User.objects.get(email='member@makerspace.com')
admin = User.objects.get(email='admin@makerspace.com')

courses = TrainingCourse.objects.all()
print(f'现有课程数量: {courses.count()}')

for course in courses:
    for i in range(2):
        session_date = timezone.now() + timedelta(days=7 + i * 7)
        session, created = TrainingSession.objects.get_or_create(
            course=course,
            start_time=session_date.replace(hour=14, minute=0, second=0, microsecond=0),
            defaults={
                'end_time': session_date.replace(hour=16, minute=0, second=0, microsecond=0),
                'trainer': trainer,
                'location': '培训室-' + ['A', 'B'][i],
                'max_participants': 8,
                'created_by': trainer,
            }
        )
        if created:
            print(f'  创建培训场次: {course.name} - {session.start_time.date()}')

print(f'培训场次数量: {TrainingSession.objects.count()}')

first_session = TrainingSession.objects.first()
if first_session:
    app, created = TrainingApplication.objects.get_or_create(
        user=member,
        session=first_session,
        defaults={
            'status': 'pending',
            'created_by': member,
        }
    )
    if created:
        print(f'  创建培训申请: {member.real_name} - {first_session.course.name}')

print(f'培训申请数量: {TrainingApplication.objects.count()}')

equipments = Equipment.objects.filter(status='available')
print(f'可用设备数量: {equipments.count()}')

for i, equipment in enumerate(equipments[:3]):
    booking_date = timezone.now() + timedelta(days=1 + i)
    start_time = booking_date.replace(hour=10, minute=0, second=0, microsecond=0)
    end_time = booking_date.replace(hour=12, minute=0, second=0, microsecond=0)
    
    booking, created = Booking.objects.get_or_create(
        user=member,
        equipment=equipment,
        start_time=start_time,
        defaults={
            'end_time': end_time,
            'purpose': f'测试预约 - {equipment.name}',
            'status': 'approved',
            'created_by': member,
        }
    )
    if created:
        print(f'  创建预约: {equipment.name} - {booking_date.date()} 10:00-12:00')

print(f'预约数量: {Booking.objects.count()}')
print('\n所有测试数据添加完成！')
