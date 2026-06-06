from django.core.management.base import BaseCommand
from django.contrib.auth.models import Group, Permission
from users.models import Role, User


class Command(BaseCommand):
    help = '初始化角色和权限系统'

    def handle(self, *args, **options):
        self.stdout.write('开始初始化角色...')

        roles_data = [
            {
                'name': Role.CURATOR,
                'display_name': '策展人',
                'description': '负责展览策划，提交物料需求和布展时段',
                'permissions': [
                    'view_exhibition', 'add_exhibition', 'change_exhibition',
                    'view_borroworder', 'add_borroworder', 'change_borroworder',
                    'view_borrowitem',
                    'view_material',
                    'view_inventoryitem',
                    'view_dailyschedule', 'view_scheduleconflict',
                    'view_notification',
                ]
            },
            {
                'name': Role.WAREHOUSE_KEEPER,
                'display_name': '仓管',
                'description': '负责库存管理，确认可用库存，处理借用和归还',
                'permissions': [
                    'view_material', 'add_material', 'change_material',
                    'view_inventoryitem', 'add_inventoryitem', 'change_inventoryitem',
                    'view_inventoryreservation', 'change_inventoryreservation',
                    'view_borroworder', 'change_borroworder',
                    'view_borrowitem', 'change_borrowitem',
                    'view_approvalrecord',
                    'view_transportrecord', 'add_transportrecord', 'change_transportrecord',
                    'view_dailyschedule',
                    'view_notification',
                ]
            },
            {
                'name': Role.CONSTRUCTION_LEAD,
                'display_name': '施工负责人',
                'description': '负责按展厅领取和归还物料',
                'permissions': [
                    'view_borroworder',
                    'view_borrowitem', 'change_borrowitem',
                    'view_transportrecord',
                    'view_dailyschedule',
                    'view_notification',
                ]
            },
            {
                'name': Role.ADMIN,
                'display_name': '管理员',
                'description': '系统管理员，拥有所有权限',
                'permissions': []
            },
        ]

        for role_data in roles_data:
            role, created = Role.objects.get_or_create(
                name=role_data['name'],
                defaults={
                    'display_name': role_data['display_name'],
                    'description': role_data['description'],
                }
            )

            if created:
                self.stdout.write(f'  创建角色: {role.display_name}')
            else:
                self.stdout.write(f'  更新角色: {role.display_name}')

            if role_data['permissions']:
                role.permissions.clear()
                for perm_codename in role_data['permissions']:
                    try:
                        app_label, codename = perm_codename.split('_', 1)
                        perm = Permission.objects.get(content_type__app_label=app_label, codename=perm_codename)
                        role.permissions.add(perm)
                    except Permission.DoesNotExist:
                        self.stdout.write(f'    警告: 权限不存在 {perm_codename}')

        self.stdout.write('角色初始化完成!')

        self.stdout.write('\n创建默认用户...')
        default_users = [
            {
                'username': 'curator',
                'password': 'curator123',
                'email': 'curator@museum.com',
                'first_name': '策',
                'last_name': '展人',
                'role': Role.CURATOR,
            },
            {
                'username': 'warehouse',
                'password': 'warehouse123',
                'email': 'warehouse@museum.com',
                'first_name': '仓',
                'last_name': '管',
                'role': Role.WAREHOUSE_KEEPER,
            },
            {
                'username': 'construction',
                'password': 'construction123',
                'email': 'construction@museum.com',
                'first_name': '施',
                'last_name': '工',
                'role': Role.CONSTRUCTION_LEAD,
            },
            {
                'username': 'admin',
                'password': 'admin123',
                'email': 'admin@museum.com',
                'first_name': '管',
                'last_name': '理员',
                'role': Role.ADMIN,
                'is_staff': True,
                'is_superuser': True,
            },
        ]

        for user_data in default_users:
            user, created = User.objects.get_or_create(
                username=user_data['username'],
                defaults={
                    'email': user_data['email'],
                    'first_name': user_data['first_name'],
                    'last_name': user_data['last_name'],
                    'is_staff': user_data.get('is_staff', False),
                    'is_superuser': user_data.get('is_superuser', False),
                }
            )

            if created:
                user.set_password(user_data['password'])
                user.save()
                self.stdout.write(f'  创建用户: {user.username}')
            else:
                self.stdout.write(f'  用户已存在: {user.username}')

            try:
                role = Role.objects.get(name=user_data['role'])
                user.role = role
                user.save()
            except Role.DoesNotExist:
                pass

        self.stdout.write('默认用户创建完成!')
