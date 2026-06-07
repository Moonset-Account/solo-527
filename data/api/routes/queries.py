import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import List, Optional

from data.cleaning.mock_data_generator import data_store
from data.cache.redis_client import cached, cache_client
from config.settings import settings


def _apply_filters(
    df: pd.DataFrame,
    risk_tags: Optional[List[str]] = None,
    queue_types: Optional[List[str]] = None,
    reviewers: Optional[List[str]] = None,
    shifts: Optional[List[str]] = None,
    sources: Optional[List[str]] = None,
    time_start: Optional[datetime] = None,
    time_end: Optional[datetime] = None,
    time_col: str = "enqueue_time",
) -> pd.DataFrame:
    filtered = df.copy()
    
    if time_start is not None:
        filtered = filtered[filtered[time_col] >= time_start]
    if time_end is not None:
        filtered = filtered[filtered[time_col] <= time_end]
    
    if risk_tags and len(risk_tags) > 0:
        tag_mask = filtered["machine_risk_tags"].apply(
            lambda tags: any(t in risk_tags for t in tags) if isinstance(tags, list) else False
        )
        filtered = filtered[tag_mask]
    
    if queue_types and len(queue_types) > 0:
        filtered = filtered[filtered["queue_type"].isin(queue_types)]
    
    if reviewers and len(reviewers) > 0:
        filtered = filtered[filtered["reviewer_id"].isin(reviewers)]
    
    if shifts and len(shifts) > 0:
        filtered = filtered[filtered["shift"].isin(shifts)]
    
    if sources and len(sources) > 0:
        filtered = filtered[filtered["source"].isin(sources)]
    
    return filtered


def _safe_calc_sla_breach(pending_df: pd.DataFrame, tp: datetime) -> int:
    if pending_df.empty:
        return 0
    
    breach_video_ids = set()
    
    for tag in ["色情", "暴力", "政治", "广告", "低俗"]:
        threshold = settings.sla_thresholds.get(tag, 3600)
        tag_mask = pending_df["machine_risk_tags"].apply(
            lambda t: tag in t if isinstance(t, list) else False
        )
        tag_pending = pending_df[tag_mask]
        
        if not tag_pending.empty:
            wait_time = (tp - tag_pending["enqueue_time"]).dt.total_seconds()
            breach_mask = wait_time > threshold
            breach_ids = tag_pending.loc[breach_mask, "video_id"].tolist()
            breach_video_ids.update(breach_ids)
    
    return len(breach_video_ids)


@cached("backlog", ttl=300)
def get_backlog_trend(
    time_start: datetime,
    time_end: datetime,
    granularity: str = "1h",
    risk_tags: Optional[List[str]] = None,
    queue_types: Optional[List[str]] = None,
    reviewers: Optional[List[str]] = None,
    shifts: Optional[List[str]] = None,
    sources: Optional[List[str]] = None,
) -> pd.DataFrame:
    review_logs = data_store.get_review_logs()
    filtered = _apply_filters(
        review_logs, risk_tags, queue_types, reviewers, shifts, sources, time_start, time_end
    )
    
    if filtered.empty:
        return pd.DataFrame(columns=["timestamp", "queue_name", "backlog_count", "sla_breach_count"])
    
    freq_map = {"1m": "1min", "5m": "5min", "1h": "1h", "1d": "1d"}
    freq = freq_map.get(granularity, "1h")
    
    time_points = pd.date_range(start=time_start, end=time_end, freq=freq)
    queues = filtered["queue_type"].unique()
    
    results = []
    for tp in time_points:
        pending = filtered[
            (filtered["enqueue_time"] <= tp) &
            ((filtered["reviewer_end_time"].isna()) | (filtered["reviewer_end_time"] > tp))
        ]
        
        for queue in queues:
            queue_pending = pending[pending["queue_type"] == queue]
            backlog_count = len(queue_pending)
            sla_breach = _safe_calc_sla_breach(queue_pending, tp)
            
            results.append({
                "timestamp": tp,
                "queue_name": queue,
                "backlog_count": int(backlog_count),
                "sla_breach_count": int(sla_breach),
            })
    
    return pd.DataFrame(results)


