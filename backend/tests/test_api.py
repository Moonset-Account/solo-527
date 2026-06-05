import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.main import app
from app.database import Base, get_db
from app.config import settings

SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base.metadata.create_all(bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)

def get_auth_headers(username: str, password: str):
    response = client.post(
        "/api/v1/auth/login",
        data={"username": username, "password": password}
    )
    if response.status_code == 200:
        token = response.json()["access_token"]
        return {"Authorization": f"Bearer {token}"}
    return {}

class TestAuth:
    def test_login_admin(self):
        response = client.post(
            "/api/v1/auth/login",
            data={"username": "admin", "password": "admin123"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert data["user"]["role"] == "admin"
    
    def test_login_member(self):
        response = client.post(
            "/api/v1/auth/login",
            data={"username": "researcher1", "password": "research123"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["user"]["role"] == "member"
    
    def test_login_wrong_password(self):
        response = client.post(
            "/api/v1/auth/login",
            data={"username": "admin", "password": "wrong"}
        )
        assert response.status_code == 401
    
    def test_get_me(self):
        headers = get_auth_headers("admin", "admin123")
        response = client.get("/api/v1/auth/me", headers=headers)
        assert response.status_code == 200
        assert response.json()["username"] == "admin"

class TestReagents:
    def test_list_reagents(self):
        headers = get_auth_headers("admin", "admin123")
        response = client.get("/api/v1/reagents", headers=headers)
        assert response.status_code == 200
    
    def test_create_reagent(self):
        headers = get_auth_headers("admin", "admin123")
        reagent_data = {
            "name": "测试试剂",
            "cas_number": "123-45-6",
            "category": "测试类",
            "unit": "g",
            "hazard_level": "LOW",
            "min_stock": 100
        }
        response = client.post("/api/v1/reagents", json=reagent_data, headers=headers)
        assert response.status_code == 201
        assert response.json()["name"] == "测试试剂"
    
    def test_get_low_stock(self):
        headers = get_auth_headers("admin", "admin123")
        response = client.get("/api/v1/reagents/low-stock", headers=headers)
        assert response.status_code == 200

class TestRequisitions:
    def test_list_requisitions(self):
        headers = get_auth_headers("admin", "admin123")
        response = client.get("/api/v1/requisitions", headers=headers)
        assert response.status_code == 200
    
    def test_create_requisition(self):
        headers = get_auth_headers("researcher1", "research123")
        req_data = {
            "purpose": "测试实验",
            "items": [
                {
                    "reagent_batch_id": 1,
                    "quantity": 10
                }
            ]
        }
        response = client.post("/api/v1/requisitions", json=req_data, headers=headers)
        assert response.status_code in [201, 400]

class TestAuditLog:
    def test_list_audit_logs(self):
        headers = get_auth_headers("admin", "admin123")
        response = client.get("/api/v1/audit", headers=headers)
        assert response.status_code == 200
    
    def test_delete_audit_log_forbidden(self):
        headers = get_auth_headers("admin", "admin123")
        response = client.delete("/api/v1/audit/1", headers=headers)
        assert response.status_code in [403, 404, 405]

class TestNotifications:
    def test_list_notifications(self):
        headers = get_auth_headers("admin", "admin123")
        response = client.get("/api/v1/notifications", headers=headers)
        assert response.status_code == 200
    
    def test_unread_count(self):
        headers = get_auth_headers("admin", "admin123")
        response = client.get("/api/v1/notifications/unread-count", headers=headers)
        assert response.status_code == 200
        assert "count" in response.json()

class TestReports:
    def test_dashboard(self):
        headers = get_auth_headers("admin", "admin123")
        response = client.get("/api/v1/reports/dashboard", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert "overview" in data
        assert "hazard_distribution" in data

class TestOffline:
    def test_sync_offline_record(self):
        headers = get_auth_headers("admin", "admin123")
        sync_data = {
            "sync_type": "stock_in",
            "data": {
                "reagent_id": 1,
                "batch_number": "OFFLINE001",
                "quantity": 100,
                "expiry_date": "2025-12-31",
                "storage_cabinet_id": 1
            }
        }
        response = client.post("/api/v1/offline/sync", json=sync_data, headers=headers)
        assert response.status_code in [200, 201]

if __name__ == "__main__":
    pytest.main([__file__, "-v"])
