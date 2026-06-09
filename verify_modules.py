import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.services.metrics import (
    MetricsTracker, DashboardQuery, ModelRegistry,
    TimeSeriesPoint, MetricQuery, DashboardSummary,
    LLMUsage, AnomalyPoint,
)
from app.services.mlops import (
    ModelRegistry as MR2, ABTestRunner, EvaluationPipeline,
    ModelConfig, ReleaseChecklist, RollbackPlan,
)
import dataclasses

print("=" * 60)
print("SUCCESS: 所有模块导入成功!")
print("=" * 60)

print("\n--- 数据类字段验证 ---")
data_classes = [
    TimeSeriesPoint, MetricQuery, DashboardSummary,
    LLMUsage, AnomalyPoint,
    ModelConfig, ReleaseChecklist, RollbackPlan
]

for cls in data_classes:
    fields = [f.name for f in dataclasses.fields(cls)]
    print(f"{cls.__name__:20s}: {fields}")

print("\n--- MetricsTracker 公共方法 ---")
for m in dir(MetricsTracker):
    if m.startswith("_"):
        continue
    print(f"  {m}")

print("\n--- DashboardQuery 公共方法 ---")
for m in dir(DashboardQuery):
    if m.startswith("_"):
        continue
    print(f"  {m}")

print("\n--- ModelRegistry 公共方法 ---")
for m in dir(ModelRegistry):
    if m.startswith("_"):
        continue
    print(f"  {m}")

print("\n--- ABTestRunner 公共方法 ---")
for m in dir(ABTestRunner):
    if m.startswith("_"):
        continue
    print(f"  {m}")

print("\n--- EvaluationPipeline 公共方法 ---")
for m in dir(EvaluationPipeline):
    if m.startswith("_"):
        continue
    print(f"  {m}")

print("\n" + "=" * 60)
print("验证完成！")
print("=" * 60)
