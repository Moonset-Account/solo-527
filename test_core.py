import sys
sys.path.insert(0, '.')

print('测试数据生成...')
from data_generator import generate_demo_data
df_shipments, df_samples, config = generate_demo_data()
print(f'  运输批次: {len(df_shipments)}')
print(f'  采样记录: {len(df_samples)}')

print('测试合规计算...')
from compliance_engine import ComplianceCalculator
calc = ComplianceCalculator()
results = calc.calculate_all_compliance(df_shipments, df_samples)
df_res = calc.results_to_dataframe(results)
print(f'  计算完成: {len(df_res)} 条结果')
print(f'  有效批次: {df_res["is_valid_for_ranking"].sum()}')
print(f'  待复核批次: {len(df_res) - df_res["is_valid_for_ranking"].sum()}')
print(f'  平均合规率: {df_res[df_res["is_valid_for_ranking"]]["compliance_rate"].mean():.2f}%')

print('测试报告导出...')
from report_exporter import ReportExporter
report_data = ReportExporter.export_compliance_report(df_res, df_samples, None, 'xlsx')
print(f'  报告大小: {len(report_data)} bytes')

print('')
print('=== 所有核心模块测试通过! ===')
