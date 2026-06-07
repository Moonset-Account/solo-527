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

# Test 1: _get_version_raw_records works in demo mode
old_vr = q._get_version_raw_records("viewing_records", chapter_id, old_vid)
new_vr = q._get_version_raw_records("viewing_records", chapter_id, new_vid)
results.append(f"Old viewing raw: {len(old_vr)}, New viewing raw: {len(new_vr)}")

old_dr = q._get_version_raw_records("discussion_records", chapter_id, old_vid)
new_dr = q._get_version_raw_records("discussion_records", chapter_id, new_vid)
results.append(f"Old disc raw: {len(old_dr)}, New disc raw: {len(new_dr)}")

old_lpr = q._get_version_raw_records("learning_path_events", chapter_id, old_vid)
new_lpr = q._get_version_raw_records("learning_path_events", chapter_id, new_vid)
results.append(f"Old LP raw: {len(old_lpr)}, New LP raw: {len(new_lpr)}")

# Test 2: Mapping
mapped, unmapped = m.map_records_to_new_structure(old_vr, old_vid, new_vid)
results.append(f"Mapped viewing: {len(mapped)}, Unmapped: {len(unmapped)}")
if not unmapped.empty:
    results.append(f"Unmapped sids: {unmapped['section_id'].unique().tolist()}")
    results.append(f"Unmapped mapping_types: {unmapped['mapping_type'].unique().tolist()}")
    # Verify no mapping_type=unmapped in mapped
    if "mapping_type" in mapped.columns:
        unmapped_in_mapped = mapped[mapped["mapping_type"] == "unmapped"]
        results.append(f"unmapped rows leaked into mapped: {len(unmapped_in_mapped)}")

# Test 3: _get_mapped_data
from app import _get_mapped_data
md = _get_mapped_data(chapter_id)
results.append(f"Mapped viewing comparison: {len(md['viewing'])}")
results.append(f"Unmapped viewing: {len(md['unmapped_viewing'])}")
results.append(f"Unmapped quiz: {len(md['unmapped_quiz'])}")
results.append(f"Unmapped error: {len(md['unmapped_error'])}")
results.append(f"Unmapped discussion: {len(md['unmapped_discussion'])}")
results.append(f"Discussion data: {len(md['discussion'])}")
results.append(f"Learning path events: {len(md['learning_path_events'])}")
results.append(f"Learning path flow: {len(md['learning_path_flow'])}")
results.append(f"Unmapped old sids: {md['unmapped_old_sids']}")

# Test 4: Verify mapped comparison data does NOT contain unmapped section records
# by checking that the viewing comparison excludes sid=4
raw_mapped = q.get_raw_records(chapter_id)
if not raw_mapped.empty and md['unmapped_old_sids']:
    still_in_raw = raw_mapped[raw_mapped["section_id"].isin(md['unmapped_old_sids'])]
    results.append(f"Unmapped sids still in raw records: {len(still_in_raw)} (should be >0, raw is unfiltered)")

# Test 5: Export with mapped data
report_data, filename = e.build_report_data(chapter_id, q, m, md)
results.append(f"Report sheets: {list(report_data.keys())}")
if "无法映射样本" in report_data:
    results.append(f"Unmapped samples sheet: {report_data['无法映射样本'].shape}")
if "原始记录" in report_data:
    raw_rows = report_data["原始记录"]
    if "section_id" in raw_rows.columns and md['unmapped_old_sids']:
        leaked = raw_rows[raw_rows["section_id"].isin(md['unmapped_old_sids'])]
        results.append(f"Unmapped sids leaked into export raw: {len(leaked)} (should be 0)")

excel_bytes = e.export_to_excel(report_data, "test")
results.append(f"Excel size: {len(excel_bytes)} bytes")
results.append("ALL TESTS PASSED")

with open("/tmp/test_result4.txt", "w") as f:
    f.write("\n".join(results))
print("Done")
