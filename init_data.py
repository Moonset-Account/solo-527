import os
import django
import random
from datetime import datetime, timedelta
from decimal import Decimal

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tea_loss_dashboard.settings')
django.setup()

from django.contrib.auth.models import User
from organization.models import Region, Store
from materials.models import MaterialCategory, Material, TrialProduct
from operations.models import Wastage, Stocktake, Inventory, MaterialUse, Sale
from accounts.models import Role, UserProfile, Staff, StaffShift

def init_data():
    print('开始初始化数据...')

    print('创建角色...')
    Role.objects.get_or_create(name='store_manager', defaults={'description': '门店店长'})
    Role.objects.get_or_create(name='region_operator', defaults={'description': '区域运营'})
    Role.objects.get_or_create(name='admin', defaults={'description': '总部管理员'})
    admin_role = Role.objects.get(name='admin')
    store_manager_role = Role.objects.get(name='store_manager')

    print('创建超级用户...')
    if not User.objects.filter(username='admin').exists():
        admin_user = User.objects.create_superuser(
            username='admin',
            email='admin@example.com',
            password='admin123'
        )
        UserProfile.objects.create(
            user=admin_user,
            role=admin_role
        )
        print('创建管理员账号: admin / admin123')

    if not User.objects.filter(username='manager1').exists():
        manager_user = User.objects.create_user(
            username='manager1',
            email='manager1@example.com',
            password='manager123'
        )
        UserProfile.objects.create(
            user=manager_user,
            role=store_manager_role
        )
        print('创建店长账号: manager1 / manager123')

    print('创建区域和门店...')
    region1, _ = Region.objects.get_or_create(
        code='SH',
        defaults={'name': '上海区域'}
    )
    region2, _ = Region.objects.get_or_create(
        code='BJ',
        defaults={'name': '北京区域'}
    )

    stores_data = [
        {'code': 'SH001', 'name': '南京西路店', 'region': region1, 'address': '上海市静安区南京西路123号'},
        {'code': 'SH002', 'name': '人民广场店', 'region': region1, 'address': '上海市黄浦区人民大道100号'},
        {'code': 'SH003', 'name': '陆家嘴店', 'region': region1, 'address': '上海市浦东新区陆家嘴环路88号'},
        {'code': 'SH004', 'name': '徐家汇店', 'region': region1, 'address': '上海市徐汇区虹桥路1号'},
        {'code': 'SH005', 'name': '静安寺店', 'region': region1, 'address': '上海市静安区华山路100号'},
        {'code': 'BJ001', 'name': '王府井店', 'region': region2, 'address': '北京市东城区王府井大街200号'},
        {'code': 'BJ002', 'name': '三里屯店', 'region': region2, 'address': '北京市朝阳区三里屯路19号'},
        {'code': 'BJ003', 'name': '国贸店', 'region': region2, 'address': '北京市朝阳区建国门外大街1号'},
    ]

    stores = []
    for s_data in stores_data:
        store, _ = Store.objects.get_or_create(code=s_data['code'], defaults=s_data)
        stores.append(store)

    if User.objects.filter(username='manager1').exists():
        profile = User.objects.get(username='manager1').profile
        profile.store = stores[0]
        profile.save()

    print('创建原料分类...')
    categories_data = [
        {'name': '茶叶', 'sort_order': 1},
        {'name': '奶制品', 'sort_order': 2},
        {'name': '水果', 'sort_order': 3},
        {'name': '糖浆', 'sort_order': 4},
        {'name': '小料', 'sort_order': 5},
        {'name': '包装', 'sort_order': 6},
    ]

    categories = []
    for c_data in categories_data:
        cat, _ = MaterialCategory.objects.get_or_create(name=c_data['name'], defaults=c_data)
        categories.append(cat)

    print('创建原料...')
    materials_data = [
        {'code': 'TEA001', 'name': '茉莉绿茶', 'category': categories[0], 'unit': 'kg', 'unit_price': 85.00, 'is_trial': False},
        {'code': 'TEA002', 'name': '乌龙茶', 'category': categories[0], 'unit': 'kg', 'unit_price': 95.00, 'is_trial': False},
        {'code': 'TEA003', 'name': '红茶', 'category': categories[0], 'unit': 'kg', 'unit_price': 75.00, 'is_trial': False},
        {'code': 'MILK001', 'name': '鲜牛奶', 'category': categories[1], 'unit': 'L', 'unit_price': 12.50, 'is_trial': False},
        {'code': 'MILK002', 'name': '淡奶油', 'category': categories[1], 'unit': 'L', 'unit_price': 45.00, 'is_trial': False},
        {'code': 'FRUIT001', 'name': '芒果', 'category': categories[2], 'unit': 'kg', 'unit_price': 18.00, 'is_trial': False},
        {'code': 'FRUIT002', 'name': '草莓', 'category': categories[2], 'unit': 'kg', 'unit_price': 35.00, 'is_trial': False},
        {'code': 'FRUIT003', 'name': '西柚', 'category': categories[2], 'unit': 'kg', 'unit_price': 22.00, 'is_trial': False},
        {'code': 'SYRUP001', 'name': '白砂糖', 'category': categories[3], 'unit': 'kg', 'unit_price': 8.50, 'is_trial': False},
        {'code': 'SYRUP002', 'name': '蜂蜜', 'category': categories[3], 'unit': 'kg', 'unit_price': 42.00, 'is_trial': False},
        {'code': 'TOP001', 'name': '珍珠', 'category': categories[4], 'unit': 'kg', 'unit_price': 15.00, 'is_trial': False},
        {'code': 'TOP002', 'name': '椰果', 'category': categories[4], 'unit': 'kg', 'unit_price': 12.00, 'is_trial': False},
        {'code': 'TOP003', 'name': '芋圆', 'category': categories[4], 'unit': 'kg', 'unit_price': 18.00, 'is_trial': False},
        {'code': 'PACK001', 'name': '奶茶杯-L', 'category': categories[5], 'unit': '个', 'unit_price': 0.80, 'is_trial': False},
        {'code': 'PACK002', 'name': '吸管', 'category': categories[5], 'unit': '根', 'unit_price': 0.10, 'is_trial': False},
        {'code': 'TEA004', 'name': '新品杨枝甘露茶底', 'category': categories[0], 'unit': 'kg', 'unit_price': 120.00, 'is_trial': True},
        {'code': 'FRUIT004', 'name': '新品草莓果粒', 'category': categories[2], 'unit': 'kg', 'unit_price': 55.00, 'is_trial': True},
    ]

    materials = []
    for m_data in materials_data:
        mat, _ = Material.objects.get_or_create(code=m_data['code'], defaults=m_data)
        materials.append(mat)

    print('创建试营原料配置...')
    trial_materials = [m for m in materials if m.is_trial]
    for idx, mat in enumerate(trial_materials):
        TrialProduct.objects.get_or_create(
            material=mat,
            defaults={
                'start_date': datetime.now().date() - timedelta(days=15),
                'end_date': datetime.now().date() + timedelta(days=15),
                'store_ids': [s.id for s in stores[:5]] if idx == 0 else [s.id for s in stores[5:]],
                'remark': '新品试营期间'
            }
        )

    print('创建员工和班次...')
    staff_names = ['张三', '李四', '王五', '赵六', '陈七', '刘八']
    for store in stores[:3]:
        for name in staff_names[:3]:
            staff, _ = Staff.objects.get_or_create(
                name=f'{name}_{store.code}',
                defaults={
                    'store': store,
                    'position': '调饮师',
                    'phone': f'138{random.randint(10000000, 99999999)}'
                }
            )
            for i in range(7):
                shift_date = datetime.now().date() - timedelta(days=i)
                shift_type = random.choice(['morning', 'afternoon', 'evening'])
                StaffShift.objects.get_or_create(
                    staff=staff,
                    shift_date=shift_date,
                    defaults={
                        'store': store,
                        'shift_type': shift_type,
                        'start_time': '09:00' if shift_type == 'morning' else '14:00' if shift_type == 'afternoon' else '18:00',
                        'end_time': '14:00' if shift_type == 'morning' else '18:00' if shift_type == 'afternoon' else '22:00'
                    }
                )

    print('创建报损和盘点数据...')
    shifts = ['morning', 'afternoon', 'evening', 'all']
    reasons = ['expired', 'damaged', 'spoilage', 'operation', 'other']

    for store in stores:
        for day in range(30):
            record_date = datetime.now().date() - timedelta(days=day)
            
            daily_materials = random.sample(materials, k=random.randint(3, 8))
            
            for mat in daily_materials:
                if random.random() < 0.6:
                    qty = Decimal(str(round(random.uniform(0.5, 5.0), 2)))
                    amount = qty * Decimal(str(mat.unit_price))
                    shift = random.choice(shifts)
                    Wastage.objects.get_or_create(
                        store=store,
                        material=mat,
                        record_date=record_date,
                        shift=shift,
                        defaults={
                            'quantity': qty,
                            'unit_price': mat.unit_price,
                            'total_amount': amount,
                            'reason': random.choice(reasons)
                        }
                    )

            for mat in random.sample(materials, k=random.randint(2, 5)):
                if random.random() < 0.5:
                    sys_qty = Decimal(str(round(random.uniform(10, 50), 2)))
                    actual_qty = sys_qty - Decimal(str(round(random.uniform(0.5, 3.0), 2)))
                    diff_qty = sys_qty - actual_qty
                    diff_amount = diff_qty * Decimal(str(mat.unit_price))
                    Stocktake.objects.get_or_create(
                        store=store,
                        material=mat,
                        record_date=record_date,
                        defaults={
                            'system_quantity': sys_qty,
                            'actual_quantity': actual_qty,
                            'diff_quantity': diff_qty,
                            'diff_amount': diff_amount,
                            'shift': random.choice(shifts)
                        }
                    )

            for mat in random.sample(materials, k=random.randint(3, 6)):
                if random.random() < 0.8:
                    qty = Decimal(str(round(random.uniform(5, 30), 2)))
                    MaterialUse.objects.get_or_create(
                        store=store,
                        material=mat,
                        record_date=record_date,
                        shift=random.choice(shifts),
                        defaults={
                            'quantity': qty
                        }
                    )

            for mat in random.sample(materials, k=random.randint(2, 4)):
                if random.random() < 0.5:
                    qty = Decimal(str(round(random.uniform(20, 100), 2)))
                    amount = qty * Decimal(str(mat.unit_price))
                    Inventory.objects.get_or_create(
                        store=store,
                        material=mat,
                        record_date=record_date,
                        defaults={
                            'quantity': qty,
                            'unit_price': mat.unit_price,
                            'total_amount': amount,
                            'batch_no': f'BATCH{random.randint(1000, 9999)}'
                        }
                    )

            products = ['经典奶茶', '水果茶', '芝士奶盖', '杨枝甘露', '草莓啵啵']
            for _ in range(random.randint(3, 8)):
                product = random.choice(products)
                mat = random.choice(materials)
                qty = Decimal(str(round(random.uniform(10, 100), 0)))
                consume = qty * Decimal(str(round(random.uniform(0.05, 0.2), 3)))
                Sale.objects.get_or_create(
                    store=store,
                    product_name=product,
                    material=mat,
                    sale_date=record_date,
                    defaults={
                        'quantity': qty,
                        'material_consume': consume,
                        'sale_amount': qty * Decimal(str(random.uniform(15, 30))),
                        'shift': random.choice(shifts)
                    }
                )

    print('数据初始化完成！')
    print(f'  - 创建了 {Region.objects.count()} 个区域')
    print(f'  - 创建了 {Store.objects.count()} 家门店')
    print(f'  - 创建了 {Material.objects.count()} 种原料')
    print(f'  - 创建了 {Wastage.objects.count()} 条报损记录')
    print(f'  - 创建了 {Stocktake.objects.count()} 条盘点记录')

if __name__ == '__main__':
    init_data()
