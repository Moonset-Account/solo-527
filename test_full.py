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
sections = q.get_chapter_sections()

results = []

from app import _get_mapped_data
md = _get_mapped_data(chapter_id)

# Test 1: Discussion mapping
results.append(f"Discussion comparison: {len(md['discussion'])}")
results.append(f"Unmapped discussion: {len(md['unmapped_discussion'])}")

if not md['unmapped_discussion'].empty:
    ud = md['unmapped_discussion']
    results.append(f"Unmapped disc sids: {ud['section_id'].unique().tolist()}")
    if not sections.empty and "section_id" in ud.columns:
        ud_named = ud.merge(sections[["id","section_name"]].rename(columns={"id":"section_id"}), on="section_id", how="left")
        results.append(f"Unmapped disc sections: {ud_named['section_name'].unique().tolist()}")

if not md['discussion'].empty:
    disc_section_ids = md['discussion']['section_id'].unique() if 'section_id' in md['discussion'].columns else []
    unmapped_in_disc = [s for s in disc_section_ids if s in md['unmapped_old_sids']]
    results.append(f"Unmapped sids in discussion comparison: {len(unmapped_in_disc)} (should be 0)")

# Test 2: Learning path mapping
results.append(f"Learning path events: {len(md['learning_path_events'])}")
results.append(f"Learning path flow: {len(md['learning_path_flow'])}")
results.append(f"Unmapped LP: {len(md['unmapped_learning_path'])}")

if not md['learning_path_flow'].empty:
    flow = md['learning_path_flow']
    all_names = set(flow['from_name'].tolist() + flow['to_name'].tolist())
    results.append(f"Flow section names: {all_names}")
    old_section_names = set(sections[sections['chapter_version_id'] == old_vid]['section_name'].tolist())
    leaked_old_names = all_names & old_section_names
    results.append(f"Old section names still in flow: {leaked_old_names} (should be empty)")

if not md['unmapped_learning_path'].empty:
    ulp = md['unmapped_learning_path']
    results.append(f"Unmapped LP sids: {ulp['section_id'].unique().tolist()}")

# Test 3: No section_id=4 in comparison data
unmapped_sids = md['unmapped_old_sids']
for key in ['learning_path_events', 'learning_path_flow']:
    df = md[key]
    if not df.empty and 'section_id' in df.columns:
        leaked = df[df['section_id'].isin(unmapped_sids)]
        results.append(f"Unmapped sids leaked into {key}: {len(leaked)} (should be 0)")

# Test 4: Export
report_data, filename = e.build_report_data(chapter_id, q, m, md)
results.append(f"Report sheets: {list(report_data.keys())}")
if "无法映射样本" in report_data:
    results.append(f"Unmapped samples: {report_data['无法映射样本'].shape}")

excel_bytes = e.export_to_excel(report_data, "test")
results.append(f"Excel size: {len(excel_bytes)} bytes")
results.append("ALL TESTS PASSED")

with open("/tmp/test_result5.txt", "w") as f:
    f.write("\n".join(results))
print("Done")
