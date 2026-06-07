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


if __name__ == "__main__":
    _kill_port(8051)
    _kill_port(5001)
    time.sleep(0.5)

    from backend.db.database import init_db
    from backend.app import create_app
    from backend.api.routes import api_bp
    from dash_app.app import app as dash_app, server as dash_server

    init_db()

    db_path = os.path.join(os.path.dirname(__file__), "training_load.db")
    if not os.path.exists(db_path) or os.path.getsize(db_path) < 1000:
        print("Seeding database...")
        from scripts.seed_data import seed
        seed()

    dash_server.register_blueprint(api_bp, url_prefix="/api")

    print("=" * 60)
    print("  🏋️ 运动训练负荷可视化系统已启动")
    print("  Dash前端:  http://localhost:8051")
    print("  Flask API: http://localhost:8051/api")
    print("  教练账号:  coach_wang / coach123")
    print("  队员账号:  张伟 / ath123")
    print("=" * 60)

    dash_app.run(host="0.0.0.0", port=8051, debug=False, use_reloader=False)
