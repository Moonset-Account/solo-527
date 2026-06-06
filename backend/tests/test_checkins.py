import pytest
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from tests.conftest import get_auth_headers


def test_create_checkin_success(client, test_user):
    headers = get_auth_headers(client, "testuser", "testpass123")
    response = client.post(
        "/api/checkins/",
        json={
            "distance_km": 5.5,
            "duration_seconds": 2100,
            "avg_pace": "6:22",
            "avg_heart_rate": 145,
            "perceived_effort": 5,
            "notes": "晨跑感觉良好",
            "location_alias": "朝阳公园",
            "track_points": [
                {"lat": 39.9389, "lng": 116.4741, "time": "06:00"},
                {"lat": 39.9390, "lng": 116.4742, "time": "06:01"}
            ]
        },
        headers=headers
    )
    assert response.status_code == 200
    data = response.json()
    assert data["distance_km"] == 5.5
    assert data["avg_pace"] == "6:22"
    assert data["status"] == "pending_confirm"
    assert data["runner_id"] == test_user.id
    assert data["track_points"][0]["lat"] == round(39.9389, 2)


def test_create_checkin_no_auth(client):
    response = client.post(
        "/api/checkins/",
        json={"distance_km": 5.0}
    )
    assert response.status_code == 401


def test_list_checkins_as_runner(client, test_user, db_session):
    from app import models
    headers = get_auth_headers(client, "testuser", "testpass123")

    checkin1 = models.Checkin(
        runner_id=test_user.id,
        distance_km=5.0,
        status=models.TaskStatus.PENDING_CONFIRM
    )
    checkin2 = models.Checkin(
        runner_id=test_user.id,
        distance_km=8.0,
        status=models.TaskStatus.IN_PROGRESS
    )
    db_session.add_all([checkin1, checkin2])
    db_session.commit()

    response = client.get("/api/checkins/", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2


def test_get_checkin_detail(client, test_user, db_session):
    from app import models
    headers = get_auth_headers(client, "testuser", "testpass123")

    checkin = models.Checkin(
        runner_id=test_user.id,
        distance_km=10.0,
        avg_pace="5:30",
        notes="测试打卡详情"
    )
    db_session.add(checkin)
    db_session.commit()
    db_session.refresh(checkin)

    response = client.get(f"/api/checkins/{checkin.id}", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["distance_km"] == 10.0
    assert data["notes"] == "测试打卡详情"


def test_update_checkin_status_as_coach(client, test_user, test_coach, db_session):
    from app import models
    headers = get_auth_headers(client, "testcoach", "coach123")

    checkin = models.Checkin(
        runner_id=test_user.id,
        distance_km=7.5,
        status=models.TaskStatus.PENDING_CONFIRM
    )
    db_session.add(checkin)
    db_session.commit()
    db_session.refresh(checkin)

    response = client.patch(
        f"/api/checkins/{checkin.id}",
        json={"status": "in_progress"},
        headers=headers
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "in_progress"


def test_update_checkin_status_as_runner_forbidden(client, test_user, db_session):
    from app import models
    headers = get_auth_headers(client, "testuser", "testpass123")

    checkin = models.Checkin(
        runner_id=test_user.id,
        distance_km=7.5,
        status=models.TaskStatus.PENDING_CONFIRM
    )
    db_session.add(checkin)
    db_session.commit()
    db_session.refresh(checkin)

    response = client.patch(
        f"/api/checkins/{checkin.id}",
        json={"status": "in_progress"},
        headers=headers
    )
    assert response.status_code == 403


def test_location_privacy_masked(client, test_user):
    headers = get_auth_headers(client, "testuser", "testpass123")
    precise_lat = 39.938976
    precise_lng = 116.474123

    response = client.post(
        "/api/checkins/",
        json={
            "distance_km": 3.0,
            "track_points": [{"lat": precise_lat, "lng": precise_lng}]
        },
        headers=headers
    )
    assert response.status_code == 200
    data = response.json()
    assert data["track_points"][0]["lat"] != precise_lat
    assert data["track_points"][0]["lng"] != precise_lng
