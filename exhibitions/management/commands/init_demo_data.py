from django.core.management.base import BaseCommand
from datetime import date, timedelta
from django.utils import timezone
from django.contrib.auth import get_user_model

from users.models import Role
from inventory.models import MaterialCategory, Material, Warehouse, InventoryItem
from exhibitions.models import ExhibitionHall, Exhibition, BorrowOrder, BorrowItem

User = get_user_model()


class Command(BaseCommand):
    help = '初始化演示数据'

    def handle(self, *args, **options):
        self.stdout.write('开始创建演示数据...')

        self.stdout.write('1. 创建物料类别...')
        cat1, _ = MaterialCategory.objects.get_or_create(name='展柜类', code='DC')
        cat2, _ = MaterialCategory.objects.get_or_create(name='灯具类', code='LT')
        cat3, _ = MaterialCategory.objects.get_or_create(name='运输箱', code='TB')

        self.stdout.write('2. 创建物料...')
        materials_data = [
            ('独立展柜', 'DC001', Material.DISPLAY_CASE, cat1, '120*60*100cm', True, True),
            ('墙柜', 'DC002', Material.DISPLAY_CASE, cat1, '200*100*30cm', False, False),
            ('桌面展柜', 'DC003', Material.DISPLAY_CASE, cat1, '80*60*40cm', False, False),
            ('轨道射灯', 'LT001', Material.LIGHTING, cat2, '30W LED', False, False),
            ('重点照明灯', 'LT002', Material.LIGHTING, cat2, '50W LED', True, True),
            ('洗墙灯', 'LT003', Material.LIGHTING, cat2, '20W LED', False, False),
            ('标准运输箱', 'TB001', Material.TRANSPORT_BOX, cat3, '120*80*60cm', False, False),
            ('大型运输箱', 'TB002', Material.TRANSPORT_BOX, cat3, '200*120*80cm', False, False),
            ('防震运输箱', 'TB003', Material.TRANSPORT_BOX, cat3, '100*80*60cm', True, True),
        ]

        materials = []
        for name, code, mtype, cat, spec, valuable, double_confirm in materials_data:
            mat, _ = Material.objects.get_or_create(
                code=code,
                defaults={
                    'name': name,
                    'type': mtype,
                    'category': cat,
                    'specification': spec,
                    'is_valuable': valuable,
                    'requires_double_confirm': double_confirm,
                }
            )
            materials.append(mat)
            self.stdout.write(f'  - {name}')

        self.stdout.write('3. 创建仓库...')
        warehouse, _ = Warehouse.objects.get_or_create(
            code='WH001',
            defaults={'name': '主仓库', 'location': '地下一层'}
        )

        self.stdout.write('4. 创建库存...')
        for mat in materials:
            qty = 5 if mat.is_valuable else 10
            for i in range(qty):
                InventoryItem.objects.get_or_create(
                    serial_number=f'{mat.code}-{i+1:03d}',
                    defaults={
                        'material': mat,
                        'warehouse': warehouse,
                        'status': InventoryItem.AVAILABLE,
                        'location_detail': f'A区-{i+1:02d}号货架',
                    }
                )
            self.stdout.write(f'  - {mat.name}: {qty} 件')

        self.stdout.write('5. 创建展厅...')
        halls_data = [
            ('H001', '一号展厅', '1F', 500),
            ('H002', '二号展厅', '1F', 400),
            ('H003', '三号展厅', '2F', 600),
            ('H004', '四号展厅', '2F', 350),
        ]
        halls = []
        for code, name, floor, area in halls_data:
            hall, _ = ExhibitionHall.objects.get_or_create(
                code=code,
                defaults={'name': name, 'floor': floor, 'area': area}
            )
            halls.append(hall)
            self.stdout.write(f'  - {name}')

        self.stdout.write('6. 创建展览...')
        curator = User.objects.filter(role__name=Role.CURATOR).first()
        today = timezone.now().date()

        exhibitions_data = [
            ('古埃及文明展', 'EX001', halls[0], Exhibition.OPEN, today - timedelta(days=15), today + timedelta(days=45)),
            ('当代艺术展', 'EX002', halls[1], Exhibition.INSTALLATION, today, today + timedelta(days=60)),
            ('青铜器精品展', 'EX003', halls[2], Exhibition.PLANNING, today + timedelta(days=10), today + timedelta(days=90)),
        ]

        for name, code, hall, status, start, end in exhibitions_data:
            exhibition, created = Exhibition.objects.get_or_create(
                code=code,
                defaults={
                    'name': name,
                    'hall': hall,
                    'curator': curator,
                    'status': status,
                    'start_date': start,
                    'end_date': end,
                    'installation_start': start - timedelta(days=7) if status != Exhibition.DRAFT else None,
                    'opening_date': start if status == Exhibition.OPEN else None,
                    'created_by': curator,
                    'description': f'这是{name}的展览描述',
                }
            )
            self.stdout.write(f'  - {name} ({exhibition.get_status_display_name()})')

            if created and status != Exhibition.DRAFT:
                self.stdout.write(f'    创建借用单...')
                order = BorrowOrder.objects.create(
                    order_no=f'BO{code}',
                    exhibition=exhibition,
                    hall=hall,
                    requester=curator,
                    status=BorrowOrder.APPROVED if status in [Exhibition.INSTALLATION, Exhibition.OPEN] else BorrowOrder.DRAFT,
                    expected_pickup_date=start - timedelta(days=5),
                    expected_return_date=end + timedelta(days=3),
                    remarks='初始布展物料',
                )

                for i, mat in enumerate(materials[:4]):
                    BorrowItem.objects.create(
                        borrow_order=order,
                        material=mat,
                        quantity=2 if i == 0 else 5,
                        status=BorrowItem.PICKED_UP if status in [Exhibition.INSTALLATION, Exhibition.OPEN] else BorrowItem.PENDING,
                        picked_up_quantity=2 if i == 0 and status in [Exhibition.INSTALLATION, Exhibition.OPEN] else 0,
                    )

        self.stdout.write(self.style.SUCCESS('演示数据创建完成!'))
