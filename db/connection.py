import os
import logging
import pandas as pd
from config import DATABASE_URL

logger = logging.getLogger(__name__)

_engine = None
_db_available = None


def get_engine():
    global _engine, _db_available
    if _db_available is not None:
        return _engine if _db_available else None

    try:
        from sqlalchemy import create_engine, text
        _engine = create_engine(DATABASE_URL, pool_size=5, max_overflow=10, pool_pre_ping=True)
        with _engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        _db_available = True
        logger.info("TimescaleDB connection established: %s", DATABASE_URL.split("@")[-1])
        return _engine
    except Exception as e:
        _db_available = False
        logger.warning("TimescaleDB not available (%s), falling back to CSV", e)
        return None


def is_db_available():
    return get_engine() is not None


def query_to_df(sql, params=None):
    engine = get_engine()
    if engine is None:
        return pd.DataFrame()
    try:
        from sqlalchemy import text
        with engine.connect() as conn:
            df = pd.read_sql(text(sql), conn, params=params)
        return df
    except Exception as e:
        logger.warning("DB query failed (%s), returning empty DataFrame", e)
        return pd.DataFrame()


def refresh_materialized_view():
    engine = get_engine()
    if engine is None:
        return False
    try:
        from sqlalchemy import text
        with engine.connect() as conn:
            conn.execute(text("REFRESH MATERIALIZED VIEW CONCURRENTLY mv_dish_daily_stats"))
            conn.commit()
        logger.info("Refreshed mv_dish_daily_stats")
        return True
    except Exception as e:
        logger.warning("Failed to refresh materialized view: %s", e)
        return False