@cached("funnel", ttl=600)
def get_funnel_data(
    time_start: datetime,
    time_end: datetime,
    risk_tags: Optional[List[str]] = None,
    queue_types: Optional[List[str]] = None,
    reviewers: Optional[List[str]] = None,
    shifts: Optional[List[str]] = None,
    sources: Optional[List[str]] = None,
) -> pd.DataFrame:
    review_logs = data_store.get_review_logs()
    filtered = _apply_filters(
        review_logs, risk_tags, queue_types, reviewers, shifts, sources, time_start, time_end
    )
    
    if filtered.empty:
        return pd.DataFrame(columns=["step_name", "count", "avg_duration_seconds", "conversion_rate"])
    
    appeal_logs = data_store.get_appeal_logs()
    appeal_filtered = appeal_logs[
        (appeal_logs["appeal_time"] >= time_start) & (appeal_logs["appeal_time"] <= time_end)
    ]
    
    machine_count = len(filtered[filtered["queue_type"] == "机器初筛"])
    human_count = len(filtered[filtered["queue_type"].str.startswith("人审")])
    completed_count = len(filtered[filtered["reviewer_end_time"].notna()])
    taken_down = len(filtered[filtered["reviewer_decision"] == "下架"])
    appeal_count = len(appeal_filtered)
    appeal_success = len(appeal_filtered[appeal_filtered["appeal_result"] == "success"])
    
    steps = [
        ("机器初筛", machine_count, 45, 100.0),
        ("人审队列", human_count, 1200, (human_count / machine_count * 100) if machine_count else 0),
        ("审核完成", completed_count, 85, (completed_count / human_count * 100) if human_count else 0),
        ("下架处理", taken_down, 0, (taken_down / completed_count * 100) if completed_count else 0),
        ("发起申诉", appeal_count, 0, (appeal_count / taken_down * 100) if taken_down else 0),
        ("申诉成功", appeal_success, 0, (appeal_success / appeal_count * 100) if appeal_count else 0),
    ]
    
    return pd.DataFrame(
        steps,
        columns=["step_name", "count", "avg_duration_seconds", "conversion_rate"]
    )


@cached("workload", ttl=300)
def get_workload_data(
    time_start: datetime,
    time_end: datetime,
    risk_tags: Optional[List[str]] = None,
    queue_types: Optional[List[str]] = None,
    reviewers: Optional[List[str]] = None,
    shifts: Optional[List[str]] = None,
    sources: Optional[List[str]] = None,
) -> pd.DataFrame:
    review_logs = data_store.get_review_logs()
    filtered = _apply_filters(
        review_logs, risk_tags, queue_types, reviewers, shifts, sources, time_start, time_end
    )
    
    if filtered.empty:
        return pd.DataFrame(columns=[
            "reviewer_id", "reviewer_name", "shift",
            "processed_count", "avg_review_seconds", "current_backlog"
        ])
    
    reviewer_map = {r["id"]: r["name"] for r in data_store.get_reviewers()}
    completed = filtered[filtered["reviewer_end_time"].notna()]
    
    if completed.empty:
        return pd.DataFrame(columns=[
            "reviewer_id", "reviewer_name", "shift",
            "processed_count", "avg_review_seconds", "current_backlog"
        ])
    
    completed = completed.copy()
    completed["review_duration"] = (
        completed["reviewer_end_time"] - completed["reviewer_start_time"]
    ).dt.total_seconds()
    
    grouped = completed.groupby(["reviewer_id", "shift"]).agg(
        processed_count=("video_id", "count"),
        avg_review_seconds=("review_duration", "mean"),
    ).reset_index()
    
    pending = filtered[filtered["reviewer_end_time"].isna()]
    pending_counts = pending.groupby("reviewer_id").size().reset_index(name="current_backlog")
    
    result = grouped.merge(pending_counts, on="reviewer_id", how="left")
    result["current_backlog"] = result["current_backlog"].fillna(0).astype(int)
    result["avg_review_seconds"] = result["avg_review_seconds"].round(1)
    result["reviewer_name"] = result["reviewer_id"].map(reviewer_map).fillna(result["reviewer_id"])
    
    return result[[
        "reviewer_id", "reviewer_name", "shift",
        "processed_count", "avg_review_seconds", "current_backlog"
    ]]


@cached("appeal", ttl=1800)
def get_appeal_reversal_data(
    time_start: datetime,
    time_end: datetime,
    risk_tags: Optional[List[str]] = None,
    queue_types: Optional[List[str]] = None,
    reviewers: Optional[List[str]] = None,
    shifts: Optional[List[str]] = None,
    sources: Optional[List[str]] = None,
) -> pd.DataFrame:
    appeal_logs = data_store.get_appeal_logs()
    filtered = appeal_logs[
        (appeal_logs["appeal_time"] >= time_start) & (appeal_logs["appeal_time"] <= time_end)
    ]
    
    if sources and len(sources) > 0 and "source" in filtered.columns:
        filtered = filtered[filtered["source"].isin(sources)]
    if shifts and len(shifts) > 0 and "shift" in filtered.columns:
        filtered = filtered[filtered["shift"].isin(shifts)]
    if reviewers and len(reviewers) > 0 and "original_reviewer_id" in filtered.columns:
        filtered = filtered[filtered["original_reviewer_id"].isin(reviewers)]
    if queue_types and len(queue_types) > 0 and "original_queue_type" in filtered.columns:
        filtered = filtered[filtered["original_queue_type"].isin(queue_types)]
    
    if filtered.empty:
        return pd.DataFrame(columns=[
            "original_risk_tag", "appeal_total",
            "appeal_success", "appeal_failed", "reversal_rate"
        ])
    
    rows = []
    for _, row in filtered.iterrows():
        tags = row["original_risk_tags"] if isinstance(row["original_risk_tags"], list) else []
        for tag in tags:
            if risk_tags and tag not in risk_tags:
                continue
            rows.append({
                "original_risk_tag": tag,
                "success": 1 if row["appeal_result"] == "success" else 0,
                "failed": 0 if row["appeal_result"] == "success" else 1,
                "total": 1,
            })
    
    if not rows:
        return pd.DataFrame(columns=[
            "original_risk_tag", "appeal_total",
            "appeal_success", "appeal_failed", "reversal_rate"
        ])
    
    df = pd.DataFrame(rows)
    grouped = df.groupby("original_risk_tag").agg(
        appeal_total=("total", "sum"),
        appeal_success=("success", "sum"),
        appeal_failed=("failed", "sum"),
    ).reset_index()
    
    grouped["reversal_rate"] = (
        grouped["appeal_success"] / grouped["appeal_total"] * 100
    ).round(2)
    
    return grouped.sort_values("appeal_total", ascending=False)


