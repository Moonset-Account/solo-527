from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta
from rehearsal.models import (
    Member, Play, Room, Equipment, Prop,
    Rehearsal, PropUsage
)


class Command(BaseCommand):
    help = '初始化示例数据'

    def handle(self, *args, **options):
        self.stdout.write('开始初始化数据...')

        admin_user, _ = User.objects.get_or_create(
            username='admin',
            defaults={'is_superuser': True, 'is_staff': True, 'email': 'admin@example.com'}
        )
        admin_user.set_password('admin123')
        admin_user.save()

        director_user, _ = User.objects.get_or_create(
            username='director1',
            defaults={'is_staff': False, 'email': 'director1@example.com'}
        )
        director_user.set_password('123456')
        director_user.save()

        actor1_user, _ = User.objects.get_or_create(
            username='actor1',
            defaults={'is_staff': False, 'email': 'actor1@example.com'}
        )
        actor1_user.set_password('123456')
        actor1_user.save()

        actor2_user, _ = User.objects.get_or_create(
            username='actor2',
            defaults={'is_staff': False, 'email': 'actor2@example.com'}
        )
        actor2_user.set_password('123456')
        actor2_user.save()

        admin_member, _ = Member.objects.get_or_create(
            user=admin_user,
            defaults={'name': '管理员', 'role': 'admin', 'phone': '13800000000', 'email': 'admin@example.com'}
        )

        director_member, _ = Member.objects.get_or_create(
            user=director_user,
            defaults={'name': '张导演', 'role': 'director', 'phone': '13800000001', 'email': 'director1@example.com'}
        )

        actor1_member, _ = Member.objects.get_or_create(
            user=actor1_user,
            defaults={'name': '李演员', 'role': 'actor', 'phone': '13800000002', 'email': 'actor1@example.com'}
        )

        actor2_member, _ = Member.objects.get_or_create(
            user=actor2_user,
            defaults={'name': '王演员', 'role': 'actor', 'phone': '13800000003', 'email': 'actor2@example.com'}
        )

        room1, _ = Room.objects.get_or_create(
            name='一号排练厅',
            defaults={
                'capacity': 30,
                'has_lighting': True,
                'has_sound': True,
                'has_stage': True,
                'description': '大型排练厅，配备专业灯光音响设备',
                'is_available': True
            }
        )

        room2, _ = Room.objects.get_or_create(
            name='二号排练厅',
            defaults={
                'capacity': 15,
                'has_lighting': False,
                'has_sound': True,
                'has_stage': False,
                'description': '中型排练厅，适合日常排练',
                'is_available': True
            }
        )

        room3, _ = Room.objects.get_or_create(
            name='三号小型排练室',
            defaults={
                'capacity': 8,
                'has_lighting': False,
                'has_sound': False,
                'has_stage': False,
                'description': '小型排练室，适合台词排练',
                'is_available': True
            }
        )

        Equipment.objects.get_or_create(
            name='主舞台灯光系统',
            defaults={'type': 'lighting', 'room': room1, 'is_working': True}
        )
        Equipment.objects.get_or_create(
            name='专业音响系统',
            defaults={'type': 'sound', 'room': room1, 'is_working': True}
        )
        Equipment.objects.get_or_create(
            name='便携音响',
            defaults={'type': 'sound', 'room': room2, 'is_working': True}
        )

        prop1, _ = Prop.objects.get_or_create(
            name='中式桌椅套装',
            defaults={'category': 'furniture', 'quantity': 5, 'description': '古典风格桌椅'}
        )
        prop2, _ = Prop.objects.get_or_create(
            name='宝剑',
            defaults={'category': 'weapon', 'quantity': 3, 'description': '道具剑'}
        )
        prop3, _ = Prop.objects.get_or_create(
            name='古代长袍',
            defaults={'category': 'clothing', 'quantity': 10, 'description': '古装演出服'}
        )
        prop4, _ = Prop.objects.get_or_create(
            name='茶杯',
            defaults={'category': 'daily', 'quantity': 20, 'description': '瓷质茶杯道具'}
        )
        prop5, _ = Prop.objects.get_or_create(
            name='折扇',
            defaults={'category': 'daily', 'quantity': 8, 'description': '纸折扇'}
        )

        today = timezone.localdate()
        performance_date = today + timedelta(days=30)

        play1, _ = Play.objects.get_or_create(
            title='雷雨',
            defaults={
                'director': director_member,
                'description': '曹禺经典话剧',
                'performance_date': performance_date,
                'status': 'rehearsing'
            }
        )
        play1.cast.add(actor1_member, actor2_member)

        play2, _ = Play.objects.get_or_create(
            title='茶馆',
            defaults={
                'director': director_member,
                'description': '老舍经典话剧',
                'performance_date': performance_date + timedelta(days=15),
                'status': 'preparing'
            }
        )
        play2.cast.add(actor1_member, actor2_member, admin_member)

        rehearsal1, _ = Rehearsal.objects.get_or_create(
            play=play1,
            room=room1,
            date=today + timedelta(days=1),
            start_time='14:00',
            end_time='17:00',
            defaults={
                'director': director_member,
                'need_lighting': True,
                'status': 'approved',
                'created_by': admin_member,
                'notes': '第一幕排练'
            }
        )
        rehearsal1.members.add(actor1_member, actor2_member, director_member)

        PropUsage.objects.get_or_create(
            prop=prop1,
            rehearsal=rehearsal1,
            defaults={'quantity': 2}
        )
        PropUsage.objects.get_or_create(
            prop=prop3,
            rehearsal=rehearsal1,
            defaults={'quantity': 3}
        )

        rehearsal2, _ = Rehearsal.objects.get_or_create(
            play=play2,
            room=room2,
            date=today + timedelta(days=2),
            start_time='09:00',
            end_time='12:00',
            defaults={
                'director': director_member,
                'need_lighting': False,
                'status': 'pending',
                'created_by': director_member,
                'notes': '剧本研读'
            }
        )
        rehearsal2.members.add(actor1_member, actor2_member)

        self.stdout.write(self.style.SUCCESS('数据初始化完成！'))
        self.stdout.write('管理员账号: admin / admin123')
        self.stdout.write('导演账号: director1 / 123456')
        self.stdout.write('演员账号: actor1 / 123456, actor2 / 123456')
