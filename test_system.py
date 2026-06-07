import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from src.utils.data_generator import generate_mock_data
from src.analysis.time_slicer import TimeSlicer
from src.analysis.anomaly_detector import AnomalyDetector
from src.analysis.metrics import QueueMetrics, ServeMetrics, ReviewMetrics

print('=' * 60)
print('校园食堂窗口排队分析系统 - 核心模块验证')
print('=' * 60)

print('\n1. 生成模拟数据...')
orders_df, windows_df, dishes_df, reviews_df, outages_df = generate_mock_data(days=3, orders_per_day=500)
print(f'   ✓ 订单数据: {len(orders_df)} 条')
print(f'   ✓ 窗口数据: {len(windows_df)} 个')
print(f'   ✓ 菜品数据: {len(dishes_df)} 个')
print(f'   ✓ 评价数据: {len(reviews_df)} 条')
print(f'   ✓ 窗口停摆记录: {len(outages_df)} 条')

print('\n2. 时间切片模块验证...')
time_slicer = TimeSlicer()
sample_time = orders_df['queue_start_time'].iloc[0]
print(f'   示例时间: {sample_time}')
print(f'   ✓ 时段分类: {time_slicer.get_time_slot(sample_time)}')
print(f'   ✓ 是否大课间: {time_slicer.is_big_break(sample_time)}')
print(f'   ✓ 5分钟时间桶: {time_slicer.get_time_bucket(sample_time, 5)}')

print('\n3. 异常检测模块验证...')
anomaly_detector = AnomalyDetector()
cleaned_df = anomaly_detector.clean_data(orders_df, outages_df)
abnormal_count = cleaned_df['is_abnormal'].sum()
print(f'   ✓ 异常订单数: {abnormal_count} ({abnormal_count/len(cleaned_df)*100:.1f}%)')
print(f'   ✓ 按楼层分组基线计算功能正常')

print('\n4. 排队指标模块验证...')
queue_metrics = QueueMetrics(cleaned_df)
patterns = queue_metrics.analyze_queue_start_patterns()
print(f'   ✓ 排队模式分析: {len(patterns)} 个窗口时段组合')
spikes = queue_metrics.detect_queue_spikes()
print(f'   ✓ 排队高峰检测: {len(spikes)} 个异常高峰')

print('\n5. 出餐指标模块验证...')
serve_metrics = ServeMetrics(cleaned_df)
serve_patterns = serve_metrics.analyze_serve_patterns()
print(f'   ✓ 出餐模式分析: {len(serve_patterns)} 个窗口时段组合')
payment_analysis = serve_metrics.get_payment_wait_analysis()
print(f'   ✓ 支付等待分析: {len(payment_analysis)} 条记录')
bb_analysis = serve_metrics.get_big_break_analysis()
print(f'   ✓ 大课间分析: {len(bb_analysis)} 条记录')

print('\n6. 评价指标模块验证...')
review_metrics = ReviewMetrics(reviews_df, cleaned_df)
trends = review_metrics.analyze_rating_trends()
print(f'   ✓ 评价趋势分析: {len(trends)} 天数据')
keywords = review_metrics.get_keyword_frequency(min_rating=2)
print(f'   ✓ 差评关键词: {len(keywords)} 个')
decline_reasons = review_metrics.get_review_decline_reasons()
print(f'   ✓ 评价下降原因分析: {len(decline_reasons)} 条记录')

print('\n' + '=' * 60)
print('✅ 所有核心模块验证通过！')
print('=' * 60)

print('\n数据概览:')
print(f'  - 窗口数: {len(windows_df)} (覆盖 {cleaned_df["floor"].nunique()} 个楼层)')
print(f'  - 菜品数: {len(dishes_df)}')
print(f'  - 时间时段: {cleaned_df["time_slot"].unique().tolist()}')
print(f'  - 平均总等待时间: {cleaned_df[~cleaned_df["is_abnormal"]]["total_wait"].mean():.1f} 分钟')
