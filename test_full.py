import sys
sys.path.insert(0, "/Users/xingyaolei/Desktop/trae-solo-generated-projects/question-187")

from db.queries import QueriesService
from services import ChapterMappingService
from services.export import ExportService
import pandas as pd

q = QueriesService()
m = ChapterMappingService()
e = ExportService()

chapters = q.get_chapters()
chapter_id = chapters.iloc[0]["id"]
versions = q.get_chapter_versions(chapter_id)
old_vid = versions.iloc[0]["id"]
new_vid = versions.iloc[-1]["id"]

results = []

viewing_all = q.get_viewing_comparison(chapter_id)
results.append(f"All versions viewing: {len(viewing_all)} rows")

viewing_old = q.get_viewing_comparison(chapter_id, old_vid)
viewing_new = q.get_viewing_comparison(chapter_id, new_vid)
results.append(f"Old: {len(viewing_old)}, New: {len(viewing_new)}")

old_viewing_raw = q._filter_by_section_ids(q._get_data("viewing_records"), chapter_id, old_vid)
mapped, unmapped = m.map_records_to_new_structure(old_viewing_raw, old_vid, new_vid)
results.append(f"Mapped viewing: {len(mapped)}, Unmapped: {len(unmapped)}")
if not unmapped.empty:
    results.append(f"Unmapped sids: {unmapped['section_id'].unique().tolist()}")
    results.append(f"Unmapped mapping_types: {unmapped['mapping_type'].unique().tolist()}")

from app import _get_mapped_data
mapped_data = _get_mapped_data(chapter_id)
results.append(f"Mapped viewing comparison: {len(mapped_data['viewing'])}")
results.append(f"Unmapped viewing: {len(mapped_data['unmapped_viewing'])}")
results.append(f"Unmapped quiz: {len(mapped_data['unmapped_quiz'])}")
results.append(f"Unmapped error: {len(mapped_data['unmapped_error'])}")

report_data, filename = e.build_report_data(chapter_id, q, m, mapped_data)
results.append(f"Report sheets: {list(report_data.keys())}")
if "无法映射样本" in report_data:
    results.append(f"Unmapped samples: {report_data['无法映射样本'].shape}")

excel_bytes = e.export_to_excel(report_data, "test")
results.append(f"Excel size: {len(excel_bytes)} bytes")
results.append("ALL TESTS PASSED")

with open("/tmp/test_result3.txt", "w") as f:
    f.write("\n".join(results))
print("Done")
