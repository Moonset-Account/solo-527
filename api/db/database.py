import os
import psycopg2
import psycopg2.extras

DB_CONFIG = {
    "host": os.environ.get("DB_HOST", "localhost"),
    "port": int(os.environ.get("DB_PORT", 5432)),
    "dbname": os.environ.get("DB_NAME", "logistics_sort"),
    "user": os.environ.get("DB_USER", "postgres"),
    "password": os.environ.get("DB_PASSWORD", ""),
}

_pool = None


def get_conn():
    global _pool
    if _pool is None or _pool.closed:
        _pool = psycopg2.connect(**DB_CONFIG)
    if _pool.closed:
        _pool = psycopg2.connect(**DB_CONFIG)
    return _pool


def query(sql: str, params: tuple = None) -> list[dict]:
    conn = get_conn()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute(sql, params)
    rows = cur.fetchall()
    cur.close()
    conn.rollback()
    return [dict(r) for r in rows]


def execute(sql: str, params: tuple = None):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(sql, params)
    conn.commit()
    cur.close()
