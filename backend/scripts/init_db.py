import sys
import os
from datetime import datetime, timedelta

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal, Base, engine
from app.core.security import get_password_hash
from app.models import (
    User, UserRole,
    Property, PropertyStatus,
    RoomStatus, RoomStatusType,
    CleaningTask, CleaningTaskStatus, CleaningTaskPriority,
    MaintenanceOrder, MaintenanceOrderStatus, MaintenanceType, MaintenancePriority,
    Material
)
from app.services.task_service import TaskService
from app.services.maintenance_service import MaintenanceService


def init_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        print("Creating test users...")

        if not db.query(User).filter(User.username == "admin").first():
            admin = User(
                username="admin",
                email="admin@example.com",
                phone="13800000000",
                full_name="系统管理员",
                role=UserRole.ADMIN,
                hashed_password=get_password_hash("admin123")
            )
            db.add(admin)

        if not db.query(User).filter(User.username == "manager").first():
            manager = User(
                username="manager",
                email="manager@example.com",
                phone="13800000001",
                full_name="运营经理",
                role=UserRole.MANAGER,
                hashed_password=get_password_hash("manager123")
            )
            db.add(manager)

        cleaner_names = ["张阿姨", "李阿姨", "王阿姨", "赵阿姨"]
        for i, name in enumerate(cleaner_names):
            username = f"cleaner{i+1}"
            if not db.query(User).filter(User.username == username).first():
                cleaner = User(
                    username=username,
                    email=f"{username}@example.com",
                    phone=f"1380000001{i+1}",
                    full_name=name,
                    role=UserRole.CLEANER,
                    hashed_password=get_password_hash("cleaner123")
                )
                db.add(cleaner)

        tech_names = ["陈师傅", "刘师傅"]
        for i, name in enumerate(tech_names):
            username = f"tech{i+1}"
            if not db.query(User).filter(User.username == username).first():
                tech = User(
                    username=username,
                    email=f"{username}@example.com",
                    phone=f"1380000002{i+1}",
                    full_name=name,
                    role=UserRole.MAINTENANCE,
                    hashed_password=get_password_hash("tech123")
                )
                db.add(tech)

        db.commit()
        print("Test users created!")

        print("Creating test properties...")
        communities = ["阳光花园", "湖畔小区", "城市公寓", "海景别墅"]
        room_numbers = ["101", "102", "201", "202", "301", "302"]

        property_count = db.query(Property).count()
        if property_count == 0:
            for i, community in enumerate(communities):
                for j in range(3):
                    prop = Property(
                        name=f"{community}-{room_numbers[j]}",
                        community=community,
                        building=f"{i+1}号楼",
                        room_number=room_numbers[j],
                        address=f"测试路{i+1}号 {community} {i+1}号楼 {room_numbers[j]}",
                        area=45 + j * 10,
                        bedroom_count=1 + (j % 2),
                        bathroom_count=1,
                        status=PropertyStatus.ACTIVE
                    )
                    db.add(prop)
            db.commit()
            print("Test properties created!")

        print("Creating test materials...")
        material_count = db.query(Material).count()
        if material_count == 0:
            materials = [
                {"name": "客房清洁剂", "sku": "CL-001", "category": "清洁用品", "unit": "瓶", "unit_price": 25.0, "stock_quantity": 100},
                {"name": "消毒液", "sku": "CL-002", "category": "清洁用品", "unit": "瓶", "unit_price": 18.0, "stock_quantity": 80},
                {"name": "抹布", "sku": "CL-003", "category": "清洁用品", "unit": "条", "unit_price": 5.0, "stock_quantity": 200},
                {"name": "垃圾袋", "sku": "CL-004", "category": "清洁用品", "unit": "卷", "unit_price": 8.0, "stock_quantity": 150},
                {"name": "灯泡", "sku": "MT-001", "category": "维修配件", "unit": "个", "unit_price": 15.0, "stock_quantity": 50},
                {"name": "水龙头密封圈", "sku": "MT-002", "category": "维修配件", "unit": "个", "unit_price": 3.0, "stock_quantity": 100},
            ]
            for mat in materials:
                db.add(Material(**mat))
            db.commit()
            print("Test materials created!")

        print("Creating sample room statuses and tasks...")
        properties = db.query(Property).limit(6).all()
        users = db.query(User).all()
        user_map = {u.username: u for u in users}

        today = datetime.now().date()
        for i, prop in enumerate(properties):
            for day_offset in range(-2, 5):
                date = today + timedelta(days=day_offset)
                existing = db.query(RoomStatus).filter(
                    RoomStatus.property_id == prop.id,
                    RoomStatus.date == date
                ).first()
                if not existing:
                    if day_offset < 0:
                        status = RoomStatusType.AVAILABLE
                    elif day_offset == 0:
                        if i % 3 == 0:
                            status = RoomStatusType.CHECKED_OUT
                        elif i % 3 == 1:
                            status = RoomStatusType.OCCUPIED
                        else:
                            status = RoomStatusType.AVAILABLE
                    else:
                        status = RoomStatusType.AVAILABLE

                    rs = RoomStatus(
                        property_id=prop.id,
                        date=date,
                        status=status,
                        guest_name=f"客人{i+1}" if status in [RoomStatusType.OCCUPIED, RoomStatusType.CHECKED_OUT] else None
                    )
                    db.add(rs)

        db.commit()

        task_count = db.query(CleaningTask).count()
        if task_count == 0:
            checked_out_props = [rs.property_id for rs in db.query(RoomStatus).filter(
                RoomStatus.date == today,
                RoomStatus.status == RoomStatusType.CHECKED_OUT
            ).all()]

            for i, prop_id in enumerate(checked_out_props[:3]):
                task_no = TaskService.generate_task_no()
                scheduled = datetime.now() + timedelta(hours=i)
                task = CleaningTask(
                    task_no=task_no,
                    property_id=prop_id,
                    cleaner_id=user_map[f"cleaner{i+1}"].id if i < 2 else None,
                    created_by=user_map["manager"].id,
                    status=CleaningTaskStatus.ASSIGNED if i < 2 else CleaningTaskStatus.PENDING,
                    priority=CleaningTaskPriority.URGENT if i == 0 else CleaningTaskPriority.NORMAL,
                    scheduled_time=scheduled,
                    deadline_time=scheduled + timedelta(hours=4),
                    estimated_duration=2.0,
                    cleaning_items='["卫生间清洁","卧室整理","厨房清洁","地面消毒"]',
                    description="退房清洁，需要彻底打扫"
                )
                db.add(task)

                if i < 1:
                    rs = db.query(RoomStatus).filter(
                        RoomStatus.property_id == prop_id,
                        RoomStatus.date == today
                    ).first()
                    if rs:
                        rs.status = RoomStatusType.CLEANING
                        rs.current_cleaning_task_id = task.id

            db.commit()
            print("Sample cleaning tasks created!")

        order_count = db.query(MaintenanceOrder).count()
        if order_count == 0:
            for i, prop in enumerate(properties[:2]):
                order_no = MaintenanceService.generate_order_no()
                order = MaintenanceOrder(
                    order_no=order_no,
                    property_id=prop.id,
                    technician_id=user_map["tech1"].id if i == 0 else None,
                    created_by=user_map["manager"].id,
                    status=MaintenanceOrderStatus.ASSIGNED if i == 0 else MaintenanceOrderStatus.PENDING,
                    maintenance_type=MaintenanceType.PLUMBING if i == 0 else MaintenanceType.ELECTRICAL,
                    priority=MaintenancePriority.HIGH,
                    scheduled_time=datetime.now() + timedelta(hours=2),
                    deadline_time=datetime.now() + timedelta(hours=8),
                    estimated_cost=200.0,
                    title="水龙头漏水维修" if i == 0 else "客厅灯不亮",
                    description="卫生间水龙头漏水，需要紧急维修" if i == 0 else "客厅主灯不亮，可能是镇流器问题"
                )
                db.add(order)
            db.commit()
            print("Sample maintenance orders created!")

        print("\n" + "="*60)
        print("数据库初始化完成！")
        print("="*60)
        print("\n测试账号：")
        print("  管理员: admin / admin123")
        print("  运营经理: manager / manager123")
        print("  保洁员: cleaner1 / cleaner123 (张阿姨)")
        print("  保洁员: cleaner2 / cleaner123 (李阿姨)")
        print("  保洁员: cleaner3 / cleaner123 (王阿姨)")
        print("  保洁员: cleaner4 / cleaner123 (赵阿姨)")
        print("  维修工: tech1 / tech123 (陈师傅)")
        print("  维修工: tech2 / tech123 (刘师傅)")
        print("\n" + "="*60)

    except Exception as e:
        print(f"Error initializing database: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    init_db()
