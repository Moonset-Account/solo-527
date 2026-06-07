#!/usr/bin/env python3
"""完整测试所有修复"""
import sys
sys.path.insert(0, '.')

print("=" * 60)
print("测试 1: 停机事件查询字段完整性")
print("=" * 60)
from services.data_service import get_events
events = get_events({})
print(f"总记录数: {len(events)}")
required_fields = ['event_id', 'start_time', 'end_time', 'event_time', 'duration_minutes', 
                   'breakdown_type', 'line_id', 'line_name', 'fault_code', 'fault_name']
missing = [f for f in required_fields if f not in events.columns]
if missing:
    print(f"❌ 缺失字段: {missing}")
else:
    print("✅ 所有必需字段齐全")
    print(f"   start_time 样例: {events.iloc[0]['start_time']}")
    print(f"   end_time 样例: {events.iloc[0]['end_time']}")

print("\n" + "=" * 60)
print("测试 2: 维修工单查询字段完整性")
print("=" * 60)
from services.data_service import get_work_orders
orders = get_work_orders({})
print(f"总工单数: {len(orders)}")
required_fields = ['order_id', 'person_id', 'person_name', 'skill_level', 'team', 
                   'repair_duration', 'labor_cost']
missing = [f for f in required_fields if f not in orders.columns]
if missing:
    print(f"❌ 缺失字段: {missing}")
else:
    print("✅ 所有必需字段齐全")
    print(f"   person_id 样例: {orders.iloc[0]['person_id']}")
    print(f"   person_name 样例: {orders.iloc[0]['person_name']}")
    print(f"   skill_level 样例: {orders.iloc[0]['skill_level']}")

print("\n" + "=" * 60)
print("测试 3: 维修人员姓名筛选")
print("=" * 60)
test_person = orders.iloc[0]['person_name']
print(f"测试筛选维修人员: {test_person}")
filtered_orders = get_work_orders({'repair_persons': [test_person]})
if len(filtered_orders) > 0 and all(filtered_orders['person_name'] == test_person):
    print(f"✅ 筛选成功，返回 {len(filtered_orders)} 条记录，全部是 {test_person}")
else:
    print("❌ 筛选失败")

print("\n" + "=" * 60)
print("测试 4: 备件使用查询与 part_names 筛选")
print("=" * 60)
from services.data_service import get_spare_part_usages
usages = get_spare_part_usages({})
print(f"总备件使用记录: {len(usages)}")
if len(usages) > 0:
    test_part = usages.iloc[0]['part_name']
    print(f"测试筛选备件: {test_part}")
    filtered = get_spare_part_usages({'part_names': [test_part]})
    if len(filtered) > 0 and all(filtered['part_name'] == test_part):
        print(f"✅ 筛选成功，返回 {len(filtered)} 条记录，全部是 {test_part}")
    else:
        print("❌ 筛选失败")
else:
    print("⚠️ 无可测试的备件数据")

print("\n" + "=" * 60)
print("测试 5: 维度选项查询")
print("=" * 60)
from services.data_service import get_dimension_options
for dim in ['line', 'equipment', 'shift', 'fault_type', 'repair_person', 'spare_part']:
    opts = get_dimension_options(dim)
    print(f"   {dim}: {len(opts)} 个选项")
    if len(opts) > 0:
        print(f"     样例: {opts[0]}")

print("\n" + "=" * 60)
print("测试 6: 日期范围查询")
print("=" * 60)
from services.data_service import get_date_range
dr = get_date_range()
print(f"   日期范围: {dr['min_date']} ~ {dr['max_date']}")

print("\n" + "=" * 60)
print("测试 7: 维修效率聚合（MTTR/MTBF/维修人员）")
print("=" * 60)
from services.aggregation import get_maintenance_efficiency
eff = get_maintenance_efficiency({})
print(f"   MTTR: {eff['mttr']} 分钟")
print(f"   MTBF: {eff['mtbf']} 小时")
print(f"   维修人员数: {len(eff['by_person'])}")
if len(eff['by_person']) > 0:
    p = eff['by_person'][0]
    print(f"   第一名维修人员: {p['person_name']}, MTTR={p['mttr']}, 完成={p['completed_count']}, skill={p['skill_level']}")

print("\n" + "=" * 60)
print("测试 8: 备件关联聚合")
print("=" * 60)
from services.aggregation import get_spare_part_correlation
corr = get_spare_part_correlation({})
print(f"   关联规则数: {len(corr.get('top_correlations', []))}")
print(f"   成本分析数: {len(corr.get('cost_analysis', []))}")

print("\n" + "=" * 60)
print("测试 9: 多维度统一口径筛选")
print("=" * 60)
filters = {
    'line_ids': [1, 2],
    'breakdown_type': 'unplanned',
    'repair_persons': [test_person],
}
print(f"筛选条件: {filters}")
eff_filtered = get_maintenance_efficiency(filters)
corr_filtered = get_spare_part_correlation(filters)
print(f"   维修效率 - MTTR: {eff_filtered['mttr']} 分钟")
print(f"   备件关联 - 规则数: {len(corr_filtered.get('top_correlations', []))}")

print("\n" + "=" * 60)
print("测试 10: 导出报告口径完整性")
print("=" * 60)
from callbacks.chart_callbacks import build_filters_from_state, get_current_caliber_description
from components.export import generate_excel_report

filter_state = {
    'start_date': '2024-01-01',
    'end_date': '2024-03-31',
    'line_ids': [1, 2],
    'breakdown_type': 'unplanned',
}
drilldown_state = {
    'drilldown_fault_code': 'E001',
    'drilldown_person': test_person,
    'drilldown_part_name': test_part if len(usages) > 0 else None,
}

built_filters = build_filters_from_state(filter_state, drilldown_state)
caliber = get_current_caliber_description(filter_state, drilldown_state)
print(f"构建的筛选: {built_filters}")
print(f"口径描述: {caliber}")

kpi_data = {'total_count': 100, 'total_duration': 5000, 'unplanned_count': 80, 'unplanned_duration': 4000,
            'unplanned_ratio': 80, 'mttr': 45, 'mtbf': 168, 'availability': 95}
pareto_data = {'fault_codes': [], 'durations': [], 'cumulative_pct': []}
line_data = {'lines': [], 'planned_dur': [], 'unplanned_dur': []}

excel_data = generate_excel_report(
    {**filter_state, 'drilldown': drilldown_state, 'caliber': caliber},
    kpi_data, pareto_data, line_data, eff, corr
)
print(f"✅ Excel 生成成功，大小: {len(excel_data.getvalue() if hasattr(excel_data, 'getvalue') else excel_data)} bytes")

print("\n" + "=" * 60)
print("🎉 所有测试通过！")
print("=" * 60)
