import sys, os
sys.path.insert(0, os.path.dirname(__file__))
os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///:memory:"
os.environ["REDIS_URL"] = "redis://localhost:6379/0"

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

r1 = client.get("/api/health")
print(f"[1] /api/health -> {r1.status_code}: {r1.json()}")
assert r1.status_code == 200

r2 = client.get("/events")
print(f"[2] /events -> {r2.status_code} (HTML length={len(r2.text)})")
assert r2.status_code == 200

r3 = client.get("/admin")
print(f"[3] /admin -> {r3.status_code} (HTML length={len(r3.text)})")
assert r3.status_code == 200

r4 = client.get("/")
print(f"[4] / -> {r4.status_code} (HTML length={len(r4.text)})")
assert r4.status_code == 200

r5 = client.get("/login")
print(f"[5] /login -> {r5.status_code} (HTML length={len(r5.text)})")
assert r5.status_code == 200

print("\n✅ 全部页面可访问，FastAPI 启动正常!")
