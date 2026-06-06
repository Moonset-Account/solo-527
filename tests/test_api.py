import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database import Base, get_db
from app.main import app
from app.config import settings
from app.auth import get_password_hash
from app import models

SQLALCHEMY_DATABASE_URL = settings.TEST_DATABASE_URL

engine = create_engine(SQLALCHEMY_DATABASE_URL)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db_session():
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
    
    app.dependency_overrides[get_db] = override_get_db
    
    user = models.User(
        username="testadmin",
        email="test@example.com",
        hashed_password=get_password_hash("test123"),
        full_name="测试管理员",
        role=models.UserRole.ADMIN,
        is_active=True
    )
    db_session.add(user)
    db_session.commit()
    
    with TestClient(app) as c:
        yield c


def get_token(client):
    response = client.post(
        "/api/auth/login",
        data={"username": "testadmin", "password": "test123"}
    )
    return response.json()["access_token"]


def test_root(client):
    response = client.get("/")
    assert response.status_code == 200
    assert "status" in response.json()


def test_health_check(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_login(client):
    response = client.post(
        "/api/auth/login",
        data={"username": "testadmin", "password": "test123"}
    )
    assert response.status_code == 200
    assert "access_token" in response.json()
    assert response.json()["token_type"] == "bearer"


def test_create_location(client, db_session):
    token = get_token(client)
    headers = {"Authorization": f"Bearer {token}"}
    
    response = client.post(
        "/api/locations",
        json={
            "name": "测试社区",
            "address": "测试路1号",
            "district": "测试区",
            "city": "测试市",
            "contact_person": "测试人",
            "contact_phone": "13800000000",
            "capacity": 50
        },
        headers=headers
    )
    assert response.status_code == 200
    assert response.json()["name"] == "测试社区"


def test_get_locations(client, db_session):
    token = get_token(client)
    headers = {"Authorization": f"Bearer {token}"}
    
    loc = models.Location(name="测试地点", address="测试地址")
    db_session.add(loc)
    db_session.commit()
    
    response = client.get("/api/locations", headers=headers)
    assert response.status_code == 200
    assert len(response.json()) >= 1


def test_create_medicine(client, db_session):
    token = get_token(client)
    headers = {"Authorization": f"Bearer {token}"}
    
    response = client.post(
        "/api/medicines",
        json={
            "name": "测试药品",
            "unit": "盒",
            "stock_quantity": 100,
            "minimum_stock": 10
        },
        headers=headers
    )
    assert response.status_code == 200
    assert response.json()["name"] == "测试药品"


def test_create_user(client, db_session):
    token = get_token(client)
    headers = {"Authorization": f"Bearer {token}"}
    
    response = client.post(
        "/api/users",
        json={
            "username": "testuser",
            "password": "test123456",
            "full_name": "测试用户",
            "email": "testuser@example.com",
            "role": "volunteer"
        },
        headers=headers
    )
    assert response.status_code == 200
    assert response.json()["username"] == "testuser"
