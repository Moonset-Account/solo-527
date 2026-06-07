import pandas as pd
import numpy as np
from typing import Dict, List, Any, Optional
from services.data_service import get_events, get_work_orders, get_spare_part_usages
from utils.helpers import detect_outliers


def aggregate_downtime_by_dimension(dimensions: List[str], filters: Optional[Dict] = None) -> pd.DataFrame:
    df = get_events(filters)
    
    if len(df) == 0:
        return pd.DataFrame()
    
    group_cols = []
    for dim in dimensions:
        if dim == "line":
            group_cols.extend(["line_id", "line_name"])
        elif dim == "equipment":
            group_cols.extend(["equipment_id", "equipment_name"])
        elif dim == "shift":
            group_cols.extend(["shift_id", "shift_name"])
        elif dim == "fault_type":
            group_cols.extend(["fault_code", "fault_name", "fault_category"])
        elif dim == "breakdown_type":
            group_cols.append("breakdown_type")
        elif dim == "date":
            group_cols.append("date")
    
    group_cols = list(dict.fromkeys(group_cols))
    
    if not group_cols:
        return pd.DataFrame()
    
    aggregated = df.groupby(group_cols).agg(
        total_duration=("duration_minutes", "sum"),
        count=("event_id", "count"),
        planned_duration=("duration_minutes", lambda x: x[df.loc[x.index, "breakdown_type"] == "planned"].sum()),
        unplanned_duration=("duration_minutes", lambda x: x[df.loc[x.index, "breakdown_type"] == "unplanned"].sum()),
    ).reset_index()
    
    aggregated["avg_duration"] = aggregated["total_duration"] / aggregated["count"]
    aggregated["unplanned_ratio"] = aggregated["unplanned_duration"] / aggregated["total_duration"] * 100
    
    return aggregated.sort_values("total_duration", ascending=False)


def get_pareto_analysis(filters: Optional[Dict] = None) -> Dict[str, Any]:
    df = get_events(filters)
    
    if len(df) == 0:
        return {"items": [], "total_duration": 0, "pareto_threshold": 80, "top_items": []}
    
    fault_agg = df.groupby(["fault_code", "fault_name", "fault_description", "fault_suggestion"]).agg(
        duration=("duration_minutes", "sum"),
        count=("event_id", "count"),
        unplanned_duration=("duration_minutes", lambda x: x[df.loc[x.index, "breakdown_type"] == "unplanned"].sum()),
    ).reset_index()
    
    fault_agg = fault_agg.sort_values("duration", ascending=False).reset_index(drop=True)
    
    total_duration = fault_agg["duration"].sum()
    fault_agg["percentage"] = fault_agg["duration"] / total_duration * 100
    fault_agg["cumulative_percentage"] = fault_agg["percentage"].cumsum()
    
    top_items = []
    for _, row in fault_agg.iterrows():
        if row["cumulative_percentage"] <= 80:
            top_items.append(row["fault_name"])
        elif not top_items:
            top_items.append(row["fault_name"])
        else:
            break
    
    items = []
    for _, row in fault_agg.iterrows():
        items.append({
            "fault_code": row["fault_code"],
            "fault_name": row["fault_name"],
            "duration": float(row["duration"]),
            "count": int(row["count"]),
            "percentage": round(float(row["percentage"]), 2),
            "cumulative_percentage": round(float(row["cumulative_percentage"]), 2),
            "unplanned_duration": float(row["unplanned_duration"]),
            "description": row["fault_description"],
            "suggestion": row["fault_suggestion"],
        })
    
    return {
        "items": items,
        "total_duration": float(total_duration),
        "pareto_threshold": 80,
        "top_items": top_items,
    }


