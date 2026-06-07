import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal, Base, engine
from app.models import (
    User, Checkpoint, SafetyEvent, NotificationLog, Attachment,
    UserRole, EventLevel, EventStatus, NotificationStatus, AttachmentAccessRole
)
from app.auth import get_password_hash
from datetime import datetime, timedelta
import uuid


def init_data():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    try:
        if db.query(User).count() > 0:
            print("Data already exists, skipping initialization")
            return
        
        print("Creating users...")
        pm = User(
            name="张主任",
            email="zhang@camp.com",
            role=UserRole.PROJECT_MANAGER,
            password_hash=get_password_hash("123456")
        )
        teacher1 = User(
            name="李老师",
            email="li@camp.com",
            role=UserRole.TEACHER,
            password_hash=get_password_hash("123456")
        )
        teacher2 = User(
            name="王老师",
            email="wang@camp.com",
            role=UserRole.TEACHER,
            password_hash=get_password_hash("123456")
        )
        db.add_all([pm, teacher1, teacher2])
        db.flush()
        
        print("Creating checkpoints...")
        cp1 = Checkpoint(name="东门签到点", description="营地入口处", lat=39.9042, lng=116.4074)
        cp2 = Checkpoint(name="活动广场", description="中心活动区域", lat=39.9050, lng=116.4080)
        cp3 = Checkpoint(name="宿舍区", description="学生住宿区域", lat=39.9035, lng=116.4065)
        cp4 = Checkpoint(name="餐厅", description="就餐区域", lat=39.9048, lng=116.4060)
        cp5 = Checkpoint(name="医务室", description="医疗站点", lat=39.9040, lng=116.4085)
        db.add_all([cp1, cp2, cp3, cp4, cp5])
        db.flush()
        
        print("Creating sample events...")
        now = datetime.utcnow()
        
        events_data = [
            {
                "title": "学生轻微擦伤",
                "description": "学生在跑步时不慎摔倒，膝盖轻微擦伤，已进行消毒处理。",
                "level": EventLevel.LOW,
                "checkpoint": cp2,
                "teacher": teacher1,
                "reviewer": pm,
                "occurred_at": now - timedelta(hours=2),
                "status": EventStatus.CLOSED,
                "notification": NotificationStatus.SUCCESS,
                "closed_at": now - timedelta(hours=1, minutes=30)
            },
            {
                "title": "学生高烧",
                "description": "学生夜间突发高烧39度，已送往医务室观察。",
                "level": EventLevel.MEDIUM,
                "checkpoint": cp3,
                "teacher": teacher2,
                "reviewer": pm,
                "occurred_at": now - timedelta(hours=5),
                "status": EventStatus.PROCESSING,
                "notification": NotificationStatus.SUCCESS,
                "closed_at": None
            },
            {
                "title": "活动器材损坏",
                "description": "户外活动中篮球架螺丝松动，存在安全隐患，已暂停使用。",
                "level": EventLevel.MEDIUM,
                "checkpoint": cp2,
                "teacher": teacher1,
                "reviewer": None,
                "occurred_at": now - timedelta(hours=1),
                "status": EventStatus.UNCONFIRMED,
                "notification": NotificationStatus.PENDING,
                "closed_at": None
            },
            {
                "title": "学生食物过敏",
                "description": "学生午餐后出现过敏反应，已服用抗过敏药物，情况稳定。",
                "level": EventLevel.HIGH,
                "checkpoint": cp4,
                "teacher": teacher2,
                "reviewer": pm,
                "occurred_at": now - timedelta(days=1, hours=3),
                "status": EventStatus.CLOSED,
                "notification": NotificationStatus.FAILED,
                "closed_at": now - timedelta(days=1, hours=1)
            },
            {
                "title": "学生走失（已找回）",
                "description": "学生在自由活动时间走失，15分钟后在图书馆找到，已通知家长。",
                "level": EventLevel.CRITICAL,
                "checkpoint": cp1,
                "teacher": teacher1,
                "reviewer": pm,
                "occurred_at": now - timedelta(days=3),
                "status": EventStatus.CLOSED,
                "notification": NotificationStatus.SUCCESS,
                "closed_at": now - timedelta(days=3) + timedelta(hours=2)
            },
            {
                "title": "雨天路滑摔倒",
                "description": "下雨天地滑，学生在前往餐厅途中摔倒，手肘淤青。",
                "level": EventLevel.LOW,
                "checkpoint": cp4,
                "teacher": teacher2,
                "reviewer": None,
                "occurred_at": now - timedelta(minutes=30),
                "status": EventStatus.UNCONFIRMED,
                "notification": NotificationStatus.PENDING,
                "closed_at": None
            }
        ]
        
        for data in events_data:
            event = SafetyEvent(
                title=data["title"],
                description=data["description"],
                level=data["level"],
                status=data["status"],
                checkpoint_id=data["checkpoint"].id,
                teacher_id=data["teacher"].id,
                reviewer_id=data["reviewer"].id if data["reviewer"] else None,
                actual_occurred_at=data["occurred_at"],
                recorded_at=data["occurred_at"] + timedelta(minutes=5),
                confirmed_at=data["occurred_at"] + timedelta(minutes=10) if data["status"] != EventStatus.UNCONFIRMED else None,
                closed_at=data["closed_at"],
                notification_status=data["notification"],
                notification_attempts=1 if data["notification"] != NotificationStatus.PENDING else 0,
                location_lat=data["checkpoint"].lat,
                location_lng=data["checkpoint"].lng,
                original_record_url=f"https://camp.example.com/records/{uuid.uuid4()}"
            )
            db.add(event)
            db.flush()
            
            if data["notification"] != NotificationStatus.PENDING:
                log = NotificationLog(
                    event_id=event.id,
                    status=data["notification"],
                    error_message="家长电话未接通" if data["notification"] == NotificationStatus.FAILED else None,
                    sent_at=data["occurred_at"] + timedelta(minutes=15)
                )
                db.add(log)
        
        db.commit()
        print("Data initialization completed successfully!")
        print("")
        print("Test accounts:")
        print("  Project Manager: zhang@camp.com / 123456")
        print("  Teacher 1: li@camp.com / 123456")
        print("  Teacher 2: wang@camp.com / 123456")
        
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    init_data()
