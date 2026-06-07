import os
import pandas as pd
from typing import Dict, List, Any, Optional

from database.sample_data import get_all_data
from utils.helpers import handle_empty_data

DATA_SOURCE = os.environ.get("DATA_SOURCE", "mock")

_data_cache = None
_db_status = None


def get_data_source_mode() -> str:
    global _db_status
    if _db_status is None:
        try:
            from database.connection import check_db_connection
            _db_status = check_db_connection()
            if _db_status["connected"]:
                return "timescaledb"
        except Exception:
            pass
        _db_status = {"mode": "mock"}
    return _db_status.get("mode", "mock")


def load_data() -> Dict[str, pd.DataFrame]:
    global _data_cache
    if _data_cache is None:
        _data_cache = get_all_data()
    return _data_cache


def reload_data():
    global _data_cache, _db_status
    _data_cache = None
    _db_status = None


def _get_events_mock(filters: Optional[Dict] = None) -> pd.DataFrame:
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


def get_events(filters: Optional[Dict] = None) -> pd.DataFrame:
    mode = get_data_source_mode()
    
    if mode == "timescaledb":
        try:
            from database.connection import get_events_from_db
            df = get_events_from_db(filters)
            if not df.empty:
                if "date" in df.columns and isinstance(df["date"].iloc[0], str):
                    df["date"] = pd.to_datetime(df["date"]).dt.date
            return handle_empty_data(df)
        except Exception:
            pass
    
    return _get_events_mock(filters)


def _get_work_orders_mock(filters: Optional[Dict] = None) -> pd.DataFrame:
    data = load_data()
    events = get_events(filters)
    
    if len(events) == 0:
        return pd.DataFrame()
    
    event_ids = events["event_id"].tolist()
    orders = data["work_orders"].copy()
    orders = orders[orders["event_id"].isin(event_ids)]
    
    if filters and filters.get("repair_persons"):
        persons = filters["repair_persons"]
        if persons and isinstance(persons, list) and persons[0].startswith("P"):
            orders = orders[orders["person_id"].isin(persons)]
        else:
            orders = orders[orders["person_name"].isin(persons)]
    
    return handle_empty_data(orders)


def get_work_orders(filters: Optional[Dict] = None) -> pd.DataFrame:
    mode = get_data_source_mode()
    
    if mode == "timescaledb":
        try:
            from database.connection import get_work_orders_from_db
            df = get_work_orders_from_db(filters)
            return handle_empty_data(df)
        except Exception:
            pass
    
    return _get_work_orders_mock(filters)


def _get_spare_part_usages_mock(filters: Optional[Dict] = None) -> pd.DataFrame:
    data = load_data()
    orders = get_work_orders(filters)
    
    if len(orders) == 0:
        return pd.DataFrame()
    
    order_ids = orders["order_id"].tolist()
    usages = data["spare_part_usages"].copy()
    usages = usages[usages["order_id"].isin(order_ids)]
    
    if filters and filters.get("part_names"):
        usages = usages[usages["part_name"].isin(filters["part_names"])]
    
    return handle_empty_data(usages)


def get_spare_part_usages(filters: Optional[Dict] = None) -> pd.DataFrame:
    mode = get_data_source_mode()
    
    if mode == "timescaledb":
        try:
            from database.connection import get_spare_parts_from_db
            df = get_spare_parts_from_db(filters)
            return handle_empty_data(df)
        except Exception:
            pass
    
    return _get_spare_part_usages_mock(filters)


def get_dimension_options(dimension: str) -> List[Dict[str, Any]]:
    mode = get_data_source_mode()
    
    if mode == "timescaledb":
        try:
            options = _get_dimension_options_db(dimension)
            if options:
                return options
        except Exception:
            pass
    
    return _get_dimension_options_mock(dimension)


def _get_dimension_options_mock(dimension: str) -> List[Dict[str, Any]]:
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


def _get_dimension_options_db(dimension: str) -> List[Dict[str, Any]]:
    from database.connection import execute_query
    
    queries = {
        "line": "SELECT line_id as value, line_name as label FROM production_lines ORDER BY line_id",
        "equipment": "SELECT equipment_id as value, equipment_name as label FROM equipment ORDER BY equipment_name",
        "shift": "SELECT shift_id as value, shift_name as label FROM shifts ORDER BY shift_id",
        "fault_type": "SELECT fault_code as value, fault_name as label FROM fault_types ORDER BY fault_name",
        "repair_person": "SELECT DISTINCT repair_person as value, repair_person as label FROM maintenance_work_orders ORDER BY repair_person",
        "spare_part": "SELECT part_id as value, part_name as label FROM spare_parts ORDER BY part_name",
    }
    
    if dimension not in queries:
        return []
    
    try:
        df = execute_query(queries[dimension])
        return df.to_dict('records')
    except Exception:
        return []


def get_date_range() -> Dict[str, Any]:
    mode = get_data_source_mode()
    
    if mode == "timescaledb":
        try:
            from database.connection import execute_query
            df = execute_query("SELECT MIN(DATE(event_time)) as min_date, MAX(DATE(event_time)) as max_date FROM downtime_events")
            if not df.empty and df.iloc[0]["min_date"] is not None:
                return {
                    "min_date": df.iloc[0]["min_date"],
                    "max_date": df.iloc[0]["max_date"]
                }
        except Exception:
            pass
    
    events = load_data()["events"]
    return {
        "min_date": events["date"].min(),
        "max_date": events["date"].max()
    }
