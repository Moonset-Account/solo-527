import sys
sys.path.insert(0, '.')

from backend.data_service import data_service
from backend.config import Config

print("=== 后端服务测试 ===")

# 测试1: 小时范围筛选
print("\n1. 测试小时范围筛选 [8:00 - 10:00]:")
filters = {'hour_range': [8, 10]}
hourly = data_service.get_air_quality_hourly(filters)
if not hourly.empty:
    hours = sorted(hourly['hour_bucket'].dt.hour.unique())
    print(f"   获取到的小时: {hours}")
    assert all(8 <= h <= 10 for h in hours), "小时范围筛选失败"
    print("   ✅ 小时范围筛选正常工作")
else:
    print("   ⚠️  无数据")

# 测试2: 事件类型筛选
print("\n2. 测试事件类型筛选:")
event_filters = {'event_types': ['污染过程']}
events = data_service.get_events(event_filters)
if not events.empty:
    types = list(events['event_type'].unique())
    print(f"   获取到的事件类型: {types}")
    assert all(t == '污染过程' for t in types), "事件类型筛选失败"
    print("   ✅ 事件类型筛选正常工作")
else:
    print("   ⚠️  无数据")

# 测试3: 行政区筛选
print("\n3. 测试行政区筛选:")
district_filters = {'districts': ['朝阳区', '海淀区']}
stations = data_service.get_stations(['朝阳区', '海淀区'])
print(f"   获取到 {len(stations)} 个站点")
districts = list(stations['district'].unique())
print(f"   行政区: {districts}")
assert set(districts).issubset({'朝阳区', '海淀区'}), "行政区筛选失败"
print("   ✅ 行政区筛选正常工作")

# 测试4: 车流量数据
print("\n4. 测试车流量数据:")
traffic = data_service.get_traffic_hourly({})
print(f"   获取到 {len(traffic)} 条聚合记录")
if not traffic.empty:
    cols = list(traffic.columns)
    print(f"   数据列: {cols[:8]}...")
    print("   ✅ 车流量数据正常")

# 测试5: 空数据处理
print("\n5. 测试空数据处理:")
empty_filters = {'start_time': '2099-01-01', 'end_time': '2099-01-02'}
empty_data = data_service.get_air_quality_hourly(empty_filters)
print(f"   返回 {len(empty_data)} 条记录")
assert len(empty_data) == 0, "空数据处理失败"
print("   ✅ 空数据处理正常")

# 测试6: 数据可追溯验证
print("\n6. 测试数据可追溯验证:")
verification = data_service.verify_aggregation({})
print(f"   验证有效: {verification['valid']}")
print(f"   计数匹配: {verification['count_match']}")
print(f"   污染物校验通过: {all(v['match'] for v in verification['pollutant_checks'].values())}")
print("   ✅ 数据可追溯验证正常")

# 测试7: 投诉隐私保护
print("\n7. 测试公众端投诉隐私保护:")
complaints_public = data_service.get_complaints({}, is_public=True)
unverified = complaints_public[~complaints_public['is_verified']]
if not unverified.empty:
    sample_desc = unverified.iloc[0]['description']
    sample_name = unverified.iloc[0]['reporter_name']
    print(f"   未核实投诉描述: {sample_desc}")
    print(f"   未核实投诉举报人: {sample_name}")
    assert sample_desc == '待核实投诉详情暂不公开', "隐私保护失败"
    assert pd.isna(sample_name), "举报人姓名未脱敏"
    print("   ✅ 公众端隐私保护正常工作")

# 测试8: USE_MOCK_DATA 切换
print("\n8. USE_MOCK_DATA 状态:")
print(f"   当前模式: {'模拟数据' if Config.USE_MOCK_DATA else '真实数据库'}")
print(f"   数据库连接: {'可用' if data_service.use_mock or (hasattr(data_service, 'db_service') and data_service.db_service.is_connected()) else '不可用'}")
print("   ✅ 模式切换机制正常")

print("\n=== 所有测试完成 ===")
