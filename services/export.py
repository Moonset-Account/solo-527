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
    def build_report_data(chapter_id, queries_service, mapping_service=None, mapped_data=None):
        data = {}

        if mapped_data is not None:
            viewing = mapped_data.get("viewing", pd.DataFrame())
            quiz = mapped_data.get("quiz", pd.DataFrame())
            errors = mapped_data.get("error", pd.DataFrame())
            discussions = mapped_data.get("discussion", pd.DataFrame())
            refunds = mapped_data.get("refund", pd.DataFrame())
            lp_events = mapped_data.get("learning_path_events", pd.DataFrame())
            lp_flow = mapped_data.get("learning_path_flow", pd.DataFrame())
            unmapped_viewing = mapped_data.get("unmapped_viewing", pd.DataFrame())
            unmapped_quiz = mapped_data.get("unmapped_quiz", pd.DataFrame())
            unmapped_error = mapped_data.get("unmapped_error", pd.DataFrame())
            unmapped_discussion = mapped_data.get("unmapped_discussion", pd.DataFrame())
        else:
            viewing = queries_service.get_viewing_comparison(chapter_id)
            quiz = queries_service.get_quiz_comparison(chapter_id)
            errors = queries_service.get_error_heatmap_data(chapter_id)
            discussions = queries_service.get_discussion_aggregation(chapter_id)
            refunds = queries_service.get_refund_comparison(chapter_id)
            lp_events, lp_flow = queries_service.get_learning_path_data(chapter_id)
            unmapped_viewing = pd.DataFrame()
            unmapped_quiz = pd.DataFrame()
            unmapped_error = pd.DataFrame()
            unmapped_discussion = pd.DataFrame()

        if viewing is not None and not viewing.empty:
            data["观看对比"] = viewing

        if quiz is not None and not quiz.empty:
            data["测验对比"] = quiz

        if errors is not None and not errors.empty:
            data["错题热力图"] = errors

        if discussions is not None and not discussions.empty:
            data["讨论聚合"] = discussions

        if refunds is not None and not refunds.empty:
            data["退款对比"] = refunds

        if lp_events is not None and not lp_events.empty:
            data["学习路径事件"] = lp_events

        if lp_flow is not None and not lp_flow.empty:
            data["学习流转"] = lp_flow

        raw = queries_service.get_raw_records(chapter_id)
        if raw is not None and not raw.empty:
            safe_raw = raw.copy()
            unmapped_old_sids = set()
            if mapped_data is not None:
                unmapped_old_sids = mapped_data.get("unmapped_old_sids", set())
            if unmapped_old_sids and "section_id" in safe_raw.columns:
                safe_raw = safe_raw[~safe_raw["section_id"].isin(unmapped_old_sids)].copy()
            for c in safe_raw.columns:
                if safe_raw[c].apply(lambda x: isinstance(x, (list, dict))).any():
                    safe_raw[c] = safe_raw[c].apply(str)
            data["原始记录"] = safe_raw

        mapping_info = queries_service.get_mapping_info(chapter_id)
        if mapping_info is not None and not mapping_info.empty:
            data["章节映射"] = mapping_info

        sections = queries_service.get_chapter_sections()

        unmapped_parts = []
        if not unmapped_viewing.empty:
            uv = unmapped_viewing.copy()
            uv["记录类型"] = "观看"
            if not sections.empty and "section_id" in uv.columns:
                uv = uv.merge(
                    sections[["id", "section_name"]].rename(columns={"id": "section_id"}),
                    on="section_id", how="left"
                )
            unmapped_parts.append(uv)

        if not unmapped_quiz.empty:
            uq = unmapped_quiz.copy()
            uq["记录类型"] = "测验"
            if not sections.empty and "section_id" in uq.columns:
                uq = uq.merge(
                    sections[["id", "section_name"]].rename(columns={"id": "section_id"}),
                    on="section_id", how="left"
                )
            unmapped_parts.append(uq)

        if not unmapped_error.empty:
            ue = unmapped_error.copy()
            ue["记录类型"] = "错题"
            if not sections.empty and "section_id" in ue.columns:
                ue = ue.merge(
                    sections[["id", "section_name"]].rename(columns={"id": "section_id"}),
                    on="section_id", how="left"
                )
            unmapped_parts.append(ue)

        if not unmapped_discussion.empty:
            ud = unmapped_discussion.copy()
            ud["记录类型"] = "讨论"
            if not sections.empty and "section_id" in ud.columns:
                ud = ud.merge(
                    sections[["id", "section_name"]].rename(columns={"id": "section_id"}),
                    on="section_id", how="left"
                )
            unmapped_parts.append(ud)

        if unmapped_parts:
            unmapped_all = pd.concat(unmapped_parts, ignore_index=True)
            display_cols = [c for c in unmapped_all.columns if c in
                            ["记录类型", "time", "user_id", "section_name", "section_id",
                             "duration_seconds", "completion_pct", "score", "total_questions",
                             "correct_answers", "question_id", "selected_answer", "correct_answer",
                             "content", "mapping_type"]]
            col_map = {
                "time": "时间", "user_id": "用户ID", "section_name": "小节",
                "duration_seconds": "时长(秒)", "completion_pct": "完播率",
                "score": "分数", "total_questions": "总题数",
                "correct_answers": "正确数", "question_id": "题目ID",
                "selected_answer": "选择答案", "correct_answer": "正确答案",
                "content": "讨论内容", "mapping_type": "映射类型",
            }
            export_df = unmapped_all[display_cols].copy()
            export_df.columns = [col_map.get(c, c) for c in export_df.columns]
            data["无法映射样本"] = export_df

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"课程更新分析_chapter{chapter_id}_{timestamp}.xlsx"

        return data, filename
