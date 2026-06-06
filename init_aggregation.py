import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tea_loss_dashboard.settings')
django.setup()

from datetime import datetime, timedelta
from organization.models import Store
from operations.models import Wastage, Stocktake, MaterialUse
from analytics.models import LossAggregation
from django.db.models import Sum


stores = Store.objects.filter(is_active=True)
start_date = (datetime.now() - timedelta(days=7)).date()
end_date = datetime.now().date()

print(f'正在生成预聚合数据 {start_date} ~ {end_date}...')
count = 0

current = start_date
while current <= end_date:
    for store in stores:
        for includes_trial in [True, False]:
            try:
                wastage_qs = Wastage.objects.filter(store=store, record_date=current)
                if not includes_trial:
                    wastage_qs = wastage_qs.filter(material__is_trial=False)
                
                stocktake_qs = Stocktake.objects.filter(store=store, record_date=current)
                if not includes_trial:
                    stocktake_qs = stocktake_qs.filter(material__is_trial=False)
                
                use_qs = MaterialUse.objects.filter(store=store, record_date=current)
                if not includes_trial:
                    use_qs = use_qs.filter(material__is_trial=False)
                
                use_total = 0.0
                for mu in use_qs.select_related('material'):
                    use_total += float(mu.quantity) * float(mu.material.unit_price)
                
                loss_sum = wastage_qs.aggregate(Sum('total_amount'))['total_amount__sum'] or 0
                diff_sum = stocktake_qs.aggregate(Sum('diff_amount'))['diff_amount__sum'] or 0
                total_loss = float(loss_sum) + abs(float(diff_sum))
                total_use = use_total if use_total > 0 else 5000.0
                loss_rate = (total_loss / total_use * 100) if total_use > 0 else 0
                
                agg = LossAggregation()
                agg.store = store
                agg.period_date = current
                agg.period_type = 'day'
                agg.shift = 'all'
                agg.includes_trial = includes_trial
                agg.material = None
                agg.loss_amount = round(total_loss, 2)
                agg.total_use = round(total_use, 2)
                agg.loss_rate = round(loss_rate, 4)
                agg.save()
                count += 1
            except Exception as e:
                print(f'  跳过 {store.name} {current}: {e}')
    current += timedelta(days=1)
    print(f'  已处理至 {current}，共 {count} 条...')

print(f'✅ 共生成 {count} 条预聚合数据')
print(f'总数: {LossAggregation.objects.count()} 条')
