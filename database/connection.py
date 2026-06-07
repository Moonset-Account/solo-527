import os
import pandas as pd
from contextlib import contextmanager
from dotenv import load_dotenv

load_dotenv()

DB_CONFIG = {
    "host": os.environ.get("DB_HOST", "localhost"),
    "port": os.environ.get("DB_PORT", "5432"),
    "database": os.environ.get("DB_NAME", "timescaledb"),
    "user": os.environ.get("DB_USER", "postgres"),
    "password": os.environ.get("DB_PASSWORD", "postgres"),
}

DB_AVAILABLE = False
try:
    import psycopg2
    from psycopg2.extras import RealDictCursor
    DB_AVAILABLE = True
except ImportError:
    psycopg2 = None


@contextmanager
def get_db_connection():
    if not DB_AVAILABLE:
        raise ConnectionError("psycopg2 not installed. Run: pip install psycopg2-binary")
    
    conn = None
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        yield conn
    finally:
        if conn:
            conn.close()


def execute_query(query: str, params: tuple = ()) -> pd.DataFrame:
    with get_db_connection() as conn:
        return pd.read_sql_query(query, conn, params=params)


def check_db_connection() -> dict:
    if not DB_AVAILABLE:
        return {
            "connected": False,
            "mode": "mock",
            "message": "Using in-memory mock data. Install psycopg2 and configure .env for TimescaleDB."
        }
    
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT 1;")
                cur.execute("SELECT extversion FROM pg_extension WHERE extname = 'timescaledb';")
                ts_version = cur.fetchone()
                return {
                    "connected": True,
                    "mode": "timescaledb",
                    "timescaledb_version": ts_version[0] if ts_version else None,
                    "message": "Connected to TimescaleDB successfully."
                }
    except Exception as e:
        return {
            "connected": False,
            "mode": "mock",
            "message": f"Failed to connect to TimescaleDB: {str(e)}. Using mock data."
        }


def get_events_from_db(filters: dict = None) -> pd.DataFrame:
    filters = filters or {}
    
    base_query = """
    SELECT 
        de.event_id,
        de.event_time,
        de.equipment_id,
        e.equipment_name,
        e.line_id,
        pl.line_name,
        de.fault_code,
        ft.fault_name,
        ft.fault_category,
        ft.fault_description,
        ft.fault_suggestion,
        de.shift_id,
        s.shift_name,
        de.duration_minutes,
        de.breakdown_type,
        de.description,
        DATE(de.event_time) as date
    FROM downtime_events de
    LEFT JOIN equipment e ON de.equipment_id = e.equipment_id
    LEFT JOIN production_lines pl ON e.line_id = pl.line_id
    LEFT JOIN fault_types ft ON de.fault_code = ft.fault_code
    LEFT JOIN shifts s ON de.shift_id = s.shift_id
    WHERE 1=1
    """
    
    where_clauses = []
    params = []
    
    if filters.get('start_date'):
        where_clauses.append("DATE(de.event_time) >= %s")
        params.append(filters['start_date'])
    if filters.get('end_date'):
        where_clauses.append("DATE(de.event_time) <= %s")
        params.append(filters['end_date'])
    if filters.get('line_ids'):
        placeholders = ",".join(["%s"] * len(filters['line_ids']))
        where_clauses.append(f"e.line_id IN ({placeholders})")
        params.extend(filters['line_ids'])
    if filters.get('equipment_ids'):
        placeholders = ",".join(["%s"] * len(filters['equipment_ids']))
        where_clauses.append(f"de.equipment_id IN ({placeholders})")
        params.extend(filters['equipment_ids'])
    if filters.get('shift_ids'):
        placeholders = ",".join(["%s"] * len(filters['shift_ids']))
        where_clauses.append(f"de.shift_id IN ({placeholders})")
        params.extend(filters['shift_ids'])
    if filters.get('fault_codes'):
        placeholders = ",".join(["%s"] * len(filters['fault_codes']))
        where_clauses.append(f"de.fault_code IN ({placeholders})")
        params.extend(filters['fault_codes'])
    if filters.get('breakdown_type') and filters['breakdown_type'] != 'all':
        where_clauses.append("de.breakdown_type = %s")
        params.append(filters['breakdown_type'])
    
    if where_clauses:
        base_query += " AND " + " AND ".join(where_clauses)
    
    return execute_query(base_query, tuple(params))


def get_work_orders_from_db(filters: dict = None) -> pd.DataFrame:
    filters = filters or {}
    
    event_ids = None
    if filters:
        events = get_events_from_db(filters)
        if not events.empty:
            event_ids = events['event_id'].tolist()
    
    if not event_ids:
        return pd.DataFrame()
    
    query = """
    SELECT 
        wo.order_id,
        wo.event_id,
        wo.event_time,
        wo.equipment_id,
        wo.fault_code,
        wo.report_time,
        wo.start_time,
        wo.complete_time,
        wo.repair_duration_minutes as repair_duration,
        wo.repair_person as person_name,
        wo.repair_action,
        wo.root_cause,
        wo.status
    FROM maintenance_work_orders wo
    WHERE wo.event_id IN (%s)
    """ % ",".join(["%s"] * len(event_ids))
    
    result = execute_query(query, tuple(event_ids))
    
    if filters.get('repair_persons'):
        result = result[result['person_name'].isin(filters['repair_persons'])]
    
    return result


def get_spare_parts_from_db(filters: dict = None) -> pd.DataFrame:
    filters = filters or {}
    
    work_orders = get_work_orders_from_db(filters)
    if work_orders.empty:
        return pd.DataFrame()
    
    order_ids = work_orders['order_id'].tolist()
    
    query = """
    SELECT 
        spu.usage_id,
        spu.order_id,
        spu.event_id,
        spu.event_time,
        spu.equipment_id,
        spu.fault_code,
        ft.fault_name,
        spu.part_id,
        sp.part_name,
        spu.quantity,
        spu.unit_price,
        spu.total_cost
    FROM spare_part_usages spu
    LEFT JOIN maintenance_work_orders wo ON spu.order_id = wo.order_id
    LEFT JOIN downtime_events de ON wo.event_id = de.event_id
    LEFT JOIN fault_types ft ON spu.fault_code = ft.fault_code
    LEFT JOIN spare_parts sp ON spu.part_id = sp.part_id
    WHERE spu.order_id IN (%s)
    """ % ",".join(["%s"] * len(order_ids))
    
    return execute_query(query, tuple(order_ids))
