from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.projects.models import Project
from apps.materials.models import Material
from datetime import date

User = get_user_model()


class Command(BaseCommand):
    help = 'Initialize demo data'

    def handle(self, *args, **options):
        self.stdout.write('Creating demo users...')

        users_data = [
            {'email': 'admin@example.com', 'password': 'admin123', 'first_name': '系统', 'last_name': '管理员', 'role': 'admin', 'department': '管理部'},
            {'email': 'pm@example.com', 'password': 'pm123456', 'first_name': '张', 'last_name': '经理', 'role': 'project_manager', 'department': '项目部'},
            {'email': 'material@example.com', 'password': 'mat123456', 'first_name': '李', 'last_name': '材料', 'role': 'material_staff', 'department': '物资部'},
            {'email': 'inspector@example.com', 'password': 'ins123456', 'first_name': '王', 'last_name': '巡检', 'role': '巡检', 'department': '质检部'},
            {'email': 'finance@example.com', 'password': 'fin123456', 'first_name': '赵', 'last_name': '财务', 'role': 'finance', 'department': '财务部'},
        ]

        users = {}
        for u in users_data:
            user, created = User.objects.get_or_create(
                email=u['email'],
                defaults={
                    'first_name': u['first_name'],
                    'last_name': u['last_name'],
                    'role': u['role'],
                    'department': u['department'],
                    'is_staff': u['role'] == 'admin',
                    'is_superuser': u['role'] == 'admin',
                }
            )
            if created:
                user.set_password(u['password'])
                user.save()
            users[u['role']] = user

        self.stdout.write(self.style.SUCCESS(f'Created {len(users)} users'))

        self.stdout.write('Creating demo projects...')
        projects_data = [
            {'code': 'PRJ2024001', 'name': '阳光花园 3号楼精装修', 'address': '北京市朝阳区阳光路 88号',
             'client_name': '陈先生', 'client_phone': '13800138001',
             'status': 'in_progress', 'area': 1200.00,
             'start_date': date(2024, 1, 15), 'end_date': date(2024, 6, 30)},
            {'code': 'PRJ2024002', 'name': '星光大厦写字楼装修', 'address': '上海市浦东新区星光大道 66号',
             'client_name': '星光集团', 'client_phone': '021-88886666',
             'status': 'quoting', 'area': 3500.00,
             'start_date': date(2024, 3, 1), 'end_date': date(2024, 12, 31)},
            {'code': 'PRJ2024003', 'name': '海景别墅整体装修', 'address': '深圳市南山区滨海大道 1号',
             'client_name': '周女士', 'client_phone': '13900139002',
             'status': 'draft', 'area': 680.00,
             'start_date': date(2024, 5, 1), 'end_date': date(2024, 11, 30)},
        ]

        for p in projects_data:
            Project.objects.get_or_create(
                code=p['code'],
                defaults={
                    **p,
                    'project_manager': users.get('project_manager'),
                    'material_staff': users.get('material_staff'),
                    'created_by': users.get('admin'),
                }
            )

        self.stdout.write(self.style.SUCCESS('Created projects'))

        self.stdout.write('Creating demo materials...')
        materials_data = [
            {'code': 'MAT001', 'name': '瓷砖', 'category': 'decoration', 'specification': '800x800mm', 'brand': '马可波罗', 'unit': '块', 'unit_price': 85.00, 'stock_quantity': 500},
            {'code': 'MAT002', 'name': '乳胶漆', 'category': 'decoration', 'specification': '5L', 'brand': '立邦', 'unit': '桶', 'unit_price': 380.00, 'stock_quantity': 50},
            {'code': 'MAT003', 'name': '电线', 'category': 'electrical', 'specification': '2.5mm²', 'brand': '远东', 'unit': '米', 'unit_price': 3.50, 'stock_quantity': 2000},
            {'code': 'MAT004', 'name': 'PPR水管', 'category': 'plumbing', 'specification': '25mm', 'brand': '金牛', 'unit': '米', 'unit_price': 8.00, 'stock_quantity': 500},
            {'code': 'MAT005', 'name': '水泥', 'category': 'structure', 'specification': 'P.O 42.5', 'brand': '海螺', 'unit': '袋', 'unit_price': 28.00, 'stock_quantity': 200},
            {'code': 'MAT006', 'name': '铰链', 'category': 'hardware', 'specification': '不锈钢', 'brand': '海蒂诗', 'unit': '个', 'unit_price': 15.00, 'stock_quantity': 5},
            {'code': 'MAT007', 'name': '防水涂料', 'category': 'chemical', 'specification': '20kg', 'brand': '雨虹', 'unit': '桶', 'unit_price': 280.00, 'stock_quantity': 30},
        ]

        for m in materials_data:
            Material.objects.get_or_create(code=m['code'], defaults=m)

        self.stdout.write(self.style.SUCCESS('Created materials'))
        self.stdout.write(self.style.SUCCESS('Demo data initialized successfully!'))
        self.stdout.write('Default login with: admin@example.com / admin123')
