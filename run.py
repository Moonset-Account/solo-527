import os
import sys
import threading
import time

sys.path.insert(0, os.path.dirname(__file__))

from backend.db.database import init_db
from backend.app import create_app
from dash_app.app import app as dash_app, server as dash_server


def run_flask():
    flask_app = create_app()
    flask_app.run(host="0.0.0.0", port=5001, debug=False, use_reloader=False)


def run_dash():
    dash_app.run(host="0.0.0.0", port=8051, debug=False)


if __name__ == "__main__":
    init_db()

    db_path = os.path.join(os.path.dirname(__file__), "training_load.db")
    if not os.path.exists(db_path) or os.path.getsize(db_path) < 1000:
        print("Seeding database...")
        from scripts.seed_data import seed
        seed()

    flask_thread = threading.Thread(target=run_flask, daemon=True)
    flask_thread.start()
    time.sleep(1)

    print("=" * 60)
    print("  🏋️ 训练负荷可视化系统已启动")
    print("  Dash前端:  http://localhost:8051")
    print("  Flask API: http://localhost:5001/api")
    print("  教练账号:  coach_wang / coach123")
    print("  队员账号:  张伟 / ath123")
    print("=" * 60)

    run_dash()
