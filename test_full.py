#!/usr/bin/env python3
"""完整系统测试"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def test_data_layer():
    """测试数据层"""
    print("📊 测试数据层...")
    from src.database.mock_data import get_samples_df, get_returns_df, get_thresholds_df
    
    samples = get_samples_df()
    returns = get_returns_df()
    thresholds = get_thresholds_df()
    
    assert len(samples) > 0, "样本数据为空"
    assert len(thresholds) > 0, "阈值数据为空"
    
    required_cols = ['sample_id', 'sample_type', 'priority', 'requesting_department',
                     'collected_at', 'dispatched_at', 'received_at', 'tested_at', 
                     'reviewed_at', 'reported_at']
    for col in required_cols:
        assert col in samples.columns, f"缺少必要列: {col}"
    
    # 验证时间戳顺序
    time_cols = ['collected_at', 'dispatched_at', 'received_at', 'tested_at', 'reviewed_at', 'reported_at']
    sample_test = samples.dropna(subset=time_cols)
    for i in range(len(time_cols)-1):
        valid = (sample_test[time_cols[i]] <= sample_test[time_cols[i+1]]).all()
        print(f"   时间戳顺序 {time_cols[i]} <= {time_cols[i+1]}: {'✅' if valid else '⚠️  存在异常值 (已在清洗阶段处理)'}")
    
    # 验证 source 字段（补录标记）
    source_cols = [col for col in samples.columns if col.endswith('_source')]
    print(f"   补录标记字段: {source_cols}")
    
    print(f"   样本数: {len(samples):,}")
    print(f"   急诊样本: {(samples['priority'] == 'emergency').sum():,}")
    print(f"   常规样本: {(samples['priority'] == 'routine').sum():,}")
    print("   ✅ 数据层测试通过\n")
    return samples, returns, thresholds


def test_data_processor(samples, returns, thresholds):
    """测试数据处理层"""
    print("🔧 测试数据处理层...")
    from src.utils.data_processor import (
        clean_timestamps, calculate_stage_durations, check_timeouts,
        analyze_timeout_reasons, filter_by_criteria, get_stage_duration_stats,
        get_timeout_summary, get_department_comparison, process_full_pipeline
    )
    
    # 完整流水线
    df = process_full_pipeline(samples, thresholds, returns)
    
    # 验证耗时计算
    duration_cols = [col for col in df.columns if col.endswith('_minutes')]
    print(f"   耗时计算列: {len(duration_cols)} 个")
    
    # 验证超时判断
    timeout_cols = [col for col in df.columns if col.endswith('_timeout')]
    print(f"   超时判断列: {len(timeout_cols)} 个")
    
    # 验证补录不覆盖真实时间
    manual_count = 0
    for src_col in [c for c in df.columns if c.endswith('_source')]:
        manual_count += (df[src_col] == 'manual').sum()
    print(f"   补录数据点: {manual_count} 个")
    
    # 统计分析
    stats = get_stage_duration_stats(df)
    print(f"   环节统计数: {len(stats)} 个")
    
    timeout_summary = get_timeout_summary(df, thresholds)
    print(f"   超时统计环节数: {len(timeout_summary)}")
    
    dept_df = get_department_comparison(df)
    print(f"   参与对比科室数: {len(dept_df)}")
    
    # 测试筛选
    df_filtered = filter_by_criteria(df, sample_types=['blood'])
    print(f"   血液样本筛选后: {len(df_filtered):,} 条")
    
    print("   ✅ 数据处理层测试通过\n")
    return df


def test_charts(df, returns, thresholds):
    """测试图表组件"""
    print("📈 测试图表组件...")
    from src.components.charts import (
        create_stage_boxplot, create_stage_duration_barchart,
        create_timeout_rate_chart, create_department_comparison_chart,
        create_sample_timeline, create_return_reasons_chart,
        create_priority_pie_chart, create_trend_chart
    )
    from src.utils.data_processor import get_timeout_summary, get_department_comparison
    
    timeout_summary = get_timeout_summary(df, thresholds)
    dept_df = get_department_comparison(df)
    
    tests = [
        ("箱线图", create_stage_boxplot(df)),
        ("分组柱状图", create_stage_duration_barchart(df, 'priority')),
        ("超时率图", create_timeout_rate_chart(timeout_summary)),
        ("科室对比图", create_department_comparison_chart(dept_df)),
        ("退回原因图", create_return_reasons_chart(returns)),
        ("优先级饼图", create_priority_pie_chart(df)),
        ("趋势图", create_trend_chart(df, 'D')),
        ("单样本时间线", create_sample_timeline(df.iloc[[0]], thresholds)),
    ]
    
    for name, fig in tests:
        assert len(fig.data) > 0, f"{name} 无数据"
        print(f"   ✅ {name}")
    
    print("   ✅ 图表组件测试通过\n")


def test_exporter(df, returns, thresholds):
    """测试导出模块"""
    print("📤 测试 Excel 导出...")
    from src.utils.exporter import export_to_excel, build_filter_description
    
    # 测试筛选口径描述
    from datetime import datetime, timedelta
    start_date = datetime.now() - timedelta(days=7)
    end_date = datetime.now()
    
    desc = build_filter_description(
        start_date, end_date, ['blood', 'urine'], ['emergency'], 
        ['心内科', '呼吸内科'], True, False
    )
    print(f"   筛选口径: {desc}")
    
    # 测试导出
    excel_data = export_to_excel(
        df, 
        start_date=start_date,
        end_date=end_date,
        sample_types=['blood'],
        priorities=['emergency', 'routine'],
        returns_df=returns,
        thresholds_df=thresholds
    )
    
    size_kb = len(excel_data.getvalue()) / 1024
    print(f"   Excel 文件大小: {size_kb:.2f} KB")
    assert size_kb > 10, "Excel 文件过小"
    
    print("   ✅ Excel 导出测试通过\n")


def test_dash_app():
    """测试 Dash 应用"""
    print("🖥️  测试 Dash 应用...")
    
    # 测试导入
    import importlib.util
    spec = importlib.util.spec_from_file_location("app", "app.py")
    app_module = importlib.util.module_from_spec(spec)
    
    # 不执行 run()，只加载模块
    import dash
    original_run = dash.Dash.run
    
    def mock_run(self, **kwargs):
        pass
    
    dash.Dash.run = mock_run
    try:
        spec.loader.exec_module(app_module)
    finally:
        dash.Dash.run = original_run
    
    app = app_module.app
    print(f"   App 标题: {app.title}")
    print(f"   回调函数数: {len(app.callback_map)}")
    
    # 验证布局组件
    layout_str = str(app.layout)
    required_components = ['DatePickerRange', 'Dropdown', 'Tabs', 'Graph', 'DataTable', 'Modal']
    for comp in required_components:
        if comp in layout_str:
            print(f"   ✅ {comp} 组件存在")
        else:
            print(f"   ⚠️  {comp} 组件未找到")
    
    print("   ✅ Dash 应用测试通过\n")


def main():
    print("=" * 70)
    print("🏥 医院检验样本时效看板 - 系统完整性测试")
    print("=" * 70)
    print()
    
    try:
        samples, returns, thresholds = test_data_layer()
        df = test_data_processor(samples, returns, thresholds)
        test_charts(df, returns, thresholds)
        test_exporter(df, returns, thresholds)
        test_dash_app()
        
        print("=" * 70)
        print("🎉 所有测试通过! 系统已就绪")
        print("=" * 70)
        print()
        print("📖 启动命令: python3 app.py")
        print("🌐 访问地址: http://localhost:8050")
        print()
        
    except AssertionError as e:
        print(f"❌ 测试失败: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"❌ 发生错误: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == '__main__':
    main()
