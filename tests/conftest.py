import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import Base, get_db
from app.config import settings
from app.main import app
from app.core.security import get_password_hash
from app.core.permissions import ROLE_PERMISSIONS
from app.models import User, Role, Permission

TEST_DATABASE_URL = settings.TEST_DATABASE_URL

engine = create_engine(TEST_DATABASE_URL)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db_session():
    Base.metadata.drop_all(bind=engine)
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
    all_perm_names = set()
    for perms in ROLE_PERMISSIONS.values():
        all_perm_names.update(perms)

    permissions = {}
    for perm_name in all_perm_names:
        perm = Permission(name=perm_name, description=f"Test perm: {perm_name}")
        db_session.add(perm)
        db_session.flush()
        permissions[perm_name] = perm

    admin_role = Role(name="admin", description="Admin role")
    for perm_name in ROLE_PERMISSIONS["admin"]:
        if perm_name in permissions:
            admin_role.permissions.append(permissions[perm_name])
    db_session.add(admin_role)
    db_session.flush()

    user = User(
        username="testadmin",
        email="test@example.com",
        full_name="Test Admin",
        hashed_password=get_password_hash("testpass123")
    )
    user.roles.append(admin_role)
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture(scope="function")
def auth_headers(client, test_user):
    response = client.post(
        "/api/auth/login",
        data={"username": "testadmin", "password": "testpass123"}
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
