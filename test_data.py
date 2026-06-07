from datetime import datetime, timedelta
from data.cleaning.mock_data_generator import data_store
from data.api.routes.queries import get_backlog_trend, get_funnel_data, get_workload_data, get_appeal_reversal_data, get_summary_data

time_end = datetime.now()
time_start = time_end - timedelta(hours=24)

print('=== 测试数据生成 ===')
review_logs = data_store.get_review_logs()
print(f'审核日志: {len(review_logs)} 条')
appeal_logs = data_store.get_appeal_logs()
print(f'申诉日志: {len(appeal_logs)} 条')
print(f'列名: {list(review_logs.columns)}')

print()
print('=== 测试摘要数据 ===')
summary = get_summary_data(time_start, time_end)
print(f'总积压: {summary["total_backlog"]}')
print(f'SLA违规率: {summary["sla_breach_rate"]}%')
print(f'告警数: {len(summary["alerts"])}')

print()
print('=== 测试积压曲线 ===')
backlog = get_backlog_trend(time_start, time_end, '1h')
print(f'数据点: {len(backlog)}')
if not backlog.empty:
    print(f'列: {list(backlog.columns)}')
    print(backlog.head())

print()
print('=== 测试漏斗数据 ===')
funnel = get_funnel_data(time_start, time_end)
print(funnel)

print()
print('=== 测试负载数据 ===')
workload = get_workload_data(time_start, time_end)
print(f'审核员记录: {len(workload)}')
if not workload.empty:
    print(workload.head())

print()
print('=== 测试申诉逆转数据 ===')
appeal = get_appeal_reversal_data(time_start, time_end)
print(appeal)

print()
print('✅ 所有数据层测试通过!')
