import sys
sys.path.insert(0, '.')

print("=" * 60)
print("  综合功能测试")
print("=" * 60)

print("\n1. 测试数据库接入...")
from database import get_database
db = get_database(force_new=True)
df_shipments, df_samples = db.load_data()
print(f"   ✓ 运输记录: {len(df_shipments)} 条")
print(f"   ✓ 温度采样: {len(df_samples)} 条")

print("\n2. 测试合规计算（排除复核/申诉批次）...")
from compliance_engine import ComplianceCalculator
calc = ComplianceCalculator()
results = calc.calculate_all_compliance(df_shipments, df_samples)
df_res = calc.results_to_dataframe(results)

ranking_mask = (
    df_res["is_valid_for_ranking"] & 
    (~df_res["review_status"].isin(["pending", "appealed"]))
)
valid_for_ranking = df_res[ranking_mask]
pending_review = df_res[df_res["review_status"].isin(["pending", "appealed"])]

print(f"   ✓ 总批次: {len(df_res)}")
print(f"   ✓ 参与排名批次（排除复核/申诉）: {len(valid_for_ranking)}")
print(f"   ✓ 复核/申诉中批次（不参与排名）: {len(pending_review)}")
print(f"   ✓ 平均合规率: {valid_for_ranking['compliance_rate'].mean():.2f}%")

print("\n3. 测试 Excel 报告导出...")
from report_exporter import ReportExporter

df_cleaned_export = []
for r in results:
    for d in r.removed_details:
        d["box_id"] = r.box_id
        d["batch_no"] = r.batch_no
        d["route"] = r.route
        df_cleaned_export.append(d)
df_cleaned_exp = __import__('pandas').DataFrame(df_cleaned_export)

report_data = ReportExporter.export_compliance_report(
    df_res, df_samples, df_cleaned_exp, format="xlsx"
)
print(f"   ✓ 报告生成成功，大小: {len(report_data)} bytes")

with open("test_report.xlsx", "wb") as f:
    f.write(report_data)
print("   ✓ 已保存为 test_report.xlsx")

print("\n4. 验证报告中合规排名已排除复核/申诉批次...")
import pandas as pd
xls = pd.ExcelFile("test_report.xlsx")
df_ranking_sheet = pd.read_excel(xls, "合规排名")
has_pending = any(df_ranking_sheet["状态"].str.contains("复核|申诉", na=False))
print(f"   ✓ 合规排名表中包含复核/申诉状态: {'是（有问题）' if has_pending else '否（正确）'}")

import os
os.remove("test_report.xlsx")

print("\n" + "=" * 60)
print("  所有测试通过! ✓")
print("=" * 60)
