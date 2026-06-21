import os
os.environ['DJANGO_SETTINGS_MODULE'] = 'procurement_system.settings'
os.environ['USE_SQLITE'] = 'true'
import django
django.setup()

from contracts.models import FrameworkContract, ContractPrice, PriceHistory, ContractRenewal

target_numbers = [
    'HT-2026-E2E-001', 'HT-2026-E2E-002',
    'HT-2026-TEST02', 'HT-2026-TEST03',
    'HT-2027-E2E-RENEW', 'HT-2027-E2E-RENEW01', 'HT-2027-E2E-RENEW02',
]

contracts = FrameworkContract.objects.filter(contract_number__in=target_numbers)
print(f'找到待清理合同: {contracts.count()} 个')
for c in contracts:
    print(f'  - {c.contract_number} (id={c.id})')
    print(f'    价格行: {c.prices.count()}, 价格历史: {c.price_histories.count()}')
    PriceHistory.objects.filter(contract=c).delete()
    ContractPrice.objects.filter(contract=c).delete()
    ContractRenewal.objects.filter(original_contract=c).delete()
    ContractRenewal.objects.filter(new_contract=c).delete()

ids = list(contracts.values_list('id', flat=True))
deleted, _ = FrameworkContract.objects.filter(id__in=ids).delete()
print(f'删除合同: {deleted} 个')

orphan = PriceHistory.objects.filter(contract__isnull=True)
if orphan.exists():
    print(f'清理孤立价格历史: {orphan.count()} 条')
    orphan.delete()

orphan_prices = ContractPrice.objects.filter(contract__isnull=True)
if orphan_prices.exists():
    print(f'清理孤立价格行: {orphan_prices.count()} 条')
    orphan_prices.delete()

print()
print('=== 清理后状态 ===')
print(f'合同总数: {FrameworkContract.objects.count()}')
print(f'合同价格总数: {ContractPrice.objects.count()}')
print(f'价格历史总数: {PriceHistory.objects.count()}')
print(f'续签记录总数: {ContractRenewal.objects.count()}')
for c in FrameworkContract.objects.all():
    print(f'  {c.contract_number}: {c.prices.count()} 价格行, {c.price_histories.count()} 历史')
