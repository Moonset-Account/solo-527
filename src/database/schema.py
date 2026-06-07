from sqlalchemy import text
from .connection import get_engine


def create_hypertables():
    engine = get_engine()
    with engine.connect() as conn:
        conn.execute(text("""
            SELECT create_hypertable('orders', 'queue_start_time', 
                if_not_exists => TRUE, 
                chunk_time_interval => INTERVAL '1 day');
        """))
        conn.execute(text("""
            SELECT create_hypertable('reviews', 'create_time', 
                if_not_exists => TRUE, 
                chunk_time_interval => INTERVAL '7 days');
        """))
        conn.execute(text("""
            SELECT create_hypertable('window_outages', 'start_time', 
                if_not_exists => TRUE, 
                chunk_time_interval => INTERVAL '7 days');
        """))
        conn.commit()


def create_indexes():
    engine = get_engine()
    with engine.connect() as conn:
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_orders_hyper_window_time 
            ON orders (window_id, queue_start_time DESC);
        """))
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_orders_hyper_floor_slot 
            ON orders (floor, time_slot, queue_start_time DESC)
            WHERE is_abnormal = FALSE;
        """))
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_reviews_hyper_window 
            ON reviews (window_id, create_time DESC);
        """))
        conn.execute(text("""
            CREATE MATERIALIZED VIEW IF NOT EXISTS orders_5min
            WITH (timescaledb.continuous) AS
            SELECT
                time_bucket('5 minutes', queue_start_time) AS bucket,
                window_id,
                floor,
                time_slot,
                is_big_break,
                COUNT(*) AS order_count,
                AVG(wait_queue) AS avg_wait_queue,
                AVG(wait_payment) AS avg_wait_payment,
                AVG(wait_serve) AS avg_wait_serve,
                AVG(total_wait) AS avg_total_wait,
                PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY total_wait) AS p95_wait
            FROM orders
            WHERE is_abnormal = FALSE
            GROUP BY bucket, window_id, floor, time_slot, is_big_break
            WITH NO DATA;
        """))
        conn.commit()


def refresh_continuous_views():
    engine = get_engine()
    with engine.connect() as conn:
        conn.execute(text("""
            CALL refresh_continuous_aggregate('orders_5min', NULL, NULL);
        """))
        conn.commit()