def get_line_comparison(filters: Optional[Dict] = None) -> Dict[str, Any]:
    lines = aggregate_downtime_by_dimension(["line"], filters)
    
    if len(lines) == 0:
        return {"lines": [], "heatmap_data": []}
    
    line_shift = aggregate_downtime_by_dimension(["line", "shift"], filters)
    
    lines_data = []
    for _, row in lines.iterrows():
        lines_data.append({
            "line_id": int(row["line_id"]),
            "line_name": row["line_name"],
            "total_duration": float(row["total_duration"]),
            "count": int(row["count"]),
            "avg_duration": round(float(row["avg_duration"]), 1),
            "planned_duration": float(row["planned_duration"]),
            "unplanned_duration": float(row["unplanned_duration"]),
            "unplanned_ratio": round(float(row["unplanned_ratio"]), 1),
        })
    
    heatmap_data = []
    if len(line_shift) > 0:
        for _, row in line_shift.iterrows():
            heatmap_data.append({
                "line_name": row["line_name"],
                "shift_name": row["shift_name"],
                "value": float(row["total_duration"]),
            })
    
    return {
        "lines": lines_data,
        "heatmap_data": heatmap_data,
    }


def get_maintenance_efficiency(filters: Optional[Dict] = None) -> Dict[str, Any]:
    events = get_events(filters)
    orders = get_work_orders(filters)
    
    if len(events) == 0 or len(orders) == 0:
        return {"mttr": 0, "mtbf": 0, "by_person": [], "duration_distribution": []}
    
    mttr = orders["repair_duration"].mean()
    
    unplanned = events[events["breakdown_type"] == "unplanned"].sort_values("start_time")
    if len(unplanned) >= 2:
        unplanned["next_start"] = unplanned["start_time"].shift(-1)
        unplanned["interval"] = (unplanned["next_start"] - unplanned["end_time"]).dt.total_seconds() / 3600
        mtbf = unplanned["interval"].dropna().mean()
    else:
        mtbf = 0
    
    by_person = orders.groupby(["person_id", "person_name", "skill_level", "team"]).agg(
        mttr=("repair_duration", "mean"),
        completed_count=("order_id", "count"),
        avg_labor_cost=("labor_cost", "mean"),
    ).reset_index()
    
    persons_data = []
    for _, row in by_person.iterrows():
        persons_data.append({
            "person_id": row["person_id"],
            "person_name": row["person_name"],
            "skill_level": row["skill_level"],
            "team": row["team"],
            "mttr": round(float(row["mttr"]), 1),
            "completed_count": int(row["completed_count"]),
            "avg_cost": round(float(row["avg_labor_cost"]), 2),
        })
    
    bins = [0, 15, 30, 60, 120, 240, float("inf")]
    labels = ["0-15分钟", "15-30分钟", "30-60分钟", "1-2小时", "2-4小时", "4小时以上"]
    orders["duration_bucket"] = pd.cut(orders["repair_duration"], bins=bins, labels=labels, right=False)
    dist = orders["duration_bucket"].value_counts().sort_index()
    
    distribution = []
    for label in labels:
        distribution.append({
            "bucket": label,
            "count": int(dist.get(label, 0)),
        })
    
    return {
        "mttr": round(float(mttr), 1),
        "mtbf": round(float(mtbf), 2),
        "by_person": persons_data,
        "duration_distribution": distribution,
    }


def get_spare_part_correlation(filters: Optional[Dict] = None) -> Dict[str, Any]:
    usages = get_spare_part_usages(filters)
    events = get_events(filters)
    
    if len(usages) == 0:
        return {"matrix": [], "top_correlations": [], "cost_analysis": []}
    
    fault_info = events[["fault_code", "fault_name"]].drop_duplicates().set_index("fault_code")["fault_name"].to_dict()
    usages["fault_name"] = usages["fault_code"].map(fault_info).fillna(usages["fault_code"])
    
    fault_part = usages.groupby(["fault_code", "fault_name", "part_name"]).agg(
        usage_count=("usage_id", "count"),
        total_cost=("total_cost", "sum"),
        total_quantity=("quantity", "sum"),
    ).reset_index()
    
    fault_totals = usages.groupby("fault_code").agg(
        total_events=("order_id", "nunique"),
    ).reset_index().set_index("fault_code")["total_events"].to_dict()
    
    part_totals = usages.groupby("part_name").agg(
        total_usages=("usage_id", "count"),
    ).reset_index().set_index("part_name")["total_usages"].to_dict()
    
    total_usages = len(usages)
    
    matrix = []
    for _, row in fault_part.iterrows():
        fault_events = fault_totals.get(row["fault_code"], 1)
        part_used = part_totals.get(row["part_name"], 1)
        
        support = row["usage_count"] / total_usages
        confidence = row["usage_count"] / fault_events
        lift = confidence / (part_used / total_usages) if part_used > 0 else 0
        
        correlation_score = min(1.0, (support * confidence * lift) ** 0.5)
        
        matrix.append({
            "fault_code": row["fault_code"],
            "fault_name": row["fault_name"],
            "part_name": row["part_name"],
            "usage_count": int(row["usage_count"]),
            "total_cost": float(row["total_cost"]),
            "total_quantity": int(row["total_quantity"]),
            "correlation_score": round(float(correlation_score), 2),
        })
    
    matrix_sorted = sorted(matrix, key=lambda x: x["correlation_score"], reverse=True)
    top_correlations = matrix_sorted[:5]
    
    cost_by_fault = usages.groupby(["fault_code", "fault_name", "part_name"]).agg(
        total_cost=("total_cost", "sum"),
    ).reset_index()
    
    cost_analysis = []
    for _, row in cost_by_fault.iterrows():
        cost_analysis.append({
            "fault_name": row["fault_name"],
            "part_name": row["part_name"],
            "cost": float(row["total_cost"]),
        })
    
    return {
        "matrix": matrix,
        "top_correlations": top_correlations,
        "cost_analysis": cost_analysis,
    }


