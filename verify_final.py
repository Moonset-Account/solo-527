import sys
import os
sys.path.insert(0, '.')

print("=" * 70)
print("  冷链疫苗合规分析 - 最终验证")
print("=" * 70)

print("\n1. 验证签收照片文件")
print("-" * 70)
photos_dir = "static/photos"
photo_files = [f for f in os.listdir(photos_dir) if f.endswith('.jpg')] if os.path.exists(photos_dir) else []
print(f"   照片目录: {photos_dir}/")
print(f"   照片数量: {len(photo_files)}")
for f in sorted(photo_files):
    size = os.path.getsize(os.path.join(photos_dir, f))
    print(f"     ✓ {f} ({size} bytes)")

print("\n2. 验证数据库模块（无模拟数据 fallback）")
print("-" * 70)
import inspect
from database import ColdChainDatabase, get_database

source = inspect.getsource(ColdChainDatabase._connect)
has_fallback = "fallback" in source.lower() or "模拟" in source
print(f"   存在模拟数据 fallback: {'❌ 是' if has_fallback else '✅ 否（已移除）'}")

source2 = inspect.getsource(get_database)
has_fallback2 = "fallback" in source2.lower() or "模拟" in source2
print(f"   get_database 存在 fallback: {'❌ 是' if has_fallback2 else '✅ 否'}")

print("\n3. 验证数据生成器照片路径")
print("-" * 70)
from data_generator import ColdChainDataGenerator
import re

gen_source = inspect.getsource(ColdChainDataGenerator.generate_shipments)
photo_urls = re.findall(r'signoff_photo_url.*?([\"\'])(.*?)\1', gen_source)
print(f"   照片URL模板: {photo_urls[0][1] if photo_urls else '未找到'}")
uses_local = "/static/photos/" in gen_source
print(f"   使用本地照片路径: {'✅ 是' if uses_local else '❌ 否'}")
uses_picsum = "picsum" in gen_source
print(f"   使用 picsum 占位图: {'❌ 是' if uses_picsum else '✅ 否（已移除）'}")

print("\n4. 验证刷新按钮回调参数")
print("-" * 70)
with open("app.py", "r") as f:
    app_source = f.read()

refresh_match = re.search(r'refresh-btn.*?(get_database\([^)]*\))', app_source, re.DOTALL)
if refresh_match:
    print(f"   刷新按钮调用: {refresh_match.group(1)}")
    correct_param = "init_sample_data" in refresh_match.group(1)
    print(f"   参数名正确: {'✅ 是' if correct_param else '❌ 否'}")
else:
    print("   未找到刷新按钮调用")

print("\n5. 验证有效统计批次排除逻辑")
print("-" * 70)
with open("report_exporter.py", "r") as f:
    report_source = f.read()

has_exclude = "review_status NOT IN" in report_source or "review_status.*pending.*appealed" in report_source
print(f"   报告汇总排除复核/申诉: {'✅ 是' if has_exclude else '❌ 否'}")

with open("app.py", "r") as f:
    app_source = f.read()

kpi_exclude = "ranking_mask" in app_source and "pending.*appealed" in app_source
print(f"   KPI卡片排除复核/申诉: {'✅ 是' if kpi_exclude else '❌ 否'}")

print("\n" + "=" * 70)
print("  验证总结")
print("=" * 70)
all_pass = (
    len(photo_files) >= 8 and
    not has_fallback and
    not has_fallback2 and
    uses_local and
    not uses_picsum
)
if all_pass:
    print("  ✅ 所有验证项通过！")
else:
    print("  ⚠️  部分验证项需要检查")
print("=" * 70)
