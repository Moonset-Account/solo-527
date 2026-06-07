"""
指标计算模块
计算各种等待时间指标
"""
import pandas as pd
import numpy as np
from typing import Dict, Optional
from data_models import WAIT_PAIRS


def calculate_wait_times(df: pd.DataFrame) -> pd.DataFrame:
    """计算各环节等待时间（分钟）"""
    df = df.copy()
    
    for start_col, end_col, name in WAIT_PAIRS:
        if start_col in df.columns and end_col in df.columns:
            col_name = f"wait_{name.replace('→', '_')}"
            df[col_name] = (df[end_col] - df[start_col]).dt.total_seconds() / 60.0
            df[col_name] = df[col_name].round(2)
    
    if "consult_start_time" in df.columns and "consult_end_time" in df.columns:
        df["consult_duration"] = (df["consult_end_time"] - df["consult_start_time"]).dt.total_seconds() / 60.0
        df["consult_duration"] = df["consult_duration"].round(2)
    
    wait_cols = [f"wait_{p[2].replace('→', '_')}" for p in WAIT_PAIRS if f"wait_{p[2].replace('→', '_')}" in df.columns]
    df["total_wait_time"] = df[wait_cols].sum(axis=1).round(2)
    
    return df


def filter_dataframe(df: pd.DataFrame, 
                     depts: Optional[list] = None,
                     doctors: Optional[list] = None,
                     time_slots: Optional[list] = None,
                     patient_types: Optional[list] = None,
                     date_range: Optional[tuple] = None,
                     exclude_anomalies: bool = False) -> pd.DataFrame:
    """多维度筛选数据"""
    filtered = df.copy()
    
    if depts and len(depts) > 0:
        filtered = filtered[filtered["dept_name"].isin(depts)]
    
    if doctors and len(doctors) > 0:
        filtered = filtered[filtered["doctor_name"].isin(doctors)]
    
    if time_slots and len(time_slots) > 0:
        filtered = filtered[filtered["time_slot"].isin(time_slots)]
    
    if patient_types and len(patient_types) > 0:
        filtered = filtered[filtered["patient_type"].isin(patient_types)]
    
    if date_range and date_range[0] and date_range[1]:
        start_date = pd.to_datetime(date_range[0])
        end_date = pd.to_datetime(date_range[1]) + pd.Timedelta(days=1)
        filtered = filtered[
            (filtered["reg_time"] >= start_date) & 
            (filtered["reg_time"] < end_date)
        ]
    
    if exclude_anomalies:
        filtered = filtered[~filtered["is_anomaly"]]
    
    return filtered


def compute_summary_metrics(df: pd.DataFrame) -> Dict:
    """计算汇总指标"""
    metrics = {}
    
    wait_cols = [col for col in df.columns if col.startswith("wait_")]
    for col in wait_cols:
        valid_data = df[col].dropna()
        if len(valid_data) > 0:
            metrics[col] = {
                "count": len(valid_data),
                "mean": round(valid_data.mean(), 2),
                "median": round(valid_data.median(), 2),
                "p95": round(valid_data.quantile(0.95), 2),
                "max": round(valid_data.max(), 2),
                "min": round(valid_data.min(), 2)
            }
    
    return metrics


def detect_anomalies(df: pd.DataFrame, threshold_p99: float = 99.0) -> pd.DataFrame:
    """自动检测异常点（基于百分位数）"""
    df = df.copy()
    wait_cols = [col for col in df.columns if col.startswith("wait_")]
    
    auto_anomaly = pd.Series([False] * len(df), index=df.index)
    
    for col in wait_cols:
        if col in df.columns:
            threshold = df[col].quantile(threshold_p99 / 100.0)
            auto_anomaly = auto_anomaly | (df[col] > threshold)
    
    df["auto_anomaly"] = auto_anomaly
    return df


def get_dept_comparison(df: pd.DataFrame) -> pd.DataFrame:
    """获取科室对比数据"""
    wait_cols = [col for col in df.columns if col.startswith("wait_")]
    agg_dict = {col: ["mean", "count"] for col in wait_cols}
    agg_dict["visit_id"] = "count"
    
    dept_stats = df.groupby("dept_name").agg(agg_dict).round(2)
    dept_stats.columns = ['_'.join(col).strip() for col in dept_stats.columns.values]
    dept_stats = dept_stats.reset_index()
    
    return dept_stats


def get_hourly_trend(df: pd.DataFrame) -> pd.DataFrame:
    """获取日内趋势数据（按小时）"""
    df = df.copy()
    df["hour"] = df["reg_time"].dt.hour
    
    wait_cols = [col for col in df.columns if col.startswith("wait_")]
    hourly = df.groupby("hour")[wait_cols].mean().round(2).reset_index()
    
    return hourly


def get_sankey_data(df: pd.DataFrame) -> Dict:
    """准备桑基图数据"""
    nodes = ["挂号", "签到", "分诊", "叫号", "就诊", "缴费", "取药", "离开/流失"]
    node_indices = {name: i for i, name in enumerate(nodes)}
    
    links = []
    
    total = len(df)
    if total == 0:
        return {"nodes": nodes, "links": []}
    
    transitions = [
        ("挂号", "签到", df["checkin_time"].notna().sum()),
        ("签到", "分诊", df["triage_time"].notna().sum()),
        ("分诊", "叫号", df["call_time"].notna().sum()),
        ("叫号", "就诊", df["consult_start_time"].notna().sum()),
        ("就诊", "缴费", df["payment_time"].notna().sum()),
        ("缴费", "取药", df["medicine_time"].notna().sum()),
    ]
    
    for source, target, count in transitions:
        if count > 0:
            links.append({
                "source": node_indices[source],
                "target": node_indices[target],
                "value": count
            })
    
    if df["payment_time"].isna().sum() > 0:
        links.append({
            "source": node_indices["就诊"],
            "target": node_indices["离开/流失"],
            "value": df["payment_time"].isna().sum()
        })
    
    if df["medicine_time"].isna().sum() > 0:
        links.append({
            "source": node_indices["缴费"],
            "target": node_indices["离开/流失"],
            "value": df["medicine_time"].isna().sum()
        })
    
    return {"nodes": nodes, "links": links}
