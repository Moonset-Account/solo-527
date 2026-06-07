#!/usr/bin/env python3
"""测试筛选和下钻逻辑"""
import sys
sys.path.insert(0, '.')

from callbacks.chart_callbacks import build_filters_from_state, get_current_caliber_description

print('=== 测试 1: 维修人员下钻筛选 ===')
filter_state = {'breakdown_type': 'unplanned'}
drilldown_state = {'drilldown_person': '张工'}
filters = build_filters_from_state(filter_state, drilldown_state)
print('筛选条件:', filters)
print('repair_persons 是否正确:', filters.get('repair_persons') == ['张工'])

print('\n=== 测试 2: 备件下钻筛选 ===')
filter_state = {'breakdown_type': 'unplanned'}
drilldown_state = {'drilldown_part_name': '轴承'}
filters = build_filters_from_state(filter_state, drilldown_state)
print('筛选条件:', filters)
print('part_names 是否正确:', filters.get('part_names') == ['轴承'])

print('\n=== 测试 3: 多维度混合下钻 ===')
filter_state = {'line_ids': [1,2], 'breakdown_type': 'unplanned'}
drilldown_state = {
    'drilldown_fault_code': 'E001',
    'drilldown_person': '张工',
    'drilldown_part_name': '轴承'
}
filters = build_filters_from_state(filter_state, drilldown_state)
print('筛选条件:', filters)
print('所有维度是否完整:', all([
    'line_ids' in filters,
    'fault_codes' in filters,
    'repair_persons' in filters,
    'part_names' in filters,
    'breakdown_type' in filters
]))

print('\n=== 测试 4: 口径描述生成 ===')
caliber = get_current_caliber_description(filter_state, drilldown_state)
print('口径描述:', caliber)
print('包含所有下钻信息:', all([
    '产线' in caliber,
    '故障' in caliber,
    '维修人' in caliber,
    '备件' in caliber,
    '突发' in caliber
]))

print('\n=== 测试 5: 用真实数据验证维修人员筛选 ===')
from services.data_service import get_work_orders
filters = {'repair_persons': ['张工']}
orders = get_work_orders(filters)
print('筛选张工后工单数:', len(orders))
if len(orders) > 0:
    print('人员是否都是张工:', all(orders['person_name'] == '张工'))

print('\n=== 测试 6: 用真实数据验证备件筛选 ===')
from services.data_service import get_spare_part_usages
all_parts = get_spare_part_usages({})
if len(all_parts) > 0:
    part_name = all_parts.iloc[0]['part_name']
    print(f'测试筛选备件: {part_name}')
    filtered = get_spare_part_usages({'part_names': [part_name]})
    print(f'筛选后记录数: {len(filtered)}')
    if len(filtered) > 0:
        print(f'备件名称是否一致: {all(filtered["part_name"] == part_name)}')

print('\n=== 测试 7: 维修效率聚合应用所有筛选 ===')
from services.aggregation import get_maintenance_efficiency
filters = {
    'line_ids': [1],
    'repair_persons': ['张工'],
    'breakdown_type': 'unplanned'
}
eff_data = get_maintenance_efficiency(filters)
print('MTTR:', eff_data.get('mttr'))
print('维修人员数据条数:', len(eff_data.get('by_person', [])))

print('\n=== 测试 8: 备件关联聚合应用所有筛选 ===')
from services.aggregation import get_spare_part_correlation
filters = {
    'line_ids': [1],
    'breakdown_type': 'unplanned',
    'part_names': [part_name] if len(all_parts) > 0 else None
}
corr_data = get_spare_part_correlation(filters)
print('关联规则数:', len(corr_data.get('top_correlations', [])))

print('\n🎉 所有测试完成！')
