import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine, Base
from app.core.security import get_password_hash
from app.models.user import User, UserRole
from app.models.event import Event
from datetime import date, time


def init_db():
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    try:
        admin = db.query(User).filter(User.username == "admin").first()
        if not admin:
            admin = User(
                username="admin",
                email="admin@example.com",
                full_name="系统管理员",
                role=UserRole.ADMIN,
                hashed_password=get_password_hash("admin123"),
                is_active=True,
            )
            db.add(admin)
            print("创建管理员账号: admin / admin123")
        
        operator = db.query(User).filter(User.username == "operator").first()
        if not operator:
            operator = User(
                username="operator",
                email="operator@example.com",
                full_name="运营人员",
                role=UserRole.OPERATOR,
                hashed_password=get_password_hash("operator123"),
                is_active=True,
            )
            db.add(operator)
            print("创建运营人员账号: operator / operator123")
        
        checker = db.query(User).filter(User.username == "checker").first()
        if not checker:
            checker = User(
                username="checker",
                email="checker@example.com",
                full_name="签到人员",
                role=UserRole.CHECKER,
                hashed_password=get_password_hash("checker123"),
                is_active=True,
            )
            db.add(checker)
            print("创建签到人员账号: checker / checker123")
        
        event = db.query(Event).filter(Event.name == "2024行业峰会").first()
        if not event:
            event = Event(
                name="2024行业峰会",
                description="年度行业峰会，汇聚行业精英",
                location="国际会议中心",
                start_date=date(2024, 12, 1),
                end_date=date(2024, 12, 3),
                start_time=time(9, 0),
                end_time=time(18, 0),
                max_participants=500,
                is_active=True,
            )
            db.add(event)
            print("创建示例活动: 2024行业峰会")
        
        db.commit()
        print("数据库初始化完成!")
        
    except Exception as e:
        db.rollback()
        print(f"初始化失败: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    init_db()
