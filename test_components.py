from services import ChapterMappingService
from charts import (build_viewing_chart, build_quiz_chart, build_error_heatmap,
                    build_discussion_chart, build_refund_chart, build_learning_path_chart)
from db.queries import QueriesService

m = ChapterMappingService()
q = QueriesService()

mapping, unmapped = m.get_section_mapping(1, 2)
print("Mapping rows:", len(mapping))
if not mapping.empty:
    print(mapping[["old_section_name", "new_section_name", "mapping_type"]].to_string(index=False))
print("Unmapped:", len(unmapped))
for u in unmapped:
    print("  -", u)

vc = q.get_viewing_comparison(1)
fig1 = build_viewing_chart(vc, q.get_update_date(1))
print("Viewing chart OK:", type(fig1).__name__)

qc = q.get_quiz_comparison(1)
fig2 = build_quiz_chart(qc, q.get_update_date(1))
print("Quiz chart OK:", type(fig2).__name__)

eh = q.get_error_heatmap_data(1)
fig3 = build_error_heatmap(eh)
print("Error heatmap OK:", type(fig3).__name__)

dc = q.get_discussion_aggregation(1)
fig4 = build_discussion_chart(dc, q.get_update_date(1))
print("Discussion chart OK:", type(fig4).__name__)

rc = q.get_refund_comparison(1)
fig5 = build_refund_chart(rc, q.get_update_date(1))
print("Refund chart OK:", type(fig5).__name__)

lp, flow = q.get_learning_path_data(1)
fig6 = build_learning_path_chart(lp, flow)
print("Path chart OK:", type(fig6).__name__)

print("ALL CHARTS OK")
