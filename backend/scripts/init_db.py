import sys
import os
from datetime import datetime, timedelta
from uuid import uuid4

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app.core.database import SessionLocal, engine, Base
from app.models import (
    User, Team, HazardType, InspectionPoint, Hazard,
    Fine, RectificationRecord
)
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def init_db():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    try:
        if db.query(User).count() > 0:
            print("Database already has data, skipping initialization")
            return
        
        print("Initializing database...")
        
        teams = [
            Team(id=str(uuid4()), name="土建一班", leader="张建国", phone="13800000001", is_active=True, created_at=datetime.now()),
            Team(id=str(uuid4()), name="土建二班", leader="李国强", phone="13800000002", is_active=True, created_at=datetime.now()),
            Team(id=str(uuid4()), name="电气班组", leader="王照明", phone="13800000003", is_active=True, created_at=datetime.now()),
            Team(id=str(uuid4()), name="水暖班组", leader="赵水管", phone="13800000004", is_active=True, created_at=datetime.now()),
            Team(id=str(uuid4()), name="架子工班组", leader="刘登高", phone="13800000005", is_active=True, created_at=datetime.now()),
        ]
        db.add_all(teams)
        db.flush()
        
        hazard_types = [
            HazardType(id=str(uuid4()), name="临边防护", code="LB-001", description="楼层临边、基坑临边防护缺失", default_fine_amount=500, is_active=True, created_at=datetime.now()),
            HazardType(id=str(uuid4()), name="临时用电", code="YD-001", description="临时用电不规范", default_fine_amount=800, is_active=True, created_at=datetime.now()),
            HazardType(id=str(uuid4()), name="脚手架", code="SJJ-001", description="脚手架搭设不规范", default_fine_amount=1000, is_active=True, created_at=datetime.now()),
            HazardType(id=str(uuid4()), name="高空作业", code="GK-001", description="高空作业未系安全带", default_fine_amount=1500, is_active=True, created_at=datetime.now()),
            HazardType(id=str(uuid4()), name="消防隐患", code="XF-001", description="消防器材缺失或过期", default_fine_amount=600, is_active=True, created_at=datetime.now()),
            HazardType(id=str(uuid4()), name="文明施工", code="WM-001", description="现场脏乱差", default_fine_amount=300, is_active=True, created_at=datetime.now()),
        ]
        db.add_all(hazard_types)
        db.flush()
        
        inspection_points = []
        for floor in range(1, 11):
            for idx, area in enumerate(["A区", "B区", "C区"]):
                inspection_points.append(InspectionPoint(
                    id=str(uuid4()),
                    name=f"{floor}层{area}巡检点",
                    floor=floor,
                    area=area,
                    description=f"楼层{floor} {area} 安全巡检点",
                    is_active=True,
                    created_at=datetime.now(),
                ))
        db.add_all(inspection_points)
        db.flush()
        
        users = [
            User(
                id=str(uuid4()),
                username="director",
                full_name="安全总监-陈安全",
                email="chenanquan@example.com",
                role="director",
                phone="13900000001",
                hashed_password=pwd_context.hash("123456"),
                is_active=True,
                created_at=datetime.now(),
            ),
            User(
                id=str(uuid4()),
                username="admin",
                full_name="系统管理员-管理员",
                email="admin@example.com",
                role="admin",
                phone="13900000002",
                hashed_password=pwd_context.hash("123456"),
                is_active=True,
                created_at=datetime.now(),
            ),
            User(
                id=str(uuid4()),
                username="team_leader_1",
                full_name="张建国（土建一班）",
                email="zhangjianguo@example.com",
                role="team_leader",
                phone="13800000001",
                hashed_password=pwd_context.hash("123456"),
                is_active=True,
                created_at=datetime.now(),
            ),
        ]
        db.add_all(users)
        db.flush()
        
        director = users[0]
        team1 = teams[0]
        team2 = teams[1]
        team3 = teams[2]
        team4 = teams[3]
        
        hazards_data = [
            {"code": "HZ-2024-0001", "title": "3层A区临边防护缺失", "team": team1, "type": hazard_types[0], "level": "high", "status": "pending", "overdue": True, "days_ago": 5, "floor": 3, "fine": 500, "fine_status": "confirmed"},
            {"code": "HZ-2024-0002", "title": "5层B区电缆乱拉乱接", "team": team3, "type": hazard_types[1], "level": "medium", "status": "in_progress", "overdue": False, "days_ago": 2, "floor": 5, "fine": 800, "fine_status": "pending"},
            {"code": "HZ-2024-0003", "title": "7层C区脚手架扫地杆缺失", "team": team4, "type": hazard_types[2], "level": "high", "status": "under_review", "overdue": False, "days_ago": 3, "floor": 7, "fine": 1000, "fine_status": "pending"},
            {"code": "HZ-2024-0004", "title": "2层A区高空作业未系安全带", "team": team2, "type": hazard_types[3], "level": "critical", "status": "closed", "overdue": False, "days_ago": 10, "floor": 2, "fine": 1500, "fine_status": "confirmed"},
            {"code": "HZ-2024-0005", "title": "4层B区灭火器过期", "team": team1, "type": hazard_types[4], "level": "medium", "status": "pending", "overdue": True, "days_ago": 8, "floor": 4, "fine": 600, "fine_status": "confirmed"},
            {"code": "HZ-2024-0006", "title": "6层C区材料堆放混乱", "team": team2, "type": hazard_types[5], "level": "low", "status": "closed", "overdue": False, "days_ago": 15, "floor": 6, "fine": 300, "fine_status": "confirmed"},
            {"code": "HZ-2024-0007", "title": "8层A区洞口防护缺失", "team": team1, "type": hazard_types[0], "level": "high", "status": "in_progress", "overdue": False, "days_ago": 1, "floor": 8, "fine": 500, "fine_status": "pending"},
            {"code": "HZ-2024-0008", "title": "10层B区电箱无门无锁", "team": team3, "type": hazard_types[1], "level": "high", "status": "pending", "overdue": True, "days_ago": 6, "floor": 10, "fine": 800, "fine_status": "confirmed"},
            {"code": "HZ-2024-0009", "title": "1层C区脚手架连墙件不足", "team": team4, "type": hazard_types[2], "level": "medium", "status": "under_review", "overdue": False, "days_ago": 4, "floor": 1, "fine": 1000, "fine_status": "pending"},
            {"code": "HZ-2024-0010", "title": "9层A区临边防护栏杆损坏", "team": team1, "type": hazard_types[0], "level": "high", "status": "pending", "overdue": True, "days_ago": 7, "floor": 9, "fine": 500, "fine_status": "confirmed"},
            {"code": "HZ-2024-0011", "title": "3层B区照明不足", "team": team3, "type": hazard_types[1], "level": "low", "status": "closed", "overdue": False, "days_ago": 20, "floor": 3, "fine": 200, "fine_status": "confirmed"},
            {"code": "HZ-2024-0012", "title": "5层C区工人不戴安全帽", "team": team2, "type": hazard_types[3], "level": "medium", "status": "in_progress", "overdue": False, "days_ago": 2, "floor": 5, "fine": 200, "fine_status": "pending"},
        ]
        
        hazards = []
        for idx, h_data in enumerate(hazards_data):
            discovered_at = datetime.now() - timedelta(days=h_data["days_ago"])
            deadline = discovered_at + timedelta(days=3)
            closed_at = datetime.now() - timedelta(days=h_data["days_ago"] - 2) if h_data["status"] == "closed" else None
            is_overdue = h_data["overdue"]
            
            point_idx = (h_data["floor"] - 1) * 3 + idx % 3
            if point_idx >= len(inspection_points):
                point_idx = 0
            point = inspection_points[point_idx]
            
            hazard = Hazard(
                id=str(uuid4()),
                code=h_data["code"],
                title=h_data["title"],
                description=f"{h_data['title']}，属于{h_data['type'].name}类型隐患，等级{h_data['level']}。",
                level=h_data["level"],
                status=h_data["status"],
                deadline=deadline,
                discovered_at=discovered_at,
                closed_at=closed_at,
                fine_amount=h_data["fine"],
                fine_status=h_data["fine_status"],
                team_id=h_data["team"].id,
                team_name=h_data["team"].name,
                type_id=h_data["type"].id,
                type_name=h_data["type"].name,
                inspection_point_id=point.id,
                inspection_point_floor=h_data["floor"],
                inspection_point_name=point.name,
                discoverer_id=director.id,
                discoverer_name=director.full_name,
                reject_reasons=[],
                created_at=discovered_at,
            )
            hazards.append(hazard)
        
        db.add_all(hazards)
        db.flush()
        
        for hazard, h_data in zip(hazards, hazards_data):
            fine = Fine(
                id=str(uuid4()),
                hazard_id=hazard.id,
                team_id=h_data["team"].id,
                team_name=h_data["team"].name,
                amount=h_data["fine"],
                reason=f"{h_data['title']} - {h_data['type'].name}",
                status=h_data["fine_status"],
                created_at=hazard.discovered_at + timedelta(hours=1),
                confirmed_at=datetime.now() if h_data["fine_status"] == "confirmed" else None,
            )
            db.add(fine)
            
            if h_data["status"] in ["in_progress", "under_review", "closed"]:
                review_result = "pass" if h_data["status"] == "closed" else None
                reviewed_at = hazard.discovered_at + timedelta(days=2) if h_data["status"] in ["closed", "under_review"] else None
                reviewed_by = director.id if h_data["status"] in ["closed", "under_review"] else None
                
                rect = RectificationRecord(
                    id=str(uuid4()),
                    hazard_id=hazard.id,
                    description=f"已完成{h_data['type'].name}整改工作，现场符合安全规范要求。",
                    submitted_by=h_data["team"].leader,
                    submitted_at=hazard.discovered_at + timedelta(days=1),
                    review_result=review_result,
                    reviewed_by=reviewed_by,
                    reviewed_at=reviewed_at,
                    created_at=hazard.discovered_at + timedelta(days=1),
                )
                db.add(rect)
        
        db.commit()
        print("Database initialized successfully!")
        print("Login credentials:")
        print("  director / 123456 (安全总监)")
        print("  admin / 123456 (管理员)")
        print("  team_leader_1 / 123456 (班组长)")
        
    except Exception as e:
        db.rollback()
        print(f"Error initializing database: {e}")
        import traceback
        traceback.print_exc()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    init_db()
