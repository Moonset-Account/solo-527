import pytest
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from datetime import datetime
from tests.conftest import get_auth_headers


def test_task_board_structure(client, test_coach, db_session):
    from app import models
    headers = get_auth_headers(client, "testcoach", "coach123")

    task1 = models.Task(
        title="新任务1",
        task_type=models.TaskType.TRAINING_PLAN,
        status=models.TaskStatus.NEW,
        priority=1
    )
    task2 = models.Task(
        title="待确认打卡",
        task_type=models.TaskType.CHECKIN,
        status=models.TaskStatus.PENDING_CONFIRM,
        priority=2
    )
    task3 = models.Task(
        title="执行中任务",
        task_type=models.TaskType.CHECKIN,
        status=models.TaskStatus.IN_PROGRESS
    )
    task4 = models.Task(
        title="异常复核",
        task_type=models.TaskType.CHECKIN,
        status=models.TaskStatus.EXCEPTION_REVIEW,
        priority=3
    )
    task5 = models.Task(
        title="已归档",
        task_type=models.TaskType.ACTIVITY_SIGNUP,
        status=models.TaskStatus.ARCHIVED
    )
    db_session.add_all([task1, task2, task3, task4, task5])
    db_session.commit()

    response = client.get("/api/tasks/board", headers=headers)
    assert response.status_code == 200
    data = response.json()

    assert "new" in data
    assert "pending_confirm" in data
    assert "in_progress" in data
    assert "exception_review" in data
    assert "archived" in data

    assert len(data["new"]) == 1
    assert len(data["pending_confirm"]) == 1
    assert len(data["in_progress"]) == 1
    assert len(data["exception_review"]) == 1
    assert len(data["archived"]) == 1

    assert data["new"][0]["title"] == "新任务1"
    assert data["pending_confirm"][0]["title"] == "待确认打卡"
    assert data["exception_review"][0]["priority"] == 3


def test_task_board_runner_view(client, test_user, db_session):
    from app import models
    headers = get_auth_headers(client, "testuser", "testpass123")

    task_assigned = models.Task(
        title="分配给我的任务",
        task_type=models.TaskType.CHECKIN,
        status=models.TaskStatus.PENDING_CONFIRM,
        assigned_user_id=test_user.id
    )
    task_unassigned = models.Task(
        title="未分配任务",
        task_type=models.TaskType.CHECKIN,
        status=models.TaskStatus.NEW
    )
    task_other = models.Task(
        title="别人的任务",
        task_type=models.TaskType.CHECKIN,
        status=models.TaskStatus.IN_PROGRESS,
        assigned_user_id=999
    )
    db_session.add_all([task_assigned, task_unassigned, task_other])
    db_session.commit()

    response = client.get("/api/tasks/board", headers=headers)
    assert response.status_code == 200
    data = response.json()

    all_tasks = data["new"] + data["pending_confirm"] + data["in_progress"]
    task_titles = [t["title"] for t in all_tasks]

    assert "分配给我的任务" in task_titles
    assert "未分配任务" in task_titles
    assert "别人的任务" not in task_titles


def test_update_task_status(client, test_coach, db_session):
    from app import models
    headers = get_auth_headers(client, "testcoach", "coach123")

    task = models.Task(
        title="待更新任务",
        task_type=models.TaskType.CHECKIN,
        status=models.TaskStatus.PENDING_CONFIRM
    )
    db_session.add(task)
    db_session.commit()
    db_session.refresh(task)

    response = client.patch(
        f"/api/tasks/{task.id}",
        json={"status": "in_progress"},
        headers=headers
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "in_progress"


def test_task_board_no_auth(client):
    response = client.get("/api/tasks/board")
    assert response.status_code == 401


def test_create_task_as_coach(client, test_coach):
    headers = get_auth_headers(client, "testcoach", "coach123")
    response = client.post(
        "/api/tasks/",
        json={
            "title": "新建任务",
            "task_type": "checkin",
            "priority": 2,
            "notes": "测试备注"
        },
        headers=headers
    )
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "新建任务"
    assert data["status"] == "new"


def test_activity_signup_creates_task(client, test_user, test_coach, db_session):
    from app import models
    headers = get_auth_headers(client, "testuser", "testpass123")

    activity = models.Activity(
        title="测试活动",
        activity_date=datetime.now(),
        created_by=test_coach.id,
        is_published=True
    )
    db_session.add(activity)
    db_session.commit()
    db_session.refresh(activity)

    initial_task_count = db_session.query(models.Task).count()

    response = client.post(
        f"/api/activities/{activity.id}/signup",
        json={
            "activity_id": activity.id,
            "emergency_contact": "联系人",
            "emergency_phone": "13800000000"
        },
        headers=headers
    )
    assert response.status_code == 200

    final_task_count = db_session.query(models.Task).count()
    assert final_task_count > initial_task_count


def test_injury_notes_only_coach_visible(client, test_user, test_coach, db_session):
    from app import models
    runner_headers = get_auth_headers(client, "testuser", "testpass123")
    coach_headers = get_auth_headers(client, "testcoach", "coach123")

    injury = models.InjuryNote(
        runner_id=test_user.id,
        reported_by=test_coach.id,
        title="测试伤病",
        description="测试备注"
    )
    db_session.add(injury)
    db_session.commit()
    db_session.refresh(injury)

    response = client.get(f"/api/injury-notes/{injury.id}", headers=runner_headers)
    assert response.status_code == 403

    response = client.get(f"/api/injury-notes/{injury.id}", headers=coach_headers)
    assert response.status_code == 200
