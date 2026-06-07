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
    except Exception:
        pass


def _start_timescaledb_docker():
    try:
        result = subprocess.run(["docker", "ps", "-q", "-f", "name=timescaledb"],
                                capture_output=True, text=True, timeout=5)
        if result.stdout.strip():
            return True

        result = subprocess.run(
            ["docker", "run", "-d", "--name", "timescaledb",
             "-p", "5433:5432",
             "-e", "POSTGRES_USER=training",
             "-e", "POSTGRES_PASSWORD=training",
             "-e", "POSTGRES_DB=training_load",
             "timescale/timescaledb:latest-pg14"],
            capture_output=True, text=True, timeout=120
        )
        if result.returncode == 0:
            print("  TimescaleDB Docker 容器已启动 (端口 5433)")
            time.sleep(3)
            return True
    except Exception:
        pass
    return False


def _ensure_local_pg():
    try:
        import psycopg2
        conn = psycopg2.connect(
            host="localhost", port=5432, dbname="postgres",
            user=os.environ.get("PG_SUPERUSER", os.environ.get("USER", "postgres"))
        )
        conn.autocommit = True
        cur = conn.cursor()

        cur.execute("SELECT 1 FROM pg_roles WHERE rolname='training'")
        if not cur.fetchone():
            cur.execute("CREATE ROLE training WITH LOGIN PASSWORD 'training'")
            print("  创建 PostgreSQL 角色: training")

        cur.execute("SELECT 1 FROM pg_database WHERE datname='training_load'")
        if not cur.fetchone():
            cur.execute("CREATE DATABASE training_load OWNER training")
            print("  创建数据库: training_load")

        cur.close()
        conn.close()
        return True
    except Exception as e:
        print(f"  本地 PostgreSQL 检查: {e}")
        return False


if __name__ == "__main__":
    _kill_port(8051)
    _kill_port(5001)
    time.sleep(0.5)

    from backend.config import DB_ENGINE

    using_timescaledb = False

    if DB_ENGINE == "timescaledb":
        print("正在配置 TimescaleDB...")

        docker_ok = _start_timescaledb_docker()
        if docker_ok:
            os.environ["TIMESCALEDB_URI"] = "postgresql://training:training@localhost:5433/training_load"
        else:
            print("  Docker TimescaleDB 不可用，尝试本地 PostgreSQL + TimescaleDB 扩展")
            _ensure_local_pg()

        try:
            os.environ["DB_ENGINE"] = "timescaledb"
            import importlib
            import backend.config as cfg_mod
            import backend.db.database as db_mod
            importlib.reload(cfg_mod)
            importlib.reload(db_mod)

            from backend.db.database import engine as test_engine
            from sqlalchemy import text
            with test_engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            conn_uri = str(test_engine.url)
            print(f"✅ 数据库连接成功: {conn_uri}")

            try:
                with test_engine.connect() as conn:
                    conn.execute(text("CREATE EXTENSION IF NOT EXISTS timescaledb"))
                    conn.commit()
                print("  TimescaleDB 扩展已激活")
            except Exception:
                print("  TimescaleDB 扩展不可用，使用普通 PostgreSQL 表（功能完整）")

            using_timescaledb = True
        except Exception as e:
            print(f"⚠️  PostgreSQL 连接失败 ({e.__class__.__name__}: {e})")
            print("   自动切换到 SQLite（开发模式）")
            os.environ["DB_ENGINE"] = "sqlite"
            import importlib
            import backend.config as cfg_mod2
            import backend.db.database as db_mod2
            importlib.reload(cfg_mod2)
            importlib.reload(db_mod2)

    from backend.db.database import init_db, engine, SessionLocal
    from backend.models.schema import User
    from backend.app import create_app
    from backend.api.routes import api_bp
    from dash_app.app import app as dash_app, server as dash_server

    init_db()

    need_seed = False
    if using_timescaledb:
        try:
            s = SessionLocal()
            count = s.query(User).count()
            s.close()
            if count == 0:
                need_seed = True
        except Exception:
            need_seed = True
    else:
        from backend.config import DB_URI
        db_path = os.path.join(os.path.dirname(__file__), "training_load.db")
        if DB_URI.startswith("sqlite") and (not os.path.exists(db_path) or os.path.getsize(db_path) < 1000):
            need_seed = True

    if need_seed:
        print("正在灌入种子数据...")
        from scripts.seed_data import seed
        seed()

    if using_timescaledb:
        try:
            with engine.connect() as conn:
                conn.execute(text("SELECT create_hypertable('heart_rates', 'recorded_at', if_not_exists => TRUE, migrate_data => TRUE)"))
                conn.execute(text("SELECT create_hypertable('paces', 'recorded_at', if_not_exists => TRUE, migrate_data => TRUE)"))
                conn.commit()
            print("  Hypertable 已创建 (heart_rates, paces)")
        except Exception as e:
            print(f"  Hypertable: {e}（普通表仍可正常查询）")

        try:
            with engine.connect() as conn:
                conn.execute(text(
                    "CREATE MATERIALIZED VIEW IF NOT EXISTS hr_daily_stats AS "
                    "SELECT athlete_id, date(recorded_at) AS day, "
                    "  avg(hr_bpm) AS avg_hr, max(hr_bpm) AS max_hr, min(hr_bpm) AS min_hr "
                    "FROM heart_rates GROUP BY athlete_id, date(recorded_at)"
                ))
                conn.execute(text(
                    "CREATE MATERIALIZED VIEW IF NOT EXISTS pace_daily_stats AS "
                    "SELECT athlete_id, date(recorded_at) AS day, "
                    "  avg(pace_min_per_km) AS avg_pace, sum(distance_km) AS total_km "
                    "FROM paces GROUP BY athlete_id, date(recorded_at)"
                ))
                conn.commit()
            print("  连续聚合视图已创建")
        except Exception as e:
            print(f"  连续聚合: {e}")

        try:
            with engine.connect() as conn:
                conn.execute(text("SELECT add_retention_policy('heart_rates', INTERVAL '2 years', if_not_exists => TRUE)"))
                conn.execute(text("SELECT add_retention_policy('paces', INTERVAL '2 years', if_not_exists => TRUE)"))
                conn.commit()
            print("  数据保留策略已设置 (2年)")
        except Exception:
            pass

    dash_server.register_blueprint(api_bp, url_prefix="/api")

    db_type = "TimescaleDB" if "postgresql" in str(engine.url) else "SQLite"
    has_ts_ext = False
    if using_timescaledb:
        try:
            with engine.connect() as conn:
                r = conn.execute(text("SELECT extname FROM pg_extension WHERE extname='timescaledb'"))
                has_ts_ext = r.fetchone() is not None
        except Exception:
            pass

    engine_desc = f"PostgreSQL+TimescaleDB" if has_ts_ext else f"PostgreSQL (TimescaleDB兼容)" if "postgresql" in str(engine.url) else "SQLite"
    print("=" * 60)
    print(f"  🏋️ 运动训练负荷可视化系统已启动")
    print(f"  数据库:    {engine_desc} ({engine.url})")
    print(f"  Dash前端:  http://localhost:8051")
    print(f"  Flask API: http://localhost:8051/api")
    print(f"  教练账号:  coach_wang / coach123")
    print(f"  队员账号:  张伟 / ath123")
    print("=" * 60)

    dash_app.run(host="0.0.0.0", port=8051, debug=False, use_reloader=False)
