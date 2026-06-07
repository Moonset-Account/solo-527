import os
import sys
import signal
import time
import subprocess

sys.path.insert(0, os.path.dirname(__file__))


def _kill_port(port):
    try:
        result = subprocess.run(["lsof", "-ti", f":{port}"], capture_output=True, text=True)
        pids = result.stdout.strip().split("\n")
        for pid in pids:
            pid = pid.strip()
            if pid:
                os.kill(int(pid), signal.SIGKILL)
                print(f"Killed process {pid} on port {port}")
    except Exception:
        pass


def _check_timescaledb():
    import socket
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.settimeout(2)
        s.connect(("localhost", 5432))
        s.close()
        return True
    except Exception:
        return False


if __name__ == "__main__":
    _kill_port(8051)
    _kill_port(5001)
    time.sleep(0.5)

    from backend.config import DB_ENGINE

    if DB_ENGINE == "timescaledb":
        try:
            from backend.db.database import engine as test_engine
            from sqlalchemy import text
            with test_engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            print("✅ TimescaleDB 连接成功")
        except Exception as e:
            print(f"⚠️  TimescaleDB 连接失败 ({e.__class__.__name__})，自动切换到 SQLite（开发模式）")
            os.environ["DB_ENGINE"] = "sqlite"
            import importlib
            import backend.db.database as db_mod
            import backend.config as cfg_mod
            importlib.reload(cfg_mod)
            importlib.reload(db_mod)

    from backend.db.database import init_db, engine
    from backend.app import create_app
    from backend.api.routes import api_bp
    from dash_app.app import app as dash_app, server as dash_server

    init_db()

    from backend.config import DB_URI
    print(f"数据库引擎: {engine.url}")

    db_path = os.path.join(os.path.dirname(__file__), "training_load.db")
    if DB_URI.startswith("sqlite") and (not os.path.exists(db_path) or os.path.getsize(db_path) < 1000):
        print("Seeding database...")
        from scripts.seed_data import seed
        seed()

    dash_server.register_blueprint(api_bp, url_prefix="/api")

    db_type = "TimescaleDB" if "postgresql" in str(engine.url) else "SQLite"
    print("=" * 60)
    print(f"  🏋️ 运动训练负荷可视化系统已启动")
    print(f"  数据库:    {db_type} ({engine.url})")
    print(f"  Dash前端:  http://localhost:8051")
    print(f"  Flask API: http://localhost:8051/api")
    print(f"  教练账号:  coach_wang / coach123")
    print(f"  队员账号:  张伟 / ath123")
    print("=" * 60)

    dash_app.run(host="0.0.0.0", port=8051, debug=False, use_reloader=False)