@cached("summary", ttl=120)
def get_summary_data(time_start: datetime, time_end: datetime) -> dict:
    review_logs = data_store.get_review_logs()
    appeal_logs = data_store.get_appeal_logs()
    
    filtered_reviews = review_logs[
        (review_logs["enqueue_time"] >= time_start) & (review_logs["enqueue_time"] <= time_end)
    ]
    filtered_appeals = appeal_logs[
        (appeal_logs["appeal_time"] >= time_start) & (appeal_logs["appeal_time"] <= time_end)
    ]
    
    pending_now = review_logs[
        (review_logs["enqueue_time"] <= datetime.now()) &
        ((review_logs["reviewer_end_time"].isna()) | (review_logs["reviewer_end_time"] > datetime.now()))
    ]
    total_backlog = len(pending_now)
    
    completed = filtered_reviews[filtered_reviews["reviewer_end_time"].notna()]
    avg_review_seconds = 0
    if len(completed) > 0:
        durations = (completed["reviewer_end_time"] - completed["reviewer_start_time"]).dt.total_seconds()
        avg_review_seconds = float(durations.mean().round(1))
    
    sla_breach_count = _safe_calc_sla_breach(pending_now, datetime.now())
    sla_breach_rate = (sla_breach_count / total_backlog * 100) if total_backlog > 0 else 0
    
    appeal_total = len(filtered_appeals)
    appeal_success = len(filtered_appeals[filtered_appeals["appeal_result"] == "success"])
    appeal_reversal_rate = (appeal_success / appeal_total * 100) if appeal_total > 0 else 0
    
    alerts = []
    
    backlog_1h_ago_time = datetime.now() - timedelta(hours=1)
    backlog_1h_ago = len(review_logs[
        (review_logs["enqueue_time"] <= backlog_1h_ago_time) &
        ((review_logs["reviewer_end_time"].isna()) | (review_logs["reviewer_end_time"] > backlog_1h_ago_time))
    ])
    backlog_growth = ((total_backlog - backlog_1h_ago) / backlog_1h_ago * 100) if backlog_1h_ago > 0 else 0
    
    if backlog_growth > 20:
        alerts.append({
            "alert_type": "backlog_surge",
            "severity": "high",
            "title": "积压突增告警",
            "message": f"近1小时积压量增长{backlog_growth:.1f}%，超过20%阈值",
            "current_value": round(backlog_growth, 1),
            "threshold": 20.0,
            "trend": "up",
        })
    elif backlog_growth > 10:
        alerts.append({
            "alert_type": "backlog_warning",
            "severity": "medium",
            "title": "积压增长预警",
            "message": f"近1小时积压量增长{backlog_growth:.1f}%，接近告警阈值",
            "current_value": round(backlog_growth, 1),
            "threshold": 10.0,
            "trend": "up",
        })
    
    if sla_breach_rate > 15:
        alerts.append({
            "alert_type": "sla_breach",
            "severity": "high",
            "title": "SLA违规告警",
            "message": f"SLA违规率{sla_breach_rate:.1f}%，超过15%阈值",
            "current_value": round(sla_breach_rate, 1),
            "threshold": 15.0,
            "trend": "up",
        })
    elif sla_breach_rate > 8:
        alerts.append({
            "alert_type": "sla_warning",
            "severity": "medium",
            "title": "SLA违规预警",
            "message": f"SLA违规率{sla_breach_rate:.1f}%，需关注",
            "current_value": round(sla_breach_rate, 1),
            "threshold": 8.0,
            "trend": "up",
        })
    
    if appeal_reversal_rate > 45:
        alerts.append({
            "alert_type": "high_reversal",
            "severity": "medium",
            "title": "高申诉逆转率预警",
            "message": f"申诉逆转率{appeal_reversal_rate:.1f}%，机器初筛准确率可能下降",
            "current_value": round(appeal_reversal_rate, 1),
            "threshold": 45.0,
            "trend": "up",
        })
    
    return {
        "alerts": alerts,
        "total_backlog": int(total_backlog),
        "sla_breach_rate": round(sla_breach_rate, 1),
        "avg_review_seconds": avg_review_seconds,
        "appeal_reversal_rate": round(appeal_reversal_rate, 1),
    }
