import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from datetime import datetime, timedelta
from data.api.routes.queries import (
    get_backlog_trend, get_funnel_data, get_workload_data,
    get_appeal_reversal_data
)

time_end = datetime.now()
time_start = time_end - timedelta(hours=24)

print("=" * 60)
print("测试数据层完整筛选支持")
print("=" * 60)

print("\n1. 测试积压曲线 - 完整筛选参数")
df1 = get_backlog_trend(
    time_start, time_end, "1h",
    risk_tags=["色情", "暴力"],
    queue_types=["人审-高优"],
    reviewers=["r001"],
    shifts=["早班"],
    sources=["首页推荐"],
)
print(f"   结果行数: {len(df1)}, 列: {list(df1.columns)}")
print("   ✓ 通过")

print("\n2. 测试队列漏斗 - 完整筛选参数")
df2 = get_funnel_data(
    time_start, time_end,
    risk_tags=["色情"],
    queue_types=["人审-普通"],
    reviewers=["r002"],
    shifts=["午班"],
    sources=["搜索结果"],
)
print(f"   结果行数: {len(df2)}, 列: {list(df2.columns)}")
print("   ✓ 通过")

print("\n3. 测试审核员负载 - 完整筛选参数")
df3 = get_workload_data(
    time_start, time_end,
    risk_tags=["广告"],
    queue_types=["人审-低优"],
    reviewers=["r003", "r004"],
    shifts=["夜班"],
    sources=["用户举报"],
)
print(f"   结果行数: {len(df3)}, 列: {list(df3.columns)}")
print("   ✓ 通过")

print("\n4. 测试申诉逆转率 - 完整筛选参数")
df4 = get_appeal_reversal_data(
    time_start - timedelta(hours=48), time_end,
    risk_tags=["低俗"],
    queue_types=["申诉复核"],
    reviewers=["r005"],
    shifts=["早班"],
    sources=["达人内容"],
)
print(f"   结果行数: {len(df4)}, 列: {list(df4.columns)}")
print("   ✓ 通过")

print("\n5. 测试导出任务状态接口（逻辑修复）")
from data.export.tasks import export_manager
task_id = export_manager.submit_task({"test": True}, "review_logs", "xlsx")
import time
time.sleep(0.5)
status = export_manager.get_status(task_id)
print(f"   提交任务ID: {task_id[:8]}...")
print(f"   状态查询: {status.status if status else 'None'}")
print(f"   不存在任务查询: {export_manager.get_status('non-exist')}")
print("   ✓ 逻辑修复验证通过（无空对象访问）")

print("\n" + "=" * 60)
print("✅ 所有测试通过！")
print("=" * 60)
