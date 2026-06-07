import pandas as pd
import numpy as np
from typing import Dict, Any, List

CALIBER_NOTES = {
    "total_duration": "总停机时长：设备停机状态的总分钟数，包含计划检修和突发停机",
    "unplanned_duration": "突发停机时长：非计划内的故障停机分钟数，用于考核设备可靠性",
    "planned_duration": "计划检修时长：预防性维护、定期检修的分钟数，不计入故障考核",
    "mttr": "平均修复时间(MTTR)：从报修到修复完成的平均时间，单位分钟",
    "mtbf": "平均故障间隔(MTBF)：两次突发故障之间的平均运行时间，单位小时",
    "availability": "设备可用率：(总运行时间/计划运行时间)×100%",
    "pareto": "Pareto分析：按停机时长降序排列，累计占比80%的故障类型为重点改善对象",
    "breakdown_type": "停机类型划分：planned=计划检修，unplanned=突发故障，统计时默认分离展示"
}

DIMENSION_CONFIG = {
    "line": {"label": "产线", "column": "line_name", "color_field": "line_id"},
    "equipment": {"label": "设备", "column": "equipment_name", "color_field": "equipment_id"},
    "shift": {"label": "班次", "column": "shift_name", "color_field": "shift_id"},
    "fault_type": {"label": "故障类型", "column": "fault_name", "color_field": "fault_code"},
    "repair_person": {"label": "维修人员", "column": "person_name", "color_field": "person_id"}
}

COLORS = {
    "primary": "#1E3A5F",
    "unplanned": "#FF6B35",
    "planned": "#2ECC71",
    "warning": "#F39C12",
    "danger": "#E74C3C",
    "success": "#27AE60",
    "text": "#2C3E50",
    "background": "#ECF0F1",
    "card": "#FFFFFF",
    "lines": ["#1E3A5F", "#FF6B35", "#2ECC71", "#3498DB", "#9B59B6", "#F39C12", "#1ABC9C", "#E74C3C"]
}


def handle_empty_data(df: pd.DataFrame) -> pd.DataFrame:
    if df is None or len(df) == 0:
        return pd.DataFrame()
    
    df = df.copy()
    for col in ["line_name", "equipment_name", "shift_name", "fault_name", "person_name"]:
        if col in df.columns:
            df[col] = df[col].fillna("未分类")
    
    if "duration_minutes" in df.columns:
        df["duration_minutes"] = df["duration_minutes"].fillna(0)
        df = df[df["duration_minutes"] >= 0]
    
    return df


def format_duration(minutes: float) -> str:
    if pd.isna(minutes) or minutes < 0:
        return "0分钟"
    hours = int(minutes // 60)
    mins = int(minutes % 60)
    if hours > 0:
        return f"{hours}小时{mins}分钟"
    return f"{mins}分钟"


def detect_outliers(values: List[float]) -> List[bool]:
    if len(values) < 4:
        return [False] * len(values)
    arr = np.array(values)
    q1 = np.percentile(arr, 25)
    q3 = np.percentile(arr, 75)
    iqr = q3 - q1
    upper_bound = q3 + 3 * iqr
    return [bool(v > upper_bound) for v in arr]


def get_caliber_note(metric_name: str) -> str:
    return CALIBER_NOTES.get(metric_name, "")
