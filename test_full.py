from db.queries import QueriesService
from services import ChapterMappingService
from services.export import ExportService

q = QueriesService()
m = ChapterMappingService()
e = ExportService()

chapters = q.get_chapters()
chapter_id = chapters.iloc[0]["id"]
versions = q.get_chapter_versions(chapter_id)

has_multiple = len(versions) >= 2
if has_multiple:
    old_vid = versions.iloc[0]["id"]
    new_vid = versions.iloc[-1]["id"]
    mapping, unmapped = m.get_section_mapping(old_vid, new_vid)
    unmapped_old_sids = [r["section_id"] for r in unmapped if r.get("version") == "old"]
    
    old_viewing = q.get_viewing_comparison(chapter_id, old_vid)
    new_viewing = q.get_viewing_comparison(chapter_id, new_vid)
    
    old_lp, old_flow = q.get_learning_path_data(chapter_id, old_vid)
    new_lp, new_flow = q.get_learning_path_data(chapter_id, new_vid)

report_data, filename = e.build_report_data(chapter_id, q, m)
excel_bytes = e.export_to_excel(report_data, "test")

with open("/tmp/test_result.txt", "w") as f:
    f.write(f"Chapters: {len(chapters)}\n")
    f.write(f"Versions: {len(versions)}\n")
    f.write(f"Has multiple: {has_multiple}\n")
    if has_multiple:
        f.write(f"Mapping rows: {len(mapping)}\n")
        f.write(f"Unmapped records: {len(unmapped)}\n")
        f.write(f"Unmapped old sids: {unmapped_old_sids}\n")
        f.write(f"Old viewing: {len(old_viewing)}, New viewing: {len(new_viewing)}\n")
        f.write(f"Old LP events: {len(old_lp)}, flow: {len(old_flow)}\n")
        f.write(f"New LP events: {len(new_lp)}, flow: {len(new_flow)}\n")
    f.write(f"Report sheets: {list(report_data.keys())}\n")
    f.write(f"Has unmapped samples: {'无法映射样本' in report_data}\n")
    f.write(f"Excel size: {len(excel_bytes)} bytes\n")
    f.write("FULL TEST PASSED\n")

print("Done - check /tmp/test_result.txt")
