import sys
import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from app.main import app
from app.database import Base, get_db
from app import models, auth

SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db_session():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture(scope="function")
def test_user(db_session):
    user = models.User(
        username="testuser",
        email="test@example.com",
        full_name="Test User",
        hashed_password=auth.get_password_hash("testpass123"),
        role=models.UserRole.RUNNER,
        is_active=True
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture(scope="function")
def test_coach(db_session):
    coach = models.User(
        username="testcoach",
        email="coach@example.com",
        full_name="Test Coach",
        hashed_password=auth.get_password_hash("coach123"),
        role=models.UserRole.COACH,
        is_active=True
    )
    db_session.add(coach)
    db_session.commit()
    db_session.refresh(coach)
    return coach


@pytest.fixture(scope="function")
def test_admin(db_session):
    admin = models.User(
        username="testadmin",
        email="admin@example.com",
        full_name="Test Admin",
        hashed_password=auth.get_password_hash("admin123"),
        role=models.UserRole.ADMIN,
        is_active=True
    )
    db_session.add(admin)
    db_session.commit()
    db_session.refresh(admin)
    return admin


def get_auth_headers(client, username, password):
    response = client.post(
        "/api/auth/login",
        data={"username": username, "password": password}
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
