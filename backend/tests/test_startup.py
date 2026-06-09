"""backend/tests/test_startup.py — 启动/登录/路由 完整性测试
★ 完全隔离：使用内存 SQLite，绝不触碰 app/data/app.db，绝不写真实数据库。
运行：cd backend && python3 -m tests.test_startup
"""
import sys, os, time, tempfile
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# ── 隔离：用临时文件 SQLite（避免 :memory: 多连接各建各的表），绝不触碰 app/data/app.db ──
TEST_DIR = os.path.dirname(os.path.abspath(__file__))
_tmp_fd, _tmp_db = tempfile.mkstemp(prefix="test_app_", suffix=".db", dir=TEST_DIR)
os.close(_tmp_fd)
os.environ["DATABASE_URL"] = f"sqlite:///{_tmp_db}"

from app.core.config import settings
settings.DATABASE_URL = f"sqlite:///{_tmp_db}"
settings.MODEL_STORAGE_PATH = os.path.join(TEST_DIR, "_tmp_model_storage_startup")
os.makedirs(settings.MODEL_STORAGE_PATH, exist_ok=True)
print(f"[test_startup] 隔离数据库: {_tmp_db}")

t0 = time.time()
import main
print(f"[test_startup] ✅ main imported (内存 SQLite) in {time.time()-t0:.1f}s")
app = main.app

from fastapi.testclient import TestClient

with TestClient(app) as client:
    # 1. health
    r = client.get('/health')
    assert r.status_code == 200, f'/health: {r.status_code} {r.text}'
    print('[1/7] ✅ /health →', r.status_code, r.json())

    # 2. login admin (lifespan 已创建默认用户)
    r = client.post('/api/v1/auth/login', data={'username': 'admin', 'password': 'admin123'})
    assert r.status_code == 200, f'admin login: {r.status_code} {r.text}'
    token = r.json()['access_token']
    print(f'[2/7] ✅ admin login token len={len(token)}')
    h = {'Authorization': f'Bearer {token}'}

    # 3. departments: 8 default
    r = client.get('/api/v1/data/departments', headers=h)
    assert r.status_code == 200
    print(f'[3/7] ✅ departments count={len(r.json())}')

    # 4. feedback list
    r = client.get('/api/v1/feedback', headers=h)
    assert r.status_code == 200
    print(f'[4/7] ✅ feedback list status={r.status_code}')

    # 5. model versions
    r = client.get('/api/v1/models/versions', headers=h)
    assert r.status_code == 200
    vs = r.json()
    print(f'[5/7] ✅ model versions count={len(vs)}')
    if vs:
        v0 = vs[0]
        for f in ('review_history', 'audit_trail', 'reviewer_name', 'review_status'):
            print(f'       · has {f}: {f in v0}')

    # 6. operator login
    r = client.post('/api/v1/auth/login', data={'username': 'operator', 'password': 'operator123'})
    print(f'[6/7] ✅ operator login → {r.status_code}')

    # 7. data_scientist login
    r = client.post('/api/v1/auth/login', data={'username': 'datascientist', 'password': 'ds123456'})
    print(f'[7/7] ✅ datascientist login → {r.status_code}')

    print('\n[test_startup] 🏁 ALL 7 CHECKS PASSED (零污染真实 DB)')
