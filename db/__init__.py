import psycopg2
from psycopg2.extras import RealDictCursor
from contextlib import contextmanager
from config import DATABASE_URL, DEMO_MODE


_connection_pool = []


def get_connection():
    if DEMO_MODE:
        return None
    conn = psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)
    return conn


@contextmanager
def get_db():
    conn = get_connection()
    try:
        if conn:
            yield conn
            conn.commit()
        else:
            yield None
    except Exception:
        if conn:
            conn.rollback()
        raise
    finally:
        if conn:
            conn.close()


def execute_query(query, params=None):
    with get_db() as conn:
        if conn is None:
            return []
        with conn.cursor() as cur:
            cur.execute(query, params)
            if cur.description:
                return [dict(row) for row in cur.fetchall()]
            return []
