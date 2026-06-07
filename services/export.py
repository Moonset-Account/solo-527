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
                if isinstance(df, tuple):
                    parts = []
                    for i, part in enumerate(df):
                        if isinstance(part, pd.DataFrame) and not part.empty:
                            parts.append(part)
                    df = pd.concat(parts, ignore_index=True) if parts else pd.DataFrame()
                if isinstance(df, pd.DataFrame) and not df.empty:
                    cols = [c for c in df.columns if df[c].dtype != object or df[c].apply(lambda x: not isinstance(x, (list, dict))).all()]
                    df[cols].to_excel(writer, sheet_name=safe_name, index=False)
                else:
                    pd.DataFrame({"提示": ["无数据"]}).to_excel(
                        writer, sheet_name=safe_name, index=False
                    )
        output.seek(0)
        return output.getvalue()

    @staticmethod
    def build_report_data(chapter_id, queries_service, mapping_service=None):
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

        path_result = queries_service.get_learning_path_data(chapter_id)
        if isinstance(path_result, tuple):
            event_agg, flow = path_result
            if event_agg is not None and not event_agg.empty:
                data["学习路径事件"] = event_agg
            if flow is not None and not flow.empty:
                data["学习流转"] = flow
        elif isinstance(path_result, pd.DataFrame) and not path_result.empty:
            data["学习路径"] = path_result

        raw = queries_service.get_raw_learning_records(chapter_id)
        if raw is not None and not raw.empty:
            safe_raw = raw.copy()
            for c in safe_raw.columns:
                if safe_raw[c].apply(lambda x: isinstance(x, (list, dict))).any():
                    safe_raw[c] = safe_raw[c].apply(str)
            data["原始记录"] = safe_raw

        mapping_info = queries_service.get_mapping_info(chapter_id)
        if mapping_info is not None and not mapping_info.empty:
            data["章节映射"] = mapping_info

        unmapped_count = 0
        if mapping_service is not None:
            versions = queries_service.get_chapter_versions(chapter_id)
            if len(versions) >= 2:
                old_vid = versions.iloc[0]["id"]
                new_vid = versions.iloc[-1]["id"]
                _, unmapped_recs = mapping_service.get_section_mapping(old_vid, new_vid)
                unmapped_count = len(unmapped_recs)
                if unmapped_recs:
                    unmapped_df = pd.DataFrame(unmapped_recs)
                    data["无法映射样本"] = unmapped_df

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"课程更新分析_chapter{chapter_id}_{timestamp}.xlsx"

        return data, filename
