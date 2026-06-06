import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tea_loss_dashboard.settings')
django.setup()

import pandas as pd
from organization.models import Store
from materials.models import Material
from datetime import datetime, timedelta
import os
from django.conf import settings

sample_dir = os.path.join(settings.MEDIA_ROOT, 'sample_imports')
os.makedirs(sample_dir, exist_ok=True)

stores = list(Store.objects.filter(is_active=True)[:3])
materials = list(Material.objects.all()[:5])

# 1. 报损数据示例
wastage_data = []
for i in range(5):
    store = stores[i % len(stores)]
    material = materials[i % len(materials)]
    wastage_data.append({
        '门店编码': store.code,
        '原料编码': material.code,
        '日期': (datetime.now() - timedelta(days=i)).strftime('%Y-%m-%d'),
        '数量': round(2.5 + i, 2),
        '单价': float(material.unit_price),
        '原因': ['过期', '损坏', '操作失误', '变质', '其他'][i],
        '班次': ['早班', '中班', '晚班', '全天', '早班'][i]
    })
df = pd.DataFrame(wastage_data)
df.to_excel(os.path.join(sample_dir, '报损数据示例.xlsx'), index=False)
print('✅ 报损数据示例已生成')

# 2. 盘点数据示例
stocktake_data = []
for i in range(5):
    store = stores[i % len(stores)]
    material = materials[i % len(materials)]
    sys_qty = 100 + i * 10
    actual_qty = sys_qty - (i + 1) * 2
    stocktake_data.append({
        '门店编码': store.code,
        '原料编码': material.code,
        '日期': (datetime.now() - timedelta(days=i)).strftime('%Y-%m-%d'),
        '系统库存': sys_qty,
        '实际库存': actual_qty,
        '单价': float(material.unit_price),
        '班次': ['早班', '中班', '晚班', '全天', '早班'][i]
    })
df = pd.DataFrame(stocktake_data)
df.to_excel(os.path.join(sample_dir, '盘点数据示例.xlsx'), index=False)
print('✅ 盘点数据示例已生成')

# 3. 进货数据示例
inventory_data = []
for i in range(5):
    store = stores[i % len(stores)]
    material = materials[i % len(materials)]
    inventory_data.append({
        '门店编码': store.code,
        '原料编码': material.code,
        '日期': (datetime.now() - timedelta(days=i)).strftime('%Y-%m-%d'),
        '数量': round(50 + i * 10, 2),
        '单价': float(material.unit_price),
        '批次号': f'BATCH{20260600 + i}'
    })
df = pd.DataFrame(inventory_data)
df.to_excel(os.path.join(sample_dir, '进货数据示例.xlsx'), index=False)
print('✅ 进货数据示例已生成')

# 4. 销量数据示例
sale_data = []
for i in range(5):
    store = stores[i % len(stores)]
    material = materials[i % len(materials)]
    sale_data.append({
        '门店编码': store.code,
        '产品名称': ['珍珠奶茶', '芋泥啵啵', '杨枝甘露', '伯牙绝弦', '茉莉雪芽'][i],
        '原料编码': material.code,
        '销售日期': (datetime.now() - timedelta(days=i)).strftime('%Y-%m-%d'),
        '销售数量': 100 + i * 20,
        '原料消耗': round(15 + i * 3, 2),
        '销售金额': round(1500 + i * 300, 2),
        '班次': ['早班', '中班', '晚班', '全天', '早班'][i]
    })
df = pd.DataFrame(sale_data)
df.to_excel(os.path.join(sample_dir, '销量数据示例.xlsx'), index=False)
print('✅ 销量数据示例已生成')

# 5. 员工班次示例
from accounts.models import Staff
staff_names = ['张三', '李四', '王五', '赵六', '钱七']
shift_data = []
for i in range(5):
    store = stores[i % len(stores)]
    shift_data.append({
        '门店编码': store.code,
        '员工姓名': staff_names[i],
        '班次类型': ['早班', '中班', '晚班', '全天', '早班'][i],
        '班次日期': (datetime.now() - timedelta(days=i)).strftime('%Y-%m-%d'),
        '开始时间': ['08:00', '12:00', '18:00', '09:00', '08:00'][i],
        '结束时间': ['16:00', '20:00', '24:00', '18:00', '16:00'][i]
    })
df = pd.DataFrame(shift_data)
df.to_excel(os.path.join(sample_dir, '员工班次示例.xlsx'), index=False)
print('✅ 员工班次示例已生成')

print(f'\n所有示例文件已生成到: {sample_dir}')
print('包含文件:')
for f in os.listdir(sample_dir):
    print(f'  - {f}')