def get_kpi_summary(filters: Optional[Dict] = None) -> Dict[str, Any]:
    events = get_events(filters)
    orders = get_work_orders(filters)
    
    if len(events) == 0:
        return {
            "total_duration": 0,
            "total_count": 0,
            "unplanned_duration": 0,
            "unplanned_count": 0,
            "unplanned_ratio": 0,
            "avg_duration": 0,
            "mttr": 0,
            "mtbf": 0,
            "availability": 0,
        }
    
    total_duration = events["duration_minutes"].sum()
    total_count = len(events)
    unplanned_duration = events[events["breakdown_type"] == "unplanned"]["duration_minutes"].sum()
    unplanned_count = len(events[events["breakdown_type"] == "unplanned"])
    
    unplanned_ratio = unplanned_duration / total_duration * 100 if total_duration > 0 else 0
    avg_duration = total_duration / total_count if total_count > 0 else 0
    
    mttr = orders["repair_duration"].mean() if len(orders) > 0 else 0
    
    unplanned = events[events["breakdown_type"] == "unplanned"].sort_values("start_time")
    if len(unplanned) >= 2:
        unplanned["next_start"] = unplanned["start_time"].shift(-1)
        unplanned["interval"] = (unplanned["next_start"] - unplanned["end_time"]).dt.total_seconds() / 3600
        mtbf = unplanned["interval"].dropna().mean()
    else:
        mtbf = 0
    
    date_range = events["date"].max() - events["date"].min()
    total_days = max(1, date_range.days + 1)
    planned_minutes = total_days * 24 * 60 * 0.7
    availability = max(0, (planned_minutes - unplanned_duration) / planned_minutes * 100)
    
    return {
        "total_duration": float(total_duration),
        "total_count": int(total_count),
        "unplanned_duration": float(unplanned_duration),
        "unplanned_count": int(unplanned_count),
        "unplanned_ratio": round(float(unplanned_ratio), 1),
        "avg_duration": round(float(avg_duration), 1),
        "mttr": round(float(mttr), 1),
        "mtbf": round(float(mtbf), 2),
        "availability": round(float(availability), 2),
    }


def get_trend_data(filters: Optional[Dict] = None) -> pd.DataFrame:
    events = get_events(filters)
    
    if len(events) == 0:
        return pd.DataFrame()
    
    daily = events.groupby(["date", "breakdown_type"]).agg(
        duration=("duration_minutes", "sum"),
        count=("event_id", "count"),
    ).reset_index()
    
    daily_pivot = daily.pivot_table(
        index="date",
        columns="breakdown_type",
        values="duration",
        fill_value=0
    ).reset_index()
    
    for col in ["planned", "unplanned"]:
        if col not in daily_pivot.columns:
            daily_pivot[col] = 0
    
    daily_pivot["total"] = daily_pivot.get("planned", 0) + daily_pivot.get("unplanned", 0)
    
    return daily_pivot.sort_values("date")
