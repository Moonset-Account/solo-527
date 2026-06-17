from sqlalchemy import event
from sqlalchemy.engine import Engine
from datetime import datetime
import json

@event.listens_for(Engine, "connect")
def _set_sqlite_pragma(dbapi_connection, connection_record):
    if "sqlite" in str(dbapi_connection):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()


def check_sqlite_fallback() -> bool:
    import os
    return os.environ.get("USE_SQLITE", "1") == "1"


def _json_serializer(obj):
    if isinstance(obj, (datetime,)):
        return obj.isoformat()
    raise TypeError(f"Type {type(obj)} not serializable")


def json_dumps(obj):
    return json.dumps(obj, default=_json_serializer)
