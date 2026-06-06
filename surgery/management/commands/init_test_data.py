from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import date, timedelta
from inventory.models import SupplyCategory, Supply, Batch
from surgery.models import SurgicalTemplate, TemplateSupplyItem, OperationSchedule, PreparedItem, UsageRecord, ReturnRecord, HighValueAudit


class Command(BaseCommand):
    help = '初始化测试数据，包含换术式、退包、批号过期三类验收数据'

    def handle(self, *args, **options):
        self.stdout.write('开始初始化测试数据...')

        admin_user, _ = User.objects.get_or_create(
            username='admin',
            defaults={
                'email': 'a****@***********',
                'is_staff': True,
                'is_superuser': True,
            }
        )
        admin_user.set_password('admin123456')
        admin_user.save()

        nurse1, _ = User.objects.get_or_create(
            username='nurse1',
            defaults={'email': 'n******@***********', 'is_staff': True}
        )
        nurse1.set_password('nurse123456')
        nurse1.save()

        nurse2, _ = User.objects.get_or_create(
            username='nurse2',
            defaults={'email': 'n******@***********', 'is_staff': True}
        )
        nurse2.set_password('nurse123456')
        nurse2.save()

        cat1, _ = SupplyCategory.objects.get_or_create(name='普通耗材', description='手术常用普通耗材')
        cat2, _ = SupplyCategory.objects.get_or_create(name='高值耗材', description='高值医用耗材')
        cat3, _ = SupplyCategory.objects.get_or_create(name='器械包', description='手术器械包')

        supplies_data = [
            {'name': '一次性手术衣', 'code': 'SSY-001', 'category': cat1, 'supply_type': 'NORMAL', 'specification': 'L号', 'unit': '件', 'price': 25.00, 'warning_threshold': 50},
            {'name': '一次性手套', 'code': 'ST-001', 'category': cat1, 'supply_type': 'NORMAL', 'specification': '7.5号', 'unit': '副', 'price': 8.50, 'warning_threshold': 100},
            {'name': '纱布块', 'code': 'SB-001', 'category': cat1, 'supply_type': 'NORMAL', 'specification': '10x10cm', 'unit': '包', 'price': 5.00, 'warning_threshold': 80},
            {'name': '缝合线', 'code': 'FH-001', 'category': cat1, 'supply_type': 'NORMAL', 'specification': '4-0', 'unit': '根', 'price': 15.00, 'warning_threshold': 30},
            {'name': '人工髋关节', 'code': 'RGK-001', 'category': cat2, 'supply_type': 'HIGH_VALUE', 'specification': '标准型', 'unit': '套', 'price': 25000.00, 'warning_threshold': 3},
            {'name': '心脏支架', 'code': 'XZJ-001', 'category': cat2, 'supply_type': 'HIGH_VALUE', 'specification': '药物洗脱', 'unit': '个', 'price': 18000.00, 'warning_threshold': 2},
            {'name': '骨科基础器械包', 'code': 'GKQX-001', 'category': cat3, 'supply_type': 'DEVICE', 'specification': '标准配置', 'unit': '包', 'price': 500.00, 'warning_threshold': 5},
            {'name': '腹部手术器械包', 'code': 'FBQX-001', 'category': cat3, 'supply_type': 'DEVICE', 'specification': '标准配置', 'unit': '包', 'price': 600.00, 'warning_threshold': 5},
            {'name': '注射器', 'code': 'ZSQ-001', 'category': cat1, 'supply_type': 'NORMAL', 'specification': '5ml', 'unit': '支', 'price': 2.00, 'warning_threshold': 200},
            {'name': '留置针', 'code': 'LZZ-001', 'category': cat1, 'supply_type': 'NORMAL', 'specification': '20G', 'unit': '支', 'price': 12.00, 'warning_threshold': 50},
        ]

        supplies = {}
        for data in supplies_data:
            supply, _ = Supply.objects.get_or_create(code=data['code'], defaults=data)
            supplies[supply.code] = supply

        today = date.today()
        future_1y = today + timedelta(days=365)
        future_6m = today + timedelta(days=180)
        future_1m = today + timedelta(days=15)
        past_1m = today - timedelta(days=30)
        past_1w = today - timedelta(days=7)

        batches_data = [
            {'supply': supplies['SSY-001'], 'batch_number': 'SY20240001', 'production_date': today - timedelta(days=60), 'expiry_date': future_1y, 'quantity': 100, 'storage_location': 'A-01-01', 'supplier': '供应商A'},
            {'supply': supplies['SSY-001'], 'batch_number': 'SY20240002', 'production_date': today - timedelta(days=30), 'expiry_date': future_6m, 'quantity': 80, 'storage_location': 'A-01-02', 'supplier': '供应商A'},
            {'supply': supplies['ST-001'], 'batch_number': 'ST20240001', 'production_date': today - timedelta(days=90), 'expiry_date': future_6m, 'quantity': 200, 'storage_location': 'A-02-01', 'supplier': '供应商B'},
            {'supply': supplies['SB-001'], 'batch_number': 'SB20240001', 'production_date': today - timedelta(days=120), 'expiry_date': future_1m, 'quantity': 150, 'storage_location': 'A-03-01', 'supplier': '供应商C'},
            {'supply': supplies['FH-001'], 'batch_number': 'FH20230001', 'production_date': today - timedelta(days=400), 'expiry_date': past_1m, 'quantity': 20, 'storage_location': 'A-04-01', 'supplier': '供应商D', 'is_expired': True},
            {'supply': supplies['FH-001'], 'batch_number': 'FH20240001', 'production_date': today - timedelta(days=60), 'expiry_date': future_1y, 'quantity': 50, 'storage_location': 'A-04-02', 'supplier': '供应商D'},
            {'supply': supplies['RGK-001'], 'batch_number': 'RGK20240001', 'production_date': today - timedelta(days=30), 'expiry_date': future_6m, 'quantity': 5, 'storage_location': 'B-01-01', 'supplier': '供应商E'},
            {'supply': supplies['RGK-001'], 'batch_number': 'RGK20230001', 'production_date': today - timedelta(days=365), 'expiry_date': past_1w, 'quantity': 2, 'storage_location': 'B-01-02', 'supplier': '供应商E', 'is_expired': True},
            {'supply': supplies['XZJ-001'], 'batch_number': 'XZJ20240001', 'production_date': today - timedelta(days=15), 'expiry_date': future_1y, 'quantity': 3, 'storage_location': 'B-02-01', 'supplier': '供应商F'},
            {'supply': supplies['GKQX-001'], 'batch_number': 'GKQX2024001', 'production_date': today - timedelta(days=10), 'expiry_date': future_1y, 'quantity': 10, 'storage_location': 'C-01-01', 'supplier': '供应商G'},
            {'supply': supplies['FBQX-001'], 'batch_number': 'FBQX2024001', 'production_date': today - timedelta(days=10), 'expiry_date': future_1y, 'quantity': 8, 'storage_location': 'C-02-01', 'supplier': '供应商G'},
            {'supply': supplies['ZSQ-001'], 'batch_number': 'ZSQ20240001', 'production_date': today - timedelta(days=60), 'expiry_date': future_1y, 'quantity': 500, 'storage_location': 'A-05-01', 'supplier': '供应商H'},
            {'supply': supplies['LZZ-001'], 'batch_number': 'LZZ20240001', 'production_date': today - timedelta(days=45), 'expiry_date': future_6m, 'quantity': 100, 'storage_location': 'A-06-01', 'supplier': '供应商I'},
        ]

        for data in batches_data:
            Batch.objects.get_or_create(
                supply=data['supply'],
                batch_number=data['batch_number'],
                defaults=data
            )

        template1, _ = SurgicalTemplate.objects.get_or_create(
            code='OP001',
            defaults={
                'name': '髋关节置换术',
                'department': '骨科',
                'description': '人工髋关节置换手术',
                'estimated_duration': 180,
                'created_by': admin_user,
            }
        )

        template2, _ = SurgicalTemplate.objects.get_or_create(
            code='OP002',
            defaults={
                'name': '阑尾切除术',
                'department': '普外科',
                'description': '腹腔镜阑尾切除术',
                'estimated_duration': 90,
                'created_by': admin_user,
            }
        )

        template3, _ = SurgicalTemplate.objects.get_or_create(
            code='OP003',
            defaults={
                'name': '冠状动脉支架植入术',
                'department': '心内科',
                'description': '经皮冠状动脉介入治疗',
                'estimated_duration': 120,
                'created_by': admin_user,
            }
        )

        template_items = [
            {'template': template1, 'supply': supplies['SSY-001'], 'item_type': 'REQUIRED', 'quantity': 4, 'remark': '医生2件，护士2件'},
            {'template': template1, 'supply': supplies['ST-001'], 'item_type': 'REQUIRED', 'quantity': 6, 'remark': '无菌手套'},
            {'template': template1, 'supply': supplies['SB-001'], 'item_type': 'REQUIRED', 'quantity': 10, 'remark': '止血用'},
            {'template': template1, 'supply': supplies['FH-001'], 'item_type': 'REQUIRED', 'quantity': 2, 'remark': '缝合伤口'},
            {'template': template1, 'supply': supplies['RGK-001'], 'item_type': 'HIGH_VALUE', 'quantity': 1, 'remark': '人工髋关节假体'},
            {'template': template1, 'supply': supplies['GKQX-001'], 'item_type': 'DEVICE', 'quantity': 1, 'remark': '骨科基础手术器械'},
            {'template': template1, 'supply': supplies['ZSQ-001'], 'item_type': 'REQUIRED', 'quantity': 5, 'remark': '麻醉用药'},
            {'template': template1, 'supply': supplies['LZZ-001'], 'item_type': 'REQUIRED', 'quantity': 2, 'remark': '静脉通路'},
            {'template': template2, 'supply': supplies['SSY-001'], 'item_type': 'REQUIRED', 'quantity': 3, 'remark': ''},
            {'template': template2, 'supply': supplies['ST-001'], 'item_type': 'REQUIRED', 'quantity': 4, 'remark': ''},
            {'template': template2, 'supply': supplies['SB-001'], 'item_type': 'REQUIRED', 'quantity': 5, 'remark': ''},
            {'template': template2, 'supply': supplies['FH-001'], 'item_type': 'REQUIRED', 'quantity': 1, 'remark': ''},
            {'template': template2, 'supply': supplies['FBQX-001'], 'item_type': 'DEVICE', 'quantity': 1, 'remark': '腹部手术器械'},
            {'template': template2, 'supply': supplies['ZSQ-001'], 'item_type': 'REQUIRED', 'quantity': 3, 'remark': ''},
            {'template': template3, 'supply': supplies['SSY-001'], 'item_type': 'REQUIRED', 'quantity': 4, 'remark': ''},
            {'template': template3, 'supply': supplies['ST-001'], 'item_type': 'REQUIRED', 'quantity': 6, 'remark': ''},
            {'template': template3, 'supply': supplies['SB-001'], 'item_type': 'REQUIRED', 'quantity': 8, 'remark': ''},
            {'template': template3, 'supply': supplies['XZJ-001'], 'item_type': 'HIGH_VALUE', 'quantity': 1, 'remark': '药物洗脱支架'},
            {'template': template3, 'supply': supplies['ZSQ-001'], 'item_type': 'REQUIRED', 'quantity': 10, 'remark': '造影剂注射'},
            {'template': template3, 'supply': supplies['LZZ-001'], 'item_type': 'REQUIRED', 'quantity': 3, 'remark': ''},
        ]

        for item in template_items:
            TemplateSupplyItem.objects.get_or_create(
                template=item['template'],
                supply=item['supply'],
                defaults=item
            )

        schedule1, _ = OperationSchedule.objects.get_or_create(
            patient_id='P20240001',
            operation_date=today,
            defaults={
                'operation_room': '手术室1',
                'patient_name': '张三',
                'template': template1,
                'surgeon': '李医生',
                'anesthetist': '王医生',
                'nurse': nurse1,
                'status': 'READY',
                'schedule_time': '08:00:00',
            }
        )

        PreparedItem.objects.filter(schedule=schedule1).delete()
        prepared_items_data = [
            {'schedule': schedule1, 'supply': supplies['SSY-001'], 'batch': Batch.objects.get(batch_number='SY20240001'), 'quantity': 4, 'item_type': 'REQUIRED', 'prepared_by': nurse1, 'status': 'VERIFIED', 'verified_by': nurse2},
            {'schedule': schedule1, 'supply': supplies['ST-001'], 'batch': Batch.objects.get(batch_number='ST20240001'), 'quantity': 6, 'item_type': 'REQUIRED', 'prepared_by': nurse1, 'status': 'VERIFIED', 'verified_by': nurse2},
            {'schedule': schedule1, 'supply': supplies['SB-001'], 'batch': Batch.objects.get(batch_number='SB20240001'), 'quantity': 10, 'item_type': 'REQUIRED', 'prepared_by': nurse1, 'status': 'VERIFIED', 'verified_by': nurse2},
            {'schedule': schedule1, 'supply': supplies['FH-001'], 'batch': Batch.objects.get(batch_number='FH20240001'), 'quantity': 2, 'item_type': 'REQUIRED', 'prepared_by': nurse1, 'status': 'VERIFIED', 'verified_by': nurse2},
            {'schedule': schedule1, 'supply': supplies['RGK-001'], 'batch': Batch.objects.get(batch_number='RGK20240001'), 'quantity': 1, 'item_type': 'HIGH_VALUE', 'prepared_by': nurse1, 'status': 'VERIFIED', 'verified_by': nurse2},
            {'schedule': schedule1, 'supply': supplies['GKQX-001'], 'batch': Batch.objects.get(batch_number='GKQX2024001'), 'quantity': 1, 'item_type': 'DEVICE', 'prepared_by': nurse1, 'status': 'VERIFIED', 'verified_by': nurse2, 'storage_location': 'C-01-01'},
            {'schedule': schedule1, 'supply': supplies['ZSQ-001'], 'batch': Batch.objects.get(batch_number='ZSQ20240001'), 'quantity': 5, 'item_type': 'REQUIRED', 'prepared_by': nurse1, 'status': 'VERIFIED', 'verified_by': nurse2},
            {'schedule': schedule1, 'supply': supplies['LZZ-001'], 'batch': Batch.objects.get(batch_number='LZZ20240001'), 'quantity': 2, 'item_type': 'REQUIRED', 'prepared_by': nurse1, 'status': 'VERIFIED', 'verified_by': nurse2},
        ]
        for data in prepared_items_data:
            PreparedItem.objects.create(**data)

        schedule2, _ = OperationSchedule.objects.get_or_create(
            patient_id='P20240002',
            operation_date=today,
            defaults={
                'operation_room': '手术室2',
                'patient_name': '李四',
                'template': template1,
                'original_template': template2,
                'surgeon': '赵医生',
                'anesthetist': '钱医生',
                'nurse': nurse1,
                'status': 'CHANGED',
                'schedule_time': '10:00:00',
            }
        )
        PreparedItem.objects.filter(schedule=schedule2).delete()
        prepared_items_data2 = [
            {'schedule': schedule2, 'supply': supplies['SSY-001'], 'batch': Batch.objects.get(batch_number='SY20240001'), 'quantity': 4, 'item_type': 'REQUIRED', 'prepared_by': nurse1, 'status': 'PREPARED'},
            {'schedule': schedule2, 'supply': supplies['ST-001'], 'batch': Batch.objects.get(batch_number='ST20240001'), 'quantity': 6, 'item_type': 'REQUIRED', 'prepared_by': nurse1, 'status': 'PREPARED'},
            {'schedule': schedule2, 'supply': supplies['FBQX-001'], 'batch': Batch.objects.get(batch_number='FBQX2024001'), 'quantity': 1, 'item_type': 'DEVICE', 'prepared_by': nurse1, 'status': 'PREPARED'},
            {'schedule': schedule2, 'supply': supplies['ZSQ-001'], 'batch': Batch.objects.get(batch_number='ZSQ20240001'), 'quantity': 3, 'item_type': 'REQUIRED', 'prepared_by': nurse1, 'status': 'PREPARED'},
        ]
        for data in prepared_items_data2:
            PreparedItem.objects.create(**data)

        schedule3, _ = OperationSchedule.objects.get_or_create(
            patient_id='P20240003',
            operation_date=today,
            defaults={
                'operation_room': '手术室3',
                'patient_name': '王五',
                'template': template2,
                'surgeon': '孙医生',
                'anesthetist': '周医生',
                'nurse': nurse2,
                'status': 'COMPLETED',
                'schedule_time': '09:00:00',
                'start_time': timezone.now() - timedelta(hours=2),
                'end_time': timezone.now() - timedelta(minutes=30),
            }
        )
        PreparedItem.objects.filter(schedule=schedule3).delete()
        p_item1 = PreparedItem.objects.create(
            schedule=schedule3, supply=supplies['SSY-001'],
            batch=Batch.objects.get(batch_number='SY20240002'),
            quantity=3, item_type='REQUIRED', prepared_by=nurse2, status='USED'
        )
        p_item2 = PreparedItem.objects.create(
            schedule=schedule3, supply=supplies['ST-001'],
            batch=Batch.objects.get(batch_number='ST20240001'),
            quantity=4, item_type='REQUIRED', prepared_by=nurse2, status='USED'
        )
        p_item3 = PreparedItem.objects.create(
            schedule=schedule3, supply=supplies['SB-001'],
            batch=Batch.objects.get(batch_number='SB20240001'),
            quantity=5, item_type='REQUIRED', prepared_by=nurse2, status='USED'
        )
        p_item4 = PreparedItem.objects.create(
            schedule=schedule3, supply=supplies['FH-001'],
            batch=Batch.objects.get(batch_number='FH20240001'),
            quantity=1, item_type='REQUIRED', prepared_by=nurse2, status='USED'
        )
        p_item5 = PreparedItem.objects.create(
            schedule=schedule3, supply=supplies['FBQX-001'],
            batch=Batch.objects.get(batch_number='FBQX2024001'),
            quantity=1, item_type='DEVICE', prepared_by=nurse2, status='USED'
        )
        p_item6 = PreparedItem.objects.create(
            schedule=schedule3, supply=supplies['ZSQ-001'],
            batch=Batch.objects.get(batch_number='ZSQ20240001'),
            quantity=3, item_type='REQUIRED', prepared_by=nurse2, status='USED'
        )

        UsageRecord.objects.create(
            schedule=schedule3, prepared_item=p_item5, supply=supplies['FBQX-001'],
            batch=Batch.objects.get(batch_number='FBQX2024001'), quantity=1,
            is_high_value=False, used_by=nurse2,
            is_double_confirmed=True, confirmed_by=nurse1
        )

        ReturnRecord.objects.create(
            schedule=schedule3, supply=supplies['SSY-001'],
            batch=Batch.objects.get(batch_number='SY20240002'), quantity=1,
            return_status='UNOPENED', is_high_value=False,
            returned_by=nurse2, is_double_confirmed=True, confirmed_by=nurse1,
            remark='多备了1件未使用'
        )
        ReturnRecord.objects.create(
            schedule=schedule3, supply=supplies['SB-001'],
            batch=Batch.objects.get(batch_number='SB20240001'), quantity=2,
            return_status='OPENED', is_high_value=False,
            returned_by=nurse2, is_double_confirmed=False,
            remark='拆封未使用，2包'
        )

        schedule4, _ = OperationSchedule.objects.get_or_create(
            patient_id='P20240004',
            operation_date=today - timedelta(days=1),
            defaults={
                'operation_room': '手术室1',
                'patient_name': '赵六',
                'template': template1,
                'surgeon': '李医生',
                'anesthetist': '王医生',
                'nurse': nurse1,
                'status': 'COMPLETED',
                'schedule_time': '14:00:00',
                'start_time': timezone.now() - timedelta(days=1, hours=2),
                'end_time': timezone.now() - timedelta(days=1),
            }
        )

        hv_item = PreparedItem.objects.create(
            schedule=schedule4, supply=supplies['RGK-001'],
            batch=Batch.objects.get(batch_number='RGK20240001'),
            quantity=1, item_type='HIGH_VALUE', prepared_by=nurse1, status='USED'
        )

        usage_record = UsageRecord.objects.create(
            schedule=schedule4, prepared_item=hv_item, supply=supplies['RGK-001'],
            batch=Batch.objects.get(batch_number='RGK20240001'), quantity=1,
            is_high_value=True, is_scan_created=True, used_by=nurse1,
            is_double_confirmed=True, confirmed_by=nurse2
        )

        HighValueAudit.objects.create(
            schedule=schedule4, supply=supplies['RGK-001'],
            batch=Batch.objects.get(batch_number='RGK20240001'),
            quantity=1, action_type='USED', operator=nurse1,
            is_audited=True, auditor=admin_user
        )

        schedule5, _ = OperationSchedule.objects.get_or_create(
            patient_id='P20240005',
            operation_date=today + timedelta(days=1),
            defaults={
                'operation_room': '手术室2',
                'patient_name': '钱七',
                'template': template3,
                'surgeon': '吴医生',
                'anesthetist': '郑医生',
                'nurse': nurse2,
                'status': 'SCHEDULED',
                'schedule_time': '08:30:00',
            }
        )

        schedule6, _ = OperationSchedule.objects.get_or_create(
            patient_id='P20240006',
            operation_date=today + timedelta(days=2),
            defaults={
                'operation_room': '手术室3',
                'patient_name': '孙八',
                'template': template1,
                'surgeon': '李医生',
                'anesthetist': '王医生',
                'nurse': nurse1,
                'status': 'SCHEDULED',
                'schedule_time': '10:00:00',
            }
        )

        self.stdout.write(self.style.SUCCESS('测试数据初始化完成！'))
        self.stdout.write(f'管理员账号: admin / admin123456')
        self.stdout.write(f'护士账号: nurse1 / nurse123456, nurse2 / nurse123456')
        self.stdout.write('')
        self.stdout.write('=== 三类验收数据 ===')
        self.stdout.write('1. 换术式数据: 患者李四(P20240002) 已从阑尾切除术更换为髋关节置换术')
        self.stdout.write('2. 退包数据: 患者王五(P20240003) 术后退包，包含未拆封和已拆封物品')
        self.stdout.write('3. 批号过期数据: 缝合线(FH20230001)和人工髋关节(RGK20230001)批号已过期')
        self.stdout.write('')
        self.stdout.write('其他测试数据:')
        self.stdout.write(f'- 术式模板: {SurgicalTemplate.objects.count()} 个')
        self.stdout.write(f'- 耗材信息: {Supply.objects.count()} 个')
        self.stdout.write(f'- 批号库存: {Batch.objects.count()} 个')
        self.stdout.write(f'- 手术排班: {OperationSchedule.objects.count()} 台')
