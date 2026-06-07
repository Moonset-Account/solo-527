import pandas as pd
from typing import Dict, List, Any, Optional
from database.sample_data import get_all_data
from utils.helpers import handle_empty_data

_data_cache = None


def load_data() -> Dict[str, pd.DataFrame]:
    global _data_cache
    if _data_cache is None:
        _data_cache = get_all_data()
    return _data_cache


def reload_data():
    global _data_cache
    _data_cache = get_all_data()


def get_events(filters: Optional[Dict] = None) -> pd.DataFrame:
    data = load_data()
    df = data["events"].copy()
    
    if filters:
        if filters.get("start_date"):
            df = df[df["date"] >= pd.to_datetime(filters["start_date"]).date()]
        if filters.get("end_date"):
            df = df[df["date"] <= pd.to_datetime(filters["end_date"]).date()]
        if filters.get("line_ids"):
            df = df[df["line_id"].isin(filters["line_ids"])]
        if filters.get("equipment_ids"):
            df = df[df["equipment_id"].isin(filters["equipment_ids"])]
        if filters.get("shift_ids"):
            df = df[df["shift_id"].isin(filters["shift_ids"])]
        if filters.get("fault_codes"):
            df = df[df["fault_code"].isin(filters["fault_codes"])]
        if filters.get("breakdown_type") and filters["breakdown_type"] != "all":
            df = df[df["breakdown_type"] == filters["breakdown_type"]]
    
    return handle_empty_data(df)


def get_work_orders(filters: Optional[Dict] = None) -> pd.DataFrame:
    data = load_data()
    events = get_events(filters)
    
    if len(events) == 0:
        return pd.DataFrame()
    
    event_ids = events["event_id"].tolist()
    orders = data["work_orders"].copy()
    orders = orders[orders["event_id"].isin(event_ids)]
    
    if filters and filters.get("repair_persons"):
        orders = orders[orders["person_id"].isin(filters["repair_persons"])]
    
    return handle_empty_data(orders)


def get_spare_part_usages(filters: Optional[Dict] = None) -> pd.DataFrame:
    data = load_data()
    orders = get_work_orders(filters)
    
    if len(orders) == 0:
        return pd.DataFrame()
    
    order_ids = orders["order_id"].tolist()
    usages = data["spare_part_usages"].copy()
    usages = usages[usages["order_id"].isin(order_ids)]
    
    return handle_empty_data(usages)


def get_dimension_options(dimension: str) -> List[Dict[str, Any]]:
    data = load_data()
    
    if dimension == "line":
        return [{"label": row["line_name"], "value": row["line_id"]} 
                for _, row in data["production_lines"].iterrows()]
    elif dimension == "equipment":
        return [{"label": row["equipment_name"], "value": row["equipment_id"]} 
                for _, row in data["equipments"].iterrows()]
    elif dimension == "shift":
        return [{"label": row["shift_name"], "value": row["shift_id"]} 
                for _, row in data["shifts"].iterrows()]
    elif dimension == "fault_type":
        return [{"label": row["fault_name"], "value": row["fault_code"]} 
                for _, row in data["fault_types"].iterrows()]
    elif dimension == "repair_person":
        return [{"label": row["person_name"], "value": row["person_id"]} 
                for _, row in data["repair_persons"].iterrows()]
    elif dimension == "spare_part":
        return [{"label": row["part_name"], "value": row["part_id"]} 
                for _, row in data["spare_parts"].iterrows()]
    
    return []


def get_date_range() -> Dict[str, Any]:
    events = load_data()["events"]
    return {
        "min_date": events["date"].min(),
        "max_date": events["date"].max()
    }
