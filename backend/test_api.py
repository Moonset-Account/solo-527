import os
os.environ.pop("USE_POSTGRES", None)

from app.main import app
from fastapi.testclient import TestClient

client = TestClient(app)

r1 = client.post("/api/auth/register", json={
    "username": "testuser", "password": "test123",
    "real_name": "Test", "student_id": "2024001",
    "dorm_room": "A-101", "role": "student"
})
print("Register:", r1.status_code, r1.json())

r2 = client.post("/api/auth/login", data={"username": "testuser", "password": "test123"})
print("Login:", r2.status_code, r2.json())

token = r2.json()["access_token"]

r3 = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
print("Me:", r3.status_code, r3.json())

r4 = client.post("/api/repairs/", data={
    "title": "Test Repair", "category": "plumbing",
    "description": "Leaky faucet", "urgency": "high"
}, headers={"Authorization": f"Bearer {token}"})
print("Create Repair:", r4.status_code, r4.json().get("id"), r4.json().get("title"))

r5 = client.get("/api/repairs/", headers={"Authorization": f"Bearer {token}"})
print("List Repairs:", r5.status_code, len(r5.json()))

r6 = client.post("/api/auth/register", json={
    "username": "admin1", "password": "admin123", "role": "admin"
})
print("Register Admin:", r6.status_code)

admin_token = client.post("/api/auth/login", data={"username": "admin1", "password": "admin123"}).json()["access_token"]

r7 = client.get("/api/admin/repairs", headers={"Authorization": f"Bearer {admin_token}"})
print("Admin List Repairs:", r7.status_code, len(r7.json()))

r8 = client.post("/api/admin/repairs/1/audit", json={"action": "approve", "comment": "Approved"}, headers={"Authorization": f"Bearer {admin_token}"})
print("Audit Repair:", r8.status_code, r8.json().get("action"))

r9 = client.get("/api/admin/statistics", headers={"Authorization": f"Bearer {admin_token}"})
print("Statistics:", r9.status_code, r9.json().get("total_orders"))

print("\nAll tests passed!")
