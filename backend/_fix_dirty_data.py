import os
os.environ['DJANGO_SETTINGS_MODULE'] = 'procurement_system.settings'
os.environ['USE_SQLITE'] = 'true'
import django
django.setup()

from contracts.models import FrameworkContract, ContractPrice, PriceHistory
from consumables.models import ConsumableSpecification

spec_prices = {s.id: s.unit_price for s in ConsumableSpecification.objects.all()}
print("规格参考价:")
for s in ConsumableSpecification.objects.all():
    print(f"  id={s.id}: {s.name} - {s.specification} = ¥{s.unit_price}")

contract = FrameworkContract.objects.get(contract_number='HT-2025-002')
print(f"\n修复合同: {contract.contract_number}")

for cp in contract.prices.all():
    correct_price = spec_prices.get(cp.specification_id)
    if cp.unit_price != correct_price:
        print(f"  {cp.specification.name}: 当前¥{cp.unit_price} → 正确¥{correct_price}")
        old_price = cp.unit_price
        cp.unit_price = correct_price
        cp.save()
        for h in contract.price_histories.filter(specification=cp.specification):
            if h.unit_price == old_price:
                h.unit_price = correct_price
                h.change_reason = '合同签订（数据修正）'
                h.save()
                print(f"    修正历史记录: ¥{old_price} → ¥{correct_price}")

print("\n=== 修复后验证 ===")
for c in FrameworkContract.objects.all().order_by('contract_number'):
    print(f"\n{c.contract_number}:")
    for cp in c.prices.all():
        print(f"  ContractPrice: {cp.specification.name} = ¥{cp.unit_price}")
    for h in c.price_histories.all():
        print(f"  PriceHistory:  {h.specification.name} = ¥{h.unit_price} ({h.change_reason})")

print("\n=== 价格波动看板（规格1 A4复印纸）===")
from django.db.models import Avg, Min, Max
from django.db.models.functions import TruncMonth
data = PriceHistory.objects.filter(specification_id=1).annotate(
    month=TruncMonth('price_date')
).values('month').annotate(
    avg=Avg('unit_price'), min=Min('unit_price'), max=Max('unit_price')
).order_by('month')
for d in data:
    print(f"  {d['month']}: 均价¥{d['avg']:.2f}, 最低¥{d['min']:.2f}, 最高¥{d['max']:.2f}")

print("\n=== 价格波动看板（规格3 黑色硒鼓）===")
data = PriceHistory.objects.filter(specification_id=3).annotate(
    month=TruncMonth('price_date')
).values('month').annotate(
    avg=Avg('unit_price'), min=Min('unit_price'), max=Max('unit_price')
).order_by('month')
for d in data:
    print(f"  {d['month']}: 均价¥{d['avg']:.2f}, 最低¥{d['min']:.2f}, 最高¥{d['max']:.2f}")

print("\n=== 数据一致性检查 ===")
ok = True
for c in FrameworkContract.objects.all():
    for cp in c.prices.all():
        h = c.price_histories.filter(specification=cp.specification).order_by('-created_at').first()
        if h and h.unit_price != cp.unit_price:
            print(f"  ❌ {c.contract_number}/{cp.specification.name}: 现价¥{cp.unit_price} != 最新历史¥{h.unit_price}")
            ok = False
if ok:
    print("  ✅ 所有合同价格与价格历史一致")
