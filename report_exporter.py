import pandas as pd
import io
from typing import List, Dict
from datetime import datetime


class ReportExporter:
    @staticmethod
    def export_compliance_report(
        df_results: pd.DataFrame,
        df_samples: pd.DataFrame,
        df_cleaned: pd.DataFrame = None,
        format: str = "xlsx"
    ) -> bytes:
        output = io.BytesIO()
        
        if format == "csv":
            csv_data = ReportExporter._format_csv_report(df_results, df_samples, df_cleaned)
            output.write(csv_data.encode("utf-8-sig"))
        else:
            ReportExporter._format_excel_report(df_results, df_samples, df_cleaned, output)
        
        output.seek(0)
        return output.getvalue()
    
    @staticmethod
    def _format_csv_report(
        df_results: pd.DataFrame,
        df_samples: pd.DataFrame,
        df_cleaned: pd.DataFrame = None
    ) -> str:
        lines = []
        lines.append("冷链疫苗温度合规分析报告")
        lines.append(f"生成时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        lines.append("")
        lines.append("=" * 80)
        lines.append("一、批次合规明细")
        lines.append("=" * 80)
        lines.append("")
        
        df_display = df_results.copy()
        df_display["signoff_time"] = df_display["signoff_time"].dt.strftime("%Y-%m-%d %H:%M")
        df_display["状态"] = df_display.apply(ReportExporter._get_status_label, axis=1)
        
        csv_lines = df_display.to_csv(index=False)
        lines.append(csv_lines)
        lines.append("")
        
        if df_cleaned is not None and len(df_cleaned) > 0:
            lines.append("=" * 80)
            lines.append("二、被剔除数据明细")
            lines.append("=" * 80)
            lines.append("")
            df_cleaned_display = df_cleaned.copy()
            if "timestamp" in df_cleaned_display.columns:
                df_cleaned_display["timestamp"] = df_cleaned_display["timestamp"].dt.strftime("%Y-%m-%d %H:%M")
            lines.append(df_cleaned_display.to_csv(index=False))
        
        return "\n".join(lines)
    
    @staticmethod
    def _format_excel_report(
        df_results: pd.DataFrame,
        df_samples: pd.DataFrame,
        df_cleaned: pd.DataFrame,
        output: io.BytesIO
    ):
        with pd.ExcelWriter(output, engine="xlsxwriter") as writer:
            df_summary = ReportExporter._create_summary_sheet(df_results)
            df_summary.to_excel(writer, sheet_name="汇总概览", index=False)
            
            df_ranking = df_results[
                df_results["is_valid_for_ranking"] & 
                (~df_results["review_status"].isin(["pending", "appealed"]))
            ].copy()
            df_ranking = df_ranking.sort_values("compliance_rate", ascending=False)
            df_ranking_display = ReportExporter._format_results_for_display(df_ranking)
            df_ranking_display.to_excel(writer, sheet_name="合规排名", index=False)
            
            df_pending = df_results[~df_results["is_valid_for_ranking"]].copy()
            df_pending_display = ReportExporter._format_results_for_display(df_pending)
            df_pending_display.to_excel(writer, sheet_name="待复核批次", index=False)
            
            df_review = df_results[
                df_results["review_status"].isin(["pending", "appealed"])
            ].copy()
            df_review_display = ReportExporter._format_results_for_display(df_review)
            df_review_display.to_excel(writer, sheet_name="申诉复核", index=False)
            
            if df_cleaned is not None and len(df_cleaned) > 0:
                df_cleaned_display = df_cleaned.copy()
                if "timestamp" in df_cleaned_display.columns:
                    df_cleaned_display["timestamp"] = df_cleaned_display["timestamp"].dt.strftime("%Y-%m-%d %H:%M:%S")
                df_cleaned_display.to_excel(writer, sheet_name="剔除数据明细", index=False)
            
            workbook = writer.book
            header_format = workbook.add_format({
                'bold': True,
                'text_wrap': True,
                'valign': 'top',
                'fg_color': '#4472C4',
                'font_color': 'white',
                'border': 1
            })
            
            sheet_dataframes = {
                "汇总概览": df_summary,
                "合规排名": df_ranking_display,
                "待复核批次": df_pending_display,
                "申诉复核": df_review_display,
            }
            if df_cleaned is not None and len(df_cleaned) > 0:
                sheet_dataframes["剔除数据明细"] = df_cleaned_display
            
            for sheet_name, df_sheet in sheet_dataframes.items():
                if sheet_name in writer.sheets:
                    worksheet = writer.sheets[sheet_name]
                    worksheet.set_column(0, len(df_sheet.columns) - 1, 15)
                    for col_num, value in enumerate(df_sheet.columns):
                        worksheet.write(0, col_num, value, header_format)
    
    @staticmethod
    def _create_summary_sheet(df_results: pd.DataFrame) -> pd.DataFrame:
        total = len(df_results)
        ranking_mask = (
            df_results["is_valid_for_ranking"] & 
            (~df_results["review_status"].isin(["pending", "appealed"]))
        )
        valid_count = ranking_mask.sum()
        pending_sample_count = (~df_results["is_valid_for_ranking"]).sum()
        pending_review_count = df_results["review_status"].isin(["pending", "appealed"]).sum()
        avg_compliance = df_results[ranking_mask]["compliance_rate"].mean() if ranking_mask.sum() > 0 else 0
        over_temp_total = df_results[ranking_mask]["over_temp_duration_hours"].sum()
        under_temp_total = df_results[ranking_mask]["under_temp_duration_hours"].sum()
        
        summary_data = [
            ["统计项", "数值"],
            ["总运输批次", total],
            ["有效统计批次（样本≥3，排除复核中）", int(valid_count)],
            ["待复核批次（样本不足）", int(pending_sample_count)],
            ["申诉/复核中批次", int(pending_review_count)],
            ["平均合规率（仅有效批次）", f"{avg_compliance:.2f}%"],
            ["累计超温时长（小时，仅有效）", f"{over_temp_total:.2f}"],
            ["累计低温时长（小时，仅有效）", f"{under_temp_total:.2f}"]
        ]
        return pd.DataFrame(summary_data[1:], columns=summary_data[0])
    
    @staticmethod
    def _format_results_for_display(df: pd.DataFrame) -> pd.DataFrame:
        df_display = df.copy()
        if "signoff_time" in df_display.columns:
            df_display["signoff_time"] = df_display["signoff_time"].dt.strftime("%Y-%m-%d %H:%M")
        df_display["状态"] = df_display.apply(ReportExporter._get_status_label, axis=1)
        return df_display
    
    @staticmethod
    def _get_status_label(row: pd.Series) -> str:
        if not row.get("is_valid_for_ranking", True):
            return "待复核-样本不足"
        review_status = row.get("review_status", "none")
        if review_status == "pending":
            return "复核中"
        elif review_status == "appealed":
            return "申诉中"
        elif review_status == "resolved":
            return "已确认"
        else:
            compliance_rate = row.get("compliance_rate", 0)
            if compliance_rate >= 99:
                return "优秀"
            elif compliance_rate >= 95:
                return "良好"
            elif compliance_rate >= 90:
                return "合格"
            else:
                return "异常"
    
    @staticmethod
    def generate_filename(extension: str = "xlsx") -> str:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        return f"冷链合规报告_{timestamp}.{extension}"
