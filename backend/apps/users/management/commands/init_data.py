from django.core.management.base import BaseCommand
from apps.users.models import User, Role, RoleConfig
from apps.rooms.models import StudyRoom, Seat


class Command(BaseCommand):
    help = '初始化系统默认数据'

    def handle(self, *args, **options):
        self.stdout.write('🌱 开始初始化默认数据...')

        self._init_role_configs()
        self._init_default_users()
        self._init_study_rooms()

        self.stdout.write(self.style.SUCCESS('✅ 默认数据初始化完成！'))

    def _init_role_configs(self):
        self.stdout.write('  初始化角色配置...')
        roles = [
            (Role.STUDENT, '学生', '学生角色，可提交报修、预约座位'),
            (Role.DORM_MANAGER, '宿管老师', '宿管老师，可审核身份、管理座位、处理签到'),
            (Role.MAINTENANCE, '维修人员', '维修人员，可处理报修工单'),
            (Role.ADMIN, '管理员', '系统管理员，拥有全部权限'),
        ]
        for role, name, desc in roles:
            obj, created = RoleConfig.objects.get_or_create(
                role=role,
                defaults={'description': desc, 'permissions': {}}
            )
            if created:
                self.stdout.write(f'    + 创建角色配置: {name}')

    def _init_default_users(self):
        self.stdout.write('  初始化默认用户...')

        if not User.objects.filter(username='admin').exists():
            User.objects.create_superuser(
                username='admin',
                password='admin123',
                real_name='系统管理员',
                role=Role.ADMIN,
                is_verified=True,
                email='admin@example.com',
            )
            self.stdout.write(self.style.SUCCESS('    + 创建管理员: admin / admin123'))

        if not User.objects.filter(username='student').exists():
            User.objects.create_user(
                username='student',
                password='123456',
                real_name='张三',
                role=Role.STUDENT,
                student_id='2024001',
                dorm_building='1号楼',
                dorm_room='301',
                phone='13800138000',
                is_verified=True,
                email='student@example.com',
            )
            self.stdout.write(self.style.SUCCESS('    + 创建学生: student / 123456'))

        if not User.objects.filter(username='dorm').exists():
            User.objects.create_user(
                username='dorm',
                password='123456',
                real_name='李老师',
                role=Role.DORM_MANAGER,
                student_id='T001',
                dorm_building='1号楼',
                phone='13800138001',
                is_verified=True,
                email='dorm@example.com',
            )
            self.stdout.write(self.style.SUCCESS('    + 创建宿管: dorm / 123456'))

        if not User.objects.filter(username='worker').exists():
            User.objects.create_user(
                username='worker',
                password='123456',
                real_name='王师傅',
                role=Role.MAINTENANCE,
                student_id='W001',
                phone='13800138002',
                is_verified=True,
                email='worker@example.com',
            )
            self.stdout.write(self.style.SUCCESS('    + 创建维修: worker / 123456'))

    def _init_study_rooms(self):
        self.stdout.write('  初始化自习室数据...')
        rooms_data = [
            {'name': '第一自习室', 'building': '1号楼', 'floor': 2, 'total_seats': 40, 'open_time': '07:00', 'close_time': '22:00'},
            {'name': '第二自习室', 'building': '1号楼', 'floor': 3, 'total_seats': 50, 'open_time': '07:00', 'close_time': '22:00'},
            {'name': '电子阅览室', 'building': '2号楼', 'floor': 1, 'total_seats': 30, 'open_time': '08:00', 'close_time': '21:00'},
        ]

        for room_data in rooms_data:
            room, created = StudyRoom.objects.get_or_create(
                name=room_data['name'],
                building=room_data['building'],
                defaults=room_data
            )
            if created:
                self.stdout.write(f'    + 创建自习室: {room.building}-{room.name}')
                self._create_seats(room)

    def _create_seats(self, room):
        rows = 5
        cols = room.total_seats // rows
        seat_num = 1
        for r in range(1, rows + 1):
            for c in range(1, cols + 1):
                Seat.objects.create(
                    study_room=room,
                    seat_number=f'A{seat_num:02d}',
                    row=r,
                    col=c,
                    has_power=(c % 2 == 0),
                    has_window=(r == 1),
                    is_active=True,
                )
                seat_num += 1
                if seat_num > room.total_seats:
                    return
