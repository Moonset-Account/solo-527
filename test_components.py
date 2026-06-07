from services import ChapterMappingService
from services.export import ExportService
from charts import (build_viewing_chart, build_quiz_chart, build_error_heatmap,
                    build_discussion_chart, build_refund_chart, build_learning_path_chart)
from db.queries import QueriesService

m = ChapterMappingService()
q = QueriesService()
e = ExportService()

mapping, unmapped = m.get_section_mapping(1, 2)
print("Mapping rows:", len(mapping))
print("Unmapped:", len(unmapped))
for u in unmapped:
    print("  -", u["section_name"], u["version"], u["reason"])

unmapped_old_sids = [r["section_id"] for r in unmapped if r.get("version") == "old"]
print("Unmapped old sids:", unmapped_old_sids)

vc = q.get_viewing_comparison(1)
fig1 = build_viewing_chart(vc, q.get_update_date(1))
print("Viewing chart OK:", type(fig1).__name__)

qc = q.get_quiz_comparison(1)
fig2 = build_quiz_chart(qc, q.get_update_date(1))
print("Quiz chart OK:", type(fig2).__name__)

eh = q.get_error_heatmap_data(1)
fig3 = build_error_heatmap(eh)
print("Error heatmap OK:", type(fig3).__name__)

lp, flow = q.get_learning_path_data(1)
fig6 = build_learning_path_chart(lp, flow)
print("Path chart OK:", type(fig6).__name__)

report_data, filename = e.build_report_data(1, q, m)
print("Report sheets:", list(report_data.keys()))
if "无法映射样本" in report_data:
    print("Unmapped samples:", report_data["无法映射样本"].shape)

excel_bytes = e.export_to_excel(report_data, "test")
print("Excel size:", len(excel_bytes), "bytes")
print("ALL OK")
