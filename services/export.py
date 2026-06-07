import io
import pandas as pd
from datetime import datetime


class ExportService:
    @staticmethod
    def export_to_excel(report_data: dict, chapter_name: str = "report") -> bytes:
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine="xlsxwriter") as writer:
            for sheet_name, df in report_data.items():
                safe_name = sheet_name[:31]
                if not df.empty:
                    df.to_excel(writer, sheet_name=safe_name, index=False)
                else:
                    pd.DataFrame({"提示": ["无数据"]}).to_excel(
                        writer, sheet_name=safe_name, index=False
                    )
        output.seek(0)
        return output.getvalue()

    @staticmethod
    def build_report_data(chapter_id, queries_service):
        data = {}

        viewing = queries_service.get_viewing_comparison(chapter_id)
        if viewing is not None and not viewing.empty:
            data["观看对比"] = viewing

        quiz = queries_service.get_quiz_comparison(chapter_id)
        if quiz is not None and not quiz.empty:
            data["测验对比"] = quiz

        errors = queries_service.get_error_heatmap_data(chapter_id)
        if errors is not None and not errors.empty:
            data["错题热力图"] = errors

        discussions = queries_service.get_discussion_aggregation(chapter_id)
        if discussions is not None and not discussions.empty:
            data["讨论聚合"] = discussions

        refunds = queries_service.get_refund_comparison(chapter_id)
        if refunds is not None and not refunds.empty:
            data["退款对比"] = refunds

        path_data = queries_service.get_learning_path_data(chapter_id)
        if path_data is not None and not path_data.empty:
            data["学习路径"] = path_data

        raw = queries_service.get_raw_learning_records(chapter_id)
        if raw is not None and not raw.empty:
            data["原始记录"] = raw

        mapping_info = queries_service.get_mapping_info(chapter_id)
        if mapping_info is not None and not mapping_info.empty:
            data["章节映射"] = mapping_info

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"课程更新分析_{chapter_name}_{timestamp}.xlsx"

        return data, filename
