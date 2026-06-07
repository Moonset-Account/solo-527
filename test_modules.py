#!/usr/bin/env python3
"""系统模块测试脚本"""

from src.database.mock_data import get_samples_df, get_returns_df, get_thresholds_df
from src.utils.data_processor import process_full_pipeline
from src.utils.exporter import export_to_excel
from src.components.charts import (
    create_stage_boxplot, create_stage_duration_barchart,
    create_timeout_rate_chart, create_department_comparison_chart,
    create_sample_timeline, create_return_reasons_chart,
    create_priority_pie_chart, create_trend_chart
)
from src.utils.data_processor import get_timeout_summary, get_department_comparison

def main():
    print("=" * 60)
    print("🚀 开始系统模块测试")
    print("=" * 60)
    
    # 1. 测试数据生成
    print("\n📊 1. 测试数据生成模块...")
    samples = get_samples_df()
    returns = get_returns_df()
    thresholds = get_thresholds_df()
    
    print(f"   - 生成样本数: {len(samples):,}")
    print(f"   - 退回记录数: {len(returns):,}")
    print(f"   - 阈值配置数: {len(thresholds):,}")
    print(f"   - 样本类型: {samples['sample_type'].unique().tolist()}")
    print(f"   - 样本数（急诊）: {(samples['priority'] == 'emergency').sum():,}")
    print(f"   - 样本数（常规）: {(samples['priority'] == 'routine').sum():,}")
    print("   ✅ 数据生成模块测试通过")
    
    # 2. 测试数据处理
    print("\n🔧 2. 测试数据处理模块...")
    df = process_full_pipeline(samples, thresholds, returns)
    print(f"   - 处理后数据列数: {len(df.columns)}")
    print(f"   - 超时样本数: {int(df['any_timeout'].sum()):,}")
    print(f"   - 退回样本数: {int(df['has_return'].sum()):,}")
    print(f"   - 平均总耗时: {df['total_duration_minutes'].mean():.2f} 分钟")
    print("   ✅ 数据处理模块测试通过")
    
    # 3. 测试统计分析
    print("\n📈 3. 测试统计分析...")
    timeout_summary = get_timeout_summary(df, thresholds)
    dept_df = get_department_comparison(df)
    print(f"   - 超时统计环节数: {len(timeout_summary)}")
    print(f"   - 参与对比的科室数: {len(dept_df)}")
    print("   ✅ 统计分析模块测试通过")
    
    # 4. 测试图表生成
    print("\n📉 4. 测试图表生成...")
    
    fig1 = create_stage_boxplot(df)
    print(f"   - 箱线图: {len(fig1.data)} 条轨迹")
    
    fig2 = create_stage_duration_barchart(df, group_by='priority')
    print(f"   - 分组柱状图: {len(fig2.data)} 条轨迹")
    
    fig3 = create_timeout_rate_chart(timeout_summary)
    print(f"   - 超时率图: {len(fig3.data)} 条轨迹")
    
    fig4 = create_department_comparison_chart(dept_df)
    print(f"   - 科室对比图: {len(fig4.data)} 条轨迹")
    
    fig5 = create_return_reasons_chart(returns)
    print(f"   - 退回原因图: {len(fig5.data)} 条轨迹")
    
    fig6 = create_priority_pie_chart(df)
    print(f"   - 优先级饼图: {len(fig6.data)} 条轨迹")
    
    fig7 = create_trend_chart(df, freq='D')
    print(f"   - 趋势图: {len(fig7.data)} 条轨迹")
    
    # 测试单样本时间线
    sample_data = df.iloc[[0]]
    fig8 = create_sample_timeline(sample_data, thresholds)
    print(f"   - 单样本时间线: {len(fig8.data)} 条轨迹")
    
    print("   ✅ 所有图表生成测试通过")
    
    # 5. 测试导出功能
    print("\n📤 5. 测试 Excel 导出...")
    excel_data = export_to_excel(
        df, 
        start_date=df['collected_at'].min(),
        end_date=df['collected_at'].max(),
        returns_df=returns, 
        thresholds_df=thresholds
    )
    size_kb = len(excel_data.getvalue()) / 1024
    print(f"   - Excel 文件大小: {size_kb:.2f} KB")
    print("   ✅ Excel 导出测试通过")
    
    # 6. 测试 Dash 应用导入
    print("\n🖥️  6. 测试 Dash 应用导入...")
    import importlib.util
    spec = importlib.util.spec_from_file_location("app", "app.py")
    app_module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(app_module)
    print(f"   - Dash app 初始化成功")
    print(f"   - app 标题: {app_module.app.title}")
    print("   ✅ Dash 应用导入测试通过")
    
    print("\n" + "=" * 60)
    print("🎉 所有模块测试全部通过!")
    print("=" * 60)
    print("\n💡 运行命令启动应用: python3 app.py")
    print("🌐 访问地址: http://localhost:8050")

if __name__ == '__main__':
    main()
