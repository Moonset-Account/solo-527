import os
import time
from datetime import datetime

from api.aggregation import (
    get_satisfaction_matrix,
    get_sales_trend,
    get_cancel_reasons,
    get_cost_margin,
    get_anomaly_summary,
)

EXPORT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "exports")
os.makedirs(EXPORT_DIR, exist_ok=True)


def export_to_excel(filters=None, filename=None):
    if filename is None:
        filename = f"canteen_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"

    filepath = os.path.join(EXPORT_DIR, filename)

    matrix_df = get_satisfaction_matrix(filters)
    trend_df = get_sales_trend(filters)
    cancel_df = get_cancel_reasons(filters)
    margin_df = get_cost_margin(filters)
    summary = get_anomaly_summary(filters)

    with pd.ExcelWriter(filepath, engine="openpyxl") as writer:
        if not matrix_df.empty:
            matrix_df.to_excel(writer, sheet_name="满意度矩阵", index=False)
        if not trend_df.empty:
            trend_df.to_excel(writer, sheet_name="销量趋势", index=False)
        if not cancel_df.empty:
            cancel_df.to_excel(writer, sheet_name="退餐原因", index=False)
        if not margin_df.empty:
            margin_df.to_excel(writer, sheet_name="成本毛利", index=False)

        anomaly_rows = []
        for a in summary.get("anomalies", []):
            anomaly_rows.append(a)
        if anomaly_rows:
            pd.DataFrame(anomaly_rows).to_excel(writer, sheet_name="异常摘要", index=False)

        stats_row = [summary.get("stats", {})]
        if stats_row and stats_row[0]:
            pd.DataFrame(stats_row).to_excel(writer, sheet_name="汇总统计", index=False)

    return filepath


import pandas as pd


def list_exports():
    if not os.path.exists(EXPORT_DIR):
        return []
    files = []
    for f in os.listdir(EXPORT_DIR):
        if f.endswith(".xlsx"):
            full = os.path.join(EXPORT_DIR, f)
            files.append({
                "filename": f,
                "size_kb": round(os.path.getsize(full) / 1024, 1),
                "created": datetime.fromtimestamp(os.path.getmtime(full)).isoformat(),
            })
    return sorted(files, key=lambda x: x["created"], reverse=True)
