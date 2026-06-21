import os
os.environ['DJANGO_SETTINGS_MODULE'] = 'procurement_system.settings'
os.environ['USE_SQLITE'] = 'true'
import django
django.setup()

from contracts.models import FrameworkContract, ContractPrice, PriceHistory

contract = FrameworkContract.objects.get(contract_number='HT-2026-E2E-002')
print(f'合同: {contract.contract_number}')
print(f'  价格行数: {contract.prices.count()}')

print()
print('=== ContractPrice 列表 ===')
for p in contract.prices.all():
    print(f'  id={p.id}, spec={p.specification.name}, price={p.unit_price}, effective={p.effective_date}')

print()
print('=== PriceHistory 列表 ===')
for h in contract.price_histories.order_by('created_at'):
    print(f'  spec={h.specification.name}, price={h.unit_price}, date={h.price_date}, reason={h.change_reason}')

print()
print('=== 价格看板按月聚合（规格1：A4复印纸） ===')
from django.db.models import Avg, Min, Max
from django.db.models.functions import TruncMonth
data = PriceHistory.objects.filter(specification_id=1).annotate(
    month=TruncMonth('price_date')
).values('month').annotate(
    avg=Avg('unit_price'), min=Min('unit_price'), max=Max('unit_price')
).order_by('month')
for d in data:
    print(f'  {d["month"]}: avg={d["avg"]:.2f}, min={d["min"]:.2f}, max={d["max"]:.2f}')
