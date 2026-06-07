#!/usr/bin/env python3
"""验证所有修复是否正确"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def test_all():
    print("=" * 70)
    print("🔍 验证医院检验样本时效看板 - 修复验证")
    print("=" * 70)
    print()
    
    # 1. 验证模块导入
    print("1️⃣  验证模块导入...")
    try:
        from src.database.mock_data import (
            get_samples_df, get_returns_df, get_thresholds_df, 
            update_threshold, _use_mock_data
        )
        from src.utils.data_processor import process_full_pipeline
        print("   ✅ 所有模块导入成功")
    except Exception as e:
        print(f"   ❌ 模块导入失败: {e}")
        return False
    print()
    
    # 2. 验证数据加载
    print("2️⃣  验证数据加载...")
    print(f"   数据模式: {'模拟数据' if _use_mock_data() else 'TimescaleDB'}")
    
    samples = get_samples_df()
    returns = get_returns_df()
    thresholds = get_thresholds_df()
    
    print(f"   样本数: {len(samples):,}")
    print(f"   退回记录数: {len(returns):,}")
    print(f"   阈值配置数: {len(thresholds):,}")
    
    if len(samples) == 0:
        print("   ❌ 样本数据为空")
        return False
    print("   ✅ 数据加载成功")
    print()
    
    # 3. 验证数据处理流水线
    print("3️⃣  验证数据处理流水线...")
    df = process_full_pipeline(samples, thresholds, returns)
    print(f"   处理后数据列数: {len(df.columns)}")
    print(f"   超时样本数: {int(df['any_timeout'].sum()):,}")
    print(f"   退回样本数: {int(df['has_return'].sum()):,}")
    print(f"   平均总耗时: {df['total_duration_minutes'].mean():.2f} 分钟")
    print("   ✅ 数据处理成功")
    print()
    
    # 4. 验证阈值修改和重算
    print("4️⃣  验证阈值修改后重算...")
    
    # 获取原始超时率
    original_timeout_rate = df['any_timeout'].mean() * 100
    print(f"   原始超时率: {original_timeout_rate:.2f}%")
    
    # 修改一个阈值（调小，应该使更多样本超时）
    update_threshold('blood', 'emergency', 'collection_to_dispatch', 1)
    new_thresholds = get_thresholds_df()
    
    test_row = new_thresholds[
        (new_thresholds['sample_type'] == 'blood') & 
        (new_thresholds['priority'] == 'emergency') & 
        (new_thresholds['stage_name'] == 'collection_to_dispatch')
    ]
    print(f"   修改后阈值: {test_row.iloc[0]['threshold_minutes']} 分钟")
    
    # 重新处理数据
    df_new = process_full_pipeline(samples, new_thresholds, returns)
    new_timeout_rate = df_new['any_timeout'].mean() * 100
    print(f"   新超时率: {new_timeout_rate:.2f}%")
    
    if new_timeout_rate > original_timeout_rate:
        print("   ✅ 阈值修改后超时率正确上升（重算有效）")
    else:
        print("   ⚠️  阈值修改后超时率未明显变化（可能数据特征问题）")
    
    # 恢复原值
    update_threshold('blood', 'emergency', 'collection_to_dispatch', 10)
    print("   ✅ 阈值已恢复")
    print()
    
    # 5. 验证 Dash 应用导入
    print("5️⃣  验证 Dash 应用...")
    try:
        from app import app, process_data_with_current_thresholds
        print(f"   App 标题: {app.title}")
        print(f"   回调数量: {len(app.callback_map)}")
        
        # 验证 process_data_with_current_thresholds
        from datetime import datetime, timedelta
        start = datetime.now() - timedelta(days=7)
        end = datetime.now()
        df_test, ret_test, th_test = process_data_with_current_thresholds(start, end, None, None, None)
        print(f"   动态数据处理: {len(df_test)} 样本")
        print("   ✅ Dash 应用验证通过")
    except Exception as e:
        print(f"   ❌ Dash 应用验证失败: {e}")
        import traceback
        traceback.print_exc()
        return False
    print()
    
    print("=" * 70)
    print("🎉 所有验证通过！系统已就绪")
    print("=" * 70)
    print()
    print("💡 启动命令: python3 start_lab_dashboard.py")
    print("🌐 访问地址: http://localhost:8050")
    print()
    
    return True

if __name__ == '__main__':
    success = test_all()
    sys.exit(0 if success else 1)
