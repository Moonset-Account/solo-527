from datetime import datetime, timedelta
from data.cleaning.mock_data_generator import data_store

time_end = datetime.now()
time_start = time_end - timedelta(hours=24)

print('=== 直接测试 get_backlog_trend ===')
from data.api.routes.queries import get_backlog_trend

try:
    backlog = get_backlog_trend(time_start, time_end, '1h')
    print(f'成功! 数据点: {len(backlog)}')
    if not backlog.empty:
        print(backlog.head())
except Exception as e:
    print(f'错误: {type(e).__name__}: {e}')
    import traceback
    traceback.print_exc()

print()
print('=== 测试 get_summary_data ===')
from data.api.routes.queries import get_summary_data
summary = get_summary_data(time_start, time_end)
print(f'Total backlog: {summary["total_backlog"]}')
print(f'SLA breach rate: {summary["sla_breach_rate"]}%')

# 修复SLA计算逻辑 - 检查sla_breach_count是否超过了总积压
print()
print('=== 检查SLA计算 ===')
review_logs = data_store.get_review_logs()
pending = review_logs[
    (review_logs["enqueue_time"] <= time_end) &
    ((review_logs["reviewer_end_time"].isna()) | (review_logs["reviewer_end_time"] > time_end))
]
total_pending = len(pending)
print(f'总积压: {total_pending}')

from config.settings import settings
sla_breach = 0
for tag in ["色情", "暴力", "政治", "广告", "低俗"]:
    threshold = settings.sla_thresholds.get(tag, 3600)
    tag_pending = pending[
        pending["machine_risk_tags"].apply(
            lambda t: tag in t if isinstance(t, list) else False
        )
    ]
    wait_time = (time_end - tag_pending["enqueue_time"]).dt.total_seconds()
    breach_count = (wait_time > threshold).sum()
    print(f'  {tag}: {len(tag_pending)} 条待审, {breach_count} 条违规, threshold={threshold}秒')
    sla_breach += breach_count

print(f'总SLA违规: {sla_breach}')
print(f'SLA违规率: {sla_breach / total_pending * 100 if total_pending > 0 else 0:.1f}%')
print(f'注意: 一个视频可能被多个标签标记，所以违规数可能超过总积压数!')
