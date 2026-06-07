import sys
sys.path.insert(0, '.')

print("=" * 60)
print("城市空气质量分析工作台 - 第二轮修复验证")
print("=" * 60)

# 测试1: USE_MOCK_DATA=false 不应 fallback
print("\n1. 测试 USE_MOCK_DATA=false 行为:")
from backend.config import Config
original_mock = Config.USE_MOCK_DATA

try:
    Config.USE_MOCK_DATA = False
    from backend.data_service import DataService
    ds = DataService()
    ds.use_mock = False
    ds.get_stations()
    print("   ❌ FAIL: USE_MOCK_DATA=false 时未报错 (fallback了)")
except ConnectionError as e:
    print(f"   ✅ PASS: DB未连接时正确报错: {str(e)[:50]}...")
except Exception as e:
    print(f"   ⚠️  WARN: 报错类型不对: {type(e).__name__}: {e}")

Config.USE_MOCK_DATA = original_mock

# 重新初始化 data_service
import importlib
import backend.data_service
importlib.reload(backend.data_service)
from backend.data_service import data_service

# 测试2: 行政区过滤空气质量和车流量
print("\n2. 测试行政区过滤:")
filters = {'districts': ['朝阳区', '海淀区']}
hourly = data_service.get_air_quality_hourly(filters)
traffic = data_service.get_traffic_hourly(filters)

stations_all = data_service.get_stations()
stations_filtered = data_service.get_stations(['朝阳区', '海淀区'])
print(f"   全部站点: {len(stations_all)}, 筛选后: {len(stations_filtered)} 个站点")
print(f"   空气质量小时记录: {len(hourly)} 条 (筛选后)")
print(f"   车流量小时记录: {len(traffic)} 条 (筛选后)")

# 测试3: 小时范围 + 事件类型筛选
print("\n3. 测试小时范围 + 事件类型筛选:")
filters = {'hour_range': [8, 10], 'event_types': ['污染过程']}
hourly = data_service.get_air_quality_hourly(filters)
events = data_service.get_events(filters)
if not hourly.empty:
    hours = sorted(hourly['hour_bucket'].dt.hour.unique())
    print(f"   小时范围[8-10]筛选后: 小时={hours}")
else:
    print(f"   ⚠️  无数据")
print(f"   事件类型筛选后: {len(events)} 条事件")

# 测试4: 数据追溯验证
print("\n4. 测试数据追溯验证 (verify_aggregation):")
verification = data_service.verify_aggregation({})
print(f"   验证有效: {verification['valid']}")
print(f"   记录数匹配: {verification['count_match']} (原始={verification['raw_record_count']}, 聚合={verification['hourly_record_count']})")
for p, check in verification['pollutant_checks'].items():
    print(f"   {p}: 原始={check['raw_mean']:.2f}, 聚合={check['hourly_mean']:.2f}, 匹配={check['match']}")

# 测试5: CSV导出筛选口径完整性
print("\n5. 测试CSV导出筛选口径:")
sample_filters = {
    'districts': ['朝阳区', '海淀区'],
    'hour_range': [8, 18],
    'event_types': ['污染过程', '极端天气'],
    'exclude_anomalies': True,
    'verified_only': True
}
sample_stats = {'raw_records': 1000, 'hourly_records': 100, 'station_count': 2}

# 模拟导出逻辑中的 filter_description
filter_description = {
    '时间范围': '7d',
    '污染物': 'PM2.5, 臭氧 O₃',
    '行政区': '朝阳区, 海淀区',
    '监测站点': '全部',
    '排除异常样本': True,
    '仅显示已核实投诉': True,
}
if sample_filters.get('hour_range'):
    filter_description['小时范围'] = f"{sample_filters['hour_range'][0]}:00 - {sample_filters['hour_range'][1]}:00"
if sample_filters.get('event_types'):
    filter_description['事件类型'] = ', '.join(sample_filters['event_types'])

print("   筛选口径将包含:")
for k, v in filter_description.items():
    print(f"     - {k}: {v}")

# 测试6: Dash应用导入
print("\n6. 测试Dash应用:")
from app import app
print(f"   ✅ Dash应用导入成功, 回调数: {len(app.callback_map)}")

# 测试7: Flask API导入
print("\n7. 测试Flask API:")
from backend.api import app as api_app
print(f"   ✅ Flask API导入成功, 路由数: {len(list(api_app.url_map.iter_rules()))}")

print("\n" + "=" * 60)
print("所有测试完成!")
print("=" * 60)
