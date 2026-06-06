import pytest
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from tests.conftest import get_auth_headers


def test_register_user(client):
    response = client.post(
        "/api/auth/register",
        json={
            "username": "newuser",
            "email": "new@example.com",
            "password": "password123",
            "full_name": "New User",
            "role": "runner"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["username"] == "newuser"
    assert data["email"] == "new@example.com"
    assert data["role"] == "runner"
    assert "id" in data


def test_register_duplicate_username(client, test_user):
    response = client.post(
        "/api/auth/register",
        json={
            "username": "testuser",
            "email": "another@example.com",
            "password": "password123"
        }
    )
    assert response.status_code == 400


def test_login_success(client, test_user):
    response = client.post(
        "/api/auth/login",
        data={"username": "testuser", "password": "testpass123"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["username"] == "testuser"


def test_login_wrong_password(client, test_user):
    response = client.post(
        "/api/auth/login",
        data={"username": "testuser", "password": "wrongpassword"}
    )
    assert response.status_code == 401


def test_get_current_user(client, test_user):
    headers = get_auth_headers(client, "testuser", "testpass123")
    response = client.get("/api/auth/me", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["username"] == "testuser"
    assert data["email"] == "test@example.com"


def test_get_current_user_no_token(client):
    response = client.get("/api/auth/me")
    assert response.status_code == 401


def test_role_permission_coach_endpoint_forbidden(client, test_user):
    headers = get_auth_headers(client, "testuser", "testpass123")
    response = client.post(
        "/api/training-plans/",
        json={
            "title": "Test Plan",
            "plan_date": "2024-12-01T10:00:00",
            "distance_km": 10.0
        },
        headers=headers
    )
    assert response.status_code == 403


def test_role_permission_coach_endpoint_allowed(client, test_coach):
    headers = get_auth_headers(client, "testcoach", "coach123")
    response = client.post(
        "/api/training-plans/",
        json={
            "title": "Test Plan",
            "plan_date": "2024-12-01T10:00:00",
            "distance_km": 10.0
        },
        headers=headers
    )
    assert response.status_code == 200
