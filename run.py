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


def _try_docker_timescaledb():
    try:
        running = subprocess.run(
            ["docker", "ps", "-q", "-f", "name=training-timescaledb"],
            capture_output=True, text=True, timeout=5
        )
        if running.stdout.strip():
            return "5434"

        result = subprocess.run(
            ["docker", "run", "-d", "--name", "training-timescaledb",
             "-p", "5434:5432",
             "-e", "POSTGRES_USER=training",
             "-e", "POSTGRES_PASSWORD=training",
             "-e", "POSTGRES_DB=training_load",
             "timescale/timescaledb:latest-pg14"],
            capture_output=True, text=True, timeout=120
        )
        if result.returncode == 0:
            time.sleep(4)
            return "5434"
    except Exception:
        pass
    return None


def _try_local_timescaledb():
    try:
        import psycopg2
        conn = psycopg2.connect(
            host="localhost", port=5432, dbname="training_load",
            user="training", password="training", connect_timeout=3
        )
        cur = conn.cursor()
        cur.execute("SELECT extname FROM pg_extension WHERE extname='timescaledb'")
        has_ext = cur.fetchone() is not None
        cur.close()
        conn.close()
        if has_ext:
            return "5432"
    except Exception:
        pass
    return None


def _activate_timescaledb_extension(port):
    try:
        import psycopg2
        conn = psycopg2.connect(
            host="localhost", port=int(port), dbname="training_load",
            user="training", password="training", connect_timeout=3
        )
        conn.autocommit = True
        cur = conn.cursor()
        cur.execute("CREATE EXTENSION IF NOT EXISTS timescaledb")
        cur.close()
        conn.close()
        return True
    except Exception:
        return False


if __name__ == "__main__":
    _kill_port(8051)
    time.sleep(0.5)

    print("正在连接 TimescaleDB...")

    tsdb_port = None

    docker_port = _try_docker_timescaledb()
    if docker_port:
        tsdb_port = docker_port
        print("  Docker TimescaleDB 容器已就绪")

    if not tsdb_port:
        local_port = _try_local_timescaledb()
        if local_port:
            tsdb_port = local_port
            print("  本地 TimescaleDB 实例已就绪")

    if not tsdb_port:
        print("❌ 无法连接 TimescaleDB")
        print("   请先启动 TimescaleDB：")
        print("   方式1: docker run -d --name training-timescaledb -p 5434:5432 \\")
        print("            -e POSTGRES_USER=training -e POSTGRES_PASSWORD=training \\")
        print("            -e POSTGRES_DB=training_load timescale/timescaledb:latest-pg14")
        print("   方式2: 在本地 PostgreSQL 上安装 TimescaleDB 扩展并创建 training 角色和 training_load 数据库")
        sys.exit(1)

    os.environ["TIMESCALEDB_URI"] = f"postgresql://training:training@localhost:{tsdb_port}/training_load"

    if not _activate_timescaledb_extension(tsdb_port):
        print("❌ TimescaleDB 扩展激活失败，请确认已安装 timescaledb 扩展")
        sys.exit(1)

    print("✅ TimescaleDB 连接成功，扩展已激活")

    from backend.db.database import init_db, engine, SessionLocal
    from backend.models.schema import User
    from backend.app import create_app
    from backend.api.routes import api_bp
    from dash_app.app import app as dash_app, server as dash_server

    init_db()

    need_seed = False
    try:
        s = SessionLocal()
        if s.query(User).count() == 0:
            need_seed = True
        s.close()
    except Exception:
        need_seed = True

    if need_seed:
        print("正在灌入种子数据...")
        from scripts.seed_data import seed
        seed()

    try:
        with engine.connect() as conn:
            from sqlalchemy import text
            conn.execute(text(
                "SELECT create_hypertable('heart_rates', 'recorded_at', "
                "if_not_exists => TRUE, migrate_data => TRUE)"
            ))
            conn.execute(text(
                "SELECT create_hypertable('paces', 'recorded_at', "
                "if_not_exists => TRUE, migrate_data => TRUE)"
            ))
            conn.commit()
        print("  Hypertable 已创建 (heart_rates, paces)")
    except Exception as e:
        print(f"  Hypertable: {e}")

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
        print("  连续聚合视图已创建 (hr_daily_stats, pace_daily_stats)")
    except Exception as e:
        print(f"  连续聚合: {e}")

    try:
        with engine.connect() as conn:
            conn.execute(text(
                "SELECT add_retention_policy('heart_rates', INTERVAL '2 years', if_not_exists => TRUE)"
            ))
            conn.execute(text(
                "SELECT add_retention_policy('paces', INTERVAL '2 years', if_not_exists => TRUE)"
            ))
            conn.commit()
        print("  数据保留策略已设置 (2年)")
    except Exception as e:
        print(f"  保留策略: {e}")

    dash_server.register_blueprint(api_bp, url_prefix="/api")

    print("=" * 60)
    print("  🏋️ 运动训练负荷可视化系统已启动")
    print(f"  数据库:    TimescaleDB ({engine.url})")
    print(f"  Dash前端:  http://localhost:8051")
    print(f"  Flask API: http://localhost:8051/api")
    print(f"  教练账号:  coach_wang / coach123")
    print(f"  队员账号:  张伟 / ath123")
    print("=" * 60)

    dash_app.run(host="0.0.0.0", port=8051, debug=False, use_reloader=False)
