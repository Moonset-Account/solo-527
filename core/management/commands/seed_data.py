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

        if User.objects.filter(email='admin@makerspace.com').exists():
            self.stdout.write(self.style.WARNING('数据已存在，跳过填充'))
            return

        admin = User.objects.create_superuser(
            email='admin@makerspace.com',
            password='admin123',
            real_name='系统管理员',
            phone='13800138000',
            role=User.Role.ADMIN
        )
        self.stdout.write(self.style.SUCCESS(f'创建管理员: {admin.email}'))

        trainer = User.objects.create_user(
            email='trainer@makerspace.com',
            password='trainer123',
            real_name='张培训师',
            phone='13800138001',
            role=User.Role.TRAINER
        )
        self.stdout.write(self.style.SUCCESS(f'创建培训师: {trainer.email}'))

        technician = User.objects.create_user(
            email='tech@makerspace.com',
            password='tech123',
            real_name='李技术',
            phone='13800138002',
            role=User.Role.TECHNICIAN
        )
        self.stdout.write(self.style.SUCCESS(f'创建技术人员: {technician.email}'))

        member = User.objects.create_user(
            email='member@makerspace.com',
            password='member123',
            real_name='王会员',
            phone='13800138003',
            role=User.Role.MEMBER
        )
        self.stdout.write(self.style.SUCCESS(f'创建会员: {member.email}'))

        laser_cat = EquipmentCategory.objects.create(
            name='激光切割机',
            description='用于激光切割和雕刻',
            requires_training=True,
            is_dangerous=True
        )
        printer_cat = EquipmentCategory.objects.create(
            name='3D打印机',
            description='用于3D打印制作',
            requires_training=True,
            is_dangerous=False
        )
        solder_cat = EquipmentCategory.objects.create(
            name='焊台',
            description='用于电子焊接',
            requires_training=True,
            is_dangerous=True
        )
        hand_cat = EquipmentCategory.objects.create(
            name='手动工具',
            description='普通手动工具',
            requires_training=False,
            is_dangerous=False
        )
        self.stdout.write(self.style.SUCCESS('创建设备类别'))

        Equipment.objects.create(
            name='激光切割机-01',
            category=laser_cat,
            serial_number='LASER-001',
            model_number='Epilog Fusion Pro',
            location='A区-01',
            status='available',
            description='80W CO2激光切割机，可切割木材、亚克力、皮革等材料',
            created_by=admin
        )
        Equipment.objects.create(
            name='激光切割机-02',
            category=laser_cat,
            serial_number='LASER-002',
            model_number='Trotec Speedy 300',
            location='A区-02',
            status='available',
            description='60W CO2激光切割机',
            created_by=admin
        )
        Equipment.objects.create(
            name='3D打印机-01',
            category=printer_cat,
            serial_number='PRINT-001',
            model_number='Prusa i3 MK3S+',
            location='B区-01',
            status='available',
            description='FDM 3D打印机，支持PLA、ABS、PETG等材料',
            created_by=admin
        )
        Equipment.objects.create(
            name='3D打印机-02',
            category=printer_cat,
            serial_number='PRINT-002',
            model_number='Formlabs Form 3+',
            location='B区-02',
            status='available',
            description='SLA光固化3D打印机',
            created_by=admin
        )
        Equipment.objects.create(
            name='焊台-01',
            category=solder_cat,
            serial_number='SOLDER-001',
            model_number='Hakko FX-888D',
            location='C区-01',
            status='available',
            description='数显恒温焊台',
            created_by=admin
        )
        Equipment.objects.create(
            name='焊台-02',
            category=solder_cat,
            serial_number='SOLDER-002',
            model_number='Weller WSD81',
            location='C区-02',
            status='maintenance',
            description='智能焊台（维护中）',
            created_by=admin
        )
        self.stdout.write(self.style.SUCCESS('创建设备数据'))

        TrainingCourse.objects.create(
            name='激光切割机安全操作培训',
            category=laser_cat,
            duration_hours=4,
            description='学习激光切割机的安全操作规范、材料选择、参数设置和日常维护',
            prerequisites='无',
            max_participants=8,
            status='published',
            created_by=admin
        )
        TrainingCourse.objects.create(
            name='3D打印机基础培训',
            category=printer_cat,
            duration_hours=2,
            description='学习3D打印机的基本操作、切片软件使用和常见问题处理',
            prerequisites='无',
            max_participants=10,
            status='published',
            created_by=admin
        )
        TrainingCourse.objects.create(
            name='电子焊接安全培训',
            category=solder_cat,
            duration_hours=3,
            description='学习电子焊接基础知识、安全操作规范和静电防护',
            prerequisites='无',
            max_participants=6,
            status='published',
            created_by=admin
        )
        self.stdout.write(self.style.SUCCESS('创建培训课程'))

        pla_cat = ConsumableCategory.objects.create(name='3D打印材料')
        solder_material_cat = ConsumableCategory.objects.create(name='焊接材料')
        laser_mat_cat = ConsumableCategory.objects.create(name='激光加工材料')

        Consumable.objects.create(
            name='PLA耗材-白色',
            sku='PLA-WHITE-001',
            category=pla_cat,
            unit='卷',
            unit_price=50.00,
            current_stock=20,
            min_stock=5,
            max_stock=50,
            location='耗材柜-A1',
            created_by=admin
        )
        Consumable.objects.create(
            name='PLA耗材-黑色',
            sku='PLA-BLACK-001',
            category=pla_cat,
            unit='卷',
            unit_price=50.00,
            current_stock=15,
            min_stock=5,
            max_stock=50,
            location='耗材柜-A2',
            created_by=admin
        )
        Consumable.objects.create(
            name='焊锡丝-0.8mm',
            sku='SOLDER-08MM-001',
            category=solder_material_cat,
            unit='卷',
            unit_price=25.00,
            current_stock=30,
            min_stock=10,
            max_stock=100,
            location='耗材柜-B1',
            created_by=admin
        )
        Consumable.objects.create(
            name='亚克力板-3mm',
            sku='ACRYLIC-3MM-001',
            category=laser_mat_cat,
            unit='张',
            unit_price=35.00,
            current_stock=10,
            min_stock=3,
            max_stock=20,
            location='材料架-C1',
            created_by=admin
        )
        Consumable.objects.create(
            name='ABS耗材-自然色',
            sku='ABS-NATURAL-001',
            category=pla_cat,
            unit='卷',
            unit_price=80.00,
            current_stock=8,
            min_stock=3,
            max_stock=30,
            location='耗材柜-A3',
            created_by=admin
        )
        self.stdout.write(self.style.SUCCESS('创建耗材数据'))

        self.stdout.write(self.style.SUCCESS('\n初始数据填充完成！'))
        self.stdout.write('登录账号：')
        self.stdout.write('  管理员: admin@makerspace.com / admin123')
        self.stdout.write('  培训师: trainer@makerspace.com / trainer123')
        self.stdout.write('  技术人员: tech@makerspace.com / tech123')
        self.stdout.write('  会员: member@makerspace.com / member123')
