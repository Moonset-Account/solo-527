import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

print('测试模块导入...')

try:
    from src.utils.data_generator import generate_mock_data
    print('✓ data_generator 导入成功')
except Exception as e:
    print(f'✗ data_generator 导入失败: {e}')
    sys.exit(1)

try:
    from src.analysis.time_slicer import TimeSlicer
    print('✓ TimeSlicer 导入成功')
except Exception as e:
    print(f'✗ TimeSlicer 导入失败: {e}')
    sys.exit(1)

try:
    from src.analysis.anomaly_detector import AnomalyDetector
    print('✓ AnomalyDetector 导入成功')
except Exception as e:
    print(f'✗ AnomalyDetector 导入失败: {e}')
    sys.exit(1)

try:
    from src.analysis.metrics import QueueMetrics, ServeMetrics, ReviewMetrics
    print('✓ Metrics 导入成功')
except Exception as e:
    print(f'✗ Metrics 导入失败: {e}')
    sys.exit(1)

try:
    from src.analysis.cache_manager import CacheManager
    print('✓ CacheManager 导入成功')
except Exception as e:
    print(f'✗ CacheManager 导入失败: {e}')
    sys.exit(1)

try:
    from src.utils.exporter import export_to_csv, export_to_pdf
    print('✓ Exporter 导入成功')
except Exception as e:
    print(f'✗ Exporter 导入失败: {e}')
    sys.exit(1)

print('\n所有模块导入成功！')
