import pandas as pd
from datetime import datetime
from io import BytesIO
from data_service import DataService
from config import Config


class ReportExporter:
    def __init__(self, data_service: DataService):
        self.ds = data_service

    def generate_filter_description(self, filters: dict) -> str:
        parts = []
        if filters.get("positions"):
            parts.append(f"职位: {', '.join(filters['positions'])}")
        if filters.get("departments"):
            parts.append(f"部门: {', '.join(filters['departments'])}")
        if filters.get("recruiters"):
            parts.append(f"招聘官: {', '.join(filters['recruiters'])}")
        if filters.get("channels"):
            parts.append(f"渠道: {', '.join(filters['channels'])}")
        if filters.get("stages"):
            parts.append(f"阶段: {', '.join(filters['stages'])}")
        if filters.get("date_range"):
            start, end = filters["date_range"]
            parts.append(f"日期范围: {start} ~ {end}")

        return "; ".join(parts) if parts else "全部数据"

    def export_to_excel(self, filters: dict) -> BytesIO:
        output = BytesIO()

        with pd.ExcelWriter(output, engine="xlsxwriter") as writer:
            filter_desc = self.generate_filter_description(filters)
            summary_stats = self.ds.get_summary_stats(filters)

            summary_df = pd.DataFrame(
                [
                    ["报告生成时间", datetime.now().strftime("%Y-%m-%d %H:%M:%S")],
                    ["筛选条件", filter_desc],
                    ["候选人总数", summary_stats["total_candidates"]],
                    ["已入职人数", summary_stats["hired_count"]],
                    ["整体转化率", f"{summary_stats['conversion_rate']}%"],
                    ["平均招聘周期(天)", summary_stats["avg_cycle_days"]],
                    ["进行中候选人", summary_stats["in_process_count"]],
                ],
                columns=["指标", "数值"],
            )
            summary_df.to_excel(writer, sheet_name="概览", index=False)

            funnel_df = self.ds.get_funnel_data(filters)
            if not funnel_df.empty:
                funnel_df["转化率(从上一阶段)"] = funnel_df["count"].pct_change().fillna(0).mul(100).round(1).astype(str) + "%"
                funnel_df["整体转化率"] = (funnel_df["count"] / funnel_df["count"].iloc[0] * 100).round(1).astype(str) + "%"
                funnel_df.to_excel(writer, sheet_name="招聘漏斗", index=False)

            duration_df = self.ds.get_stage_duration_data(filters)
            if not duration_df.empty:
                duration_df.to_excel(writer, sheet_name="阶段耗时", index=False)

            channel_df = self.ds.get_channel_quality_data(filters)
            if not channel_df.empty:
                channel_df.to_excel(writer, sheet_name="渠道质量", index=False)

            interviewer_df = self.ds.get_interviewer_workload(filters)
            if not interviewer_df.empty:
                interviewer_pivot = interviewer_df.pivot_table(
                    index="interviewer",
                    columns="stage_name",
                    values="total_interviews",
                    fill_value=0,
                    aggfunc="sum",
                )
                interviewer_pivot["总计"] = interviewer_pivot.sum(axis=1)
                interviewer_pivot.reset_index().to_excel(writer, sheet_name="面试官负载", index=False)

            feedback_df = self.ds.get_feedback_data(filters)
            if not feedback_df.empty:
                feedback_df.to_excel(writer, sheet_name="候选人体验", index=False)

            candidates_df = self.ds.get_candidate_details(filters)
            if not candidates_df.empty:
                candidates_df.to_excel(writer, sheet_name="候选人明细", index=False)

            workbook = writer.book
            header_format = workbook.add_format(
                {"bold": True, "bg_color": "#4472C4", "font_color": "white"}
            )

            for sheet_name in writer.sheets:
                worksheet = writer.sheets[sheet_name]
                worksheet.set_column("A:Z", 18)

        output.seek(0)
        return output
