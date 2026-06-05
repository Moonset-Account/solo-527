from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from equipment.models import EquipmentCategory, Equipment
from training.models import TrainingCourse
from consumables.models import ConsumableCategory, Consumable
import uuid

User = get_user_model()


class Command(BaseCommand):
    help = '填充初始测试数据'

    def handle(self, *args, **options):
        self.stdout.write('开始填充初始数据...')

        admin, created = User.objects.get_or_create(
            email='admin@makerspace.com',
            defaults={
                'password': 'admin123',
                'real_name': '系统管理员',
                'phone': '13800138000',
                'role': User.Role.ADMIN,
                'is_staff': True,
                'is_superuser': True
            }
        )
        if created:
            admin.set_password('admin123')
            admin.save()
            self.stdout.write(self.style.SUCCESS(f'创建管理员: {admin.email}'))
        else:
            self.stdout.write(self.style.WARNING(f'管理员已存在: {admin.email}'))

        trainer, created = User.objects.get_or_create(
            email='trainer@makerspace.com',
            defaults={
                'password': 'trainer123',
                'real_name': '张培训师',
                'phone': '13800138001',
                'role': User.Role.TRAINER
            }
        )
        if created:
            trainer.set_password('trainer123')
            trainer.save()
            self.stdout.write(self.style.SUCCESS(f'创建培训师: {trainer.email}'))
        else:
            self.stdout.write(self.style.WARNING(f'培训师已存在: {trainer.email}'))

        technician, created = User.objects.get_or_create(
            email='tech@makerspace.com',
            defaults={
                'password': 'tech123',
                'real_name': '李技术',
                'phone': '13800138002',
                'role': User.Role.TECHNICIAN
            }
        )
        if created:
            technician.set_password('tech123')
            technician.save()
            self.stdout.write(self.style.SUCCESS(f'创建技术人员: {technician.email}'))
        else:
            self.stdout.write(self.style.WARNING(f'技术人员已存在: {technician.email}'))

        member, created = User.objects.get_or_create(
            email='member@makerspace.com',
            defaults={
                'password': 'member123',
                'real_name': '王会员',
                'phone': '13800138003',
                'role': User.Role.MEMBER
            }
        )
        if created:
            member.set_password('member123')
            member.save()
            self.stdout.write(self.style.SUCCESS(f'创建会员: {member.email}'))
        else:
            self.stdout.write(self.style.WARNING(f'会员已存在: {member.email}'))

        laser_cat, created = EquipmentCategory.objects.get_or_create(
            name='激光切割机',
            defaults={
                'description': '用于激光切割和雕刻',
                'requires_training': True,
                'is_dangerous': True
            }
        )
        printer_cat, created = EquipmentCategory.objects.get_or_create(
            name='3D打印机',
            defaults={
                'description': '用于3D打印制作',
                'requires_training': True,
                'is_dangerous': False
            }
        )
        solder_cat, created = EquipmentCategory.objects.get_or_create(
            name='焊台',
            defaults={
                'description': '用于电子焊接',
                'requires_training': True,
                'is_dangerous': True
            }
        )
        hand_cat, created = EquipmentCategory.objects.get_or_create(
            name='手动工具',
            defaults={
                'description': '普通手动工具',
                'requires_training': False,
                'is_dangerous': False
            }
        )
        self.stdout.write(self.style.SUCCESS('完成设备类别检查/创建'))

        Equipment.objects.get_or_create(
            serial_number='LASER-001',
            defaults={
                'name': '激光切割机-01',
                'category': laser_cat,
                'model_number': 'Epilog Fusion Pro',
                'location': 'A区-01',
                'status': 'available',
                'description': '80W CO2激光切割机，可切割木材、亚克力、皮革等材料',
                'created_by': admin
            }
        )
        Equipment.objects.get_or_create(
            serial_number='LASER-002',
            defaults={
                'name': '激光切割机-02',
                'category': laser_cat,
                'model_number': 'Trotec Speedy 300',
                'location': 'A区-02',
                'status': 'available',
                'description': '60W CO2激光切割机',
                'created_by': admin
            }
        )
        Equipment.objects.get_or_create(
            serial_number='PRINT-001',
            defaults={
                'name': '3D打印机-01',
                'category': printer_cat,
                'model_number': 'Prusa i3 MK3S+',
                'location': 'B区-01',
                'status': 'available',
                'description': 'FDM 3D打印机，支持PLA、ABS、PETG等材料',
                'created_by': admin
            }
        )
        Equipment.objects.get_or_create(
            serial_number='PRINT-002',
            defaults={
                'name': '3D打印机-02',
                'category': printer_cat,
                'model_number': 'Formlabs Form 3+',
                'location': 'B区-02',
                'status': 'available',
                'description': 'SLA光固化3D打印机',
                'created_by': admin
            }
        )
        Equipment.objects.get_or_create(
            serial_number='SOLDER-001',
            defaults={
                'name': '焊台-01',
                'category': solder_cat,
                'model_number': 'Hakko FX-888D',
                'location': 'C区-01',
                'status': 'available',
                'description': '数显恒温焊台',
                'created_by': admin
            }
        )
        Equipment.objects.get_or_create(
            serial_number='SOLDER-002',
            defaults={
                'name': '焊台-02',
                'category': solder_cat,
                'model_number': 'Weller WSD81',
                'location': 'C区-02',
                'status': 'maintenance',
                'description': '智能焊台（维护中）',
                'created_by': admin
            }
        )
        self.stdout.write(self.style.SUCCESS('完成设备数据检查/创建'))

        TrainingCourse.objects.get_or_create(
            name='激光切割机安全操作培训',
            defaults={
                'category': laser_cat,
                'duration_hours': 4,
                'description': '学习激光切割机的安全操作规范、材料选择、参数设置和日常维护',
                'prerequisites': '无',
                'max_participants': 8,
                'status': 'published',
                'created_by': admin
            }
        )
        TrainingCourse.objects.get_or_create(
            name='3D打印机基础培训',
            defaults={
                'category': printer_cat,
                'duration_hours': 2,
                'description': '学习3D打印机的基本操作、切片软件使用和常见问题处理',
                'prerequisites': '无',
                'max_participants': 10,
                'status': 'published',
                'created_by': admin
            }
        )
        TrainingCourse.objects.get_or_create(
            name='电子焊接安全培训',
            defaults={
                'category': solder_cat,
                'duration_hours': 3,
                'description': '学习电子焊接基础知识、安全操作规范和静电防护',
                'prerequisites': '无',
                'max_participants': 6,
                'status': 'published',
                'created_by': admin
            }
        )
        self.stdout.write(self.style.SUCCESS('完成培训课程检查/创建'))

        pla_cat, created = ConsumableCategory.objects.get_or_create(name='3D打印材料')
        solder_material_cat, created = ConsumableCategory.objects.get_or_create(name='焊接材料')
        laser_mat_cat, created = ConsumableCategory.objects.get_or_create(name='激光加工材料')

        Consumable.objects.get_or_create(
            sku='PLA-WHITE-001',
            defaults={
                'name': 'PLA耗材-白色',
                'category': pla_cat,
                'unit': '卷',
                'unit_price': 50.00,
                'current_stock': 20,
                'min_stock': 5,
                'max_stock': 50,
                'location': '耗材柜-A1',
                'created_by': admin
            }
        )
        Consumable.objects.get_or_create(
            sku='PLA-BLACK-001',
            defaults={
                'name': 'PLA耗材-黑色',
                'category': pla_cat,
                'unit': '卷',
                'unit_price': 50.00,
                'current_stock': 15,
                'min_stock': 5,
                'max_stock': 50,
                'location': '耗材柜-A2',
                'created_by': admin
            }
        )
        Consumable.objects.get_or_create(
            sku='SOLDER-08MM-001',
            defaults={
                'name': '焊锡丝-0.8mm',
                'category': solder_material_cat,
                'unit': '卷',
                'unit_price': 25.00,
                'current_stock': 30,
                'min_stock': 10,
                'max_stock': 100,
                'location': '耗材柜-B1',
                'created_by': admin
            }
        )
        Consumable.objects.get_or_create(
            sku='ACRYLIC-3MM-001',
            defaults={
                'name': '亚克力板-3mm',
                'category': laser_mat_cat,
                'unit': '张',
                'unit_price': 35.00,
                'current_stock': 10,
                'min_stock': 3,
                'max_stock': 20,
                'location': '材料架-C1',
                'created_by': admin
            }
        )
        Consumable.objects.get_or_create(
            sku='ABS-NATURAL-001',
            defaults={
                'name': 'ABS耗材-自然色',
                'category': pla_cat,
                'unit': '卷',
                'unit_price': 80.00,
                'current_stock': 8,
                'min_stock': 3,
                'max_stock': 30,
                'location': '耗材柜-A3',
                'created_by': admin
            }
        )
        self.stdout.write(self.style.SUCCESS('完成耗材数据检查/创建'))

        self.stdout.write(self.style.SUCCESS('\n数据填充完成！'))
        self.stdout.write('登录账号：')
        self.stdout.write('  管理员: admin@makerspace.com / admin123')
        self.stdout.write('  培训师: trainer@makerspace.com / trainer123')
        self.stdout.write('  技术人员: tech@makerspace.com / tech123')
        self.stdout.write('  会员: member@makerspace.com / member123')
