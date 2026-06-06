from sqlalchemy.orm import Session
from app.database import SessionLocal, engine, Base
from app import models
from app.auth import get_password_hash
from datetime import date, timedelta


def init_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if db.query(models.User).count() == 0:
            seed_data(db)
    finally:
        db.close()


def seed_data(db: Session):
    admin = models.User(
        username="admin",
        email="admin@example.com",
        hashed_password=get_password_hash("admin123"),
        full_name="系统管理员",
        phone="13800000001",
        role=models.UserRole.ADMIN,
        is_active=True
    )
    db.add(admin)

    coordinator = models.User(
        username="coordinator",
        email="coordinator@example.com",
        hashed_password=get_password_hash("coord123"),
        full_name="张协调员",
        phone="13800000002",
        role=models.UserRole.COORDINATOR,
        is_active=True
    )
    db.add(coordinator)

    doctor_user = models.User(
        username="doctor",
        email="doctor@example.com",
        hashed_password=get_password_hash("doctor123"),
        full_name="李医生",
        phone="13800000003",
        role=models.UserRole.DOCTOR,
        is_active=True
    )
    db.add(doctor_user)

    volunteer_user = models.User(
        username="volunteer",
        email="volunteer@example.com",
        hashed_password=get_password_hash("vol123"),
        full_name="王志愿者",
        phone="13800000004",
        role=models.UserRole.VOLUNTEER,
        is_active=True
    )
    db.add(volunteer_user)

    finance = models.User(
        username="finance",
        email="finance@example.com",
        hashed_password=get_password_hash("finance123"),
        full_name="赵财务",
        phone="13800000005",
        role=models.UserRole.FINANCE,
        is_active=True
    )
    db.add(finance)
    db.flush()

    doctor = models.Doctor(
        user_id=doctor_user.id,
        license_number="DOC20240001",
        specialty="内科",
        title="主任医师",
        hospital="市第一人民医院",
        biography="从事内科临床工作20年，擅长常见病、多发病的诊治。",
        is_available=True
    )
    db.add(doctor)

    volunteer = models.Volunteer(
        user_id=volunteer_user.id,
        id_card="110101199001011234",
        skills=["引导", "登记", "药品管理"],
        organization="市志愿者协会",
        total_service_hours=50.0,
        is_available=True
    )
    db.add(volunteer)
    db.flush()

    location1 = models.Location(
        name="阳光社区卫生服务中心",
        address="阳光路123号",
        district="朝阳区",
        city="北京市",
        province="北京市",
        contact_person="陈主任",
        contact_phone="13900000001",
        capacity=50,
        facilities={"诊室": 2, "候诊区": True, "药房": True},
        notes="社区中心，基础设施完善。"
    )
    location2 = models.Location(
        name="幸福村村委会",
        address="幸福乡幸福村1号",
        district="密云区",
        city="北京市",
        province="北京市",
        contact_person="村支书",
        contact_phone="13900000002",
        capacity=30,
        facilities={"诊室": 1, "候诊区": True, "药房": False},
        notes="偏远乡村，需携带药品箱。"
    )
    db.add_all([location1, location2])

    medicines = [
        models.Medicine(name="阿莫西林胶囊", generic_name="阿莫西林", category="抗生素", specification="0.25g*24粒", unit="盒", manufacturer="华北制药", stock_quantity=100, minimum_stock=20),
        models.Medicine(name="布洛芬缓释胶囊", generic_name="布洛芬", category="解热镇痛", specification="0.3g*20粒", unit="盒", manufacturer="中美史克", stock_quantity=80, minimum_stock=15),
        models.Medicine(name="复方感冒灵颗粒", generic_name="复方感冒灵", category="感冒药", specification="10g*15袋", unit="盒", manufacturer="三九医药", stock_quantity=120, minimum_stock=25),
        models.Medicine(name="硝苯地平缓释片", generic_name="硝苯地平", category="心血管", specification="20mg*30片", unit="盒", manufacturer="拜耳", stock_quantity=60, minimum_stock=15),
        models.Medicine(name="蒙脱石散", generic_name="蒙脱石", category="消化系统", specification="3g*10袋", unit="盒", manufacturer="博福-益普生", stock_quantity=90, minimum_stock=20),
        models.Medicine(name="碘伏消毒液", generic_name="碘伏", category="外用消毒", specification="100ml", unit="瓶", manufacturer="利尔康", stock_quantity=50, minimum_stock=10),
        models.Medicine(name="创可贴", generic_name="创可贴", category="外用耗材", specification="100片/盒", unit="盒", manufacturer="云南白药", stock_quantity=200, minimum_stock=30),
        models.Medicine(name="医用口罩", generic_name="医用外科口罩", category="防护用品", specification="50只/盒", unit="盒", manufacturer="振德医疗", stock_quantity=300, minimum_stock=50),
    ]
    db.add_all(medicines)
    db.flush()

    today = date.today()
    next_week = today + timedelta(days=7)

    schedule1 = models.Schedule(
        title="阳光社区义诊活动",
        description="为社区居民提供免费健康检查和基础诊疗服务。",
        doctor_id=doctor.id,
        location_id=1,
        date=next_week,
        start_time="09:00",
        end_time="12:00",
        max_patients=30,
        status=models.ScheduleStatus.PUBLISHED,
        created_by=coordinator.id
    )
    db.add(schedule1)
    db.flush()

    sv1 = models.ScheduleVolunteer(
        schedule_id=schedule1.id,
        volunteer_id=volunteer.id,
        role="药品管理"
    )
    db.add(sv1)

    box1 = models.MedicineBox(
        box_code="BOX001",
        name="社区义诊常备药箱",
        status=models.MedicineBoxStatus.EMPTY,
        current_location="中心药房"
    )
    db.add(box1)
    db.flush()

    box_items = [
        models.MedicineBoxItem(box_id=box1.id, medicine_id=1, packed_quantity=10),
        models.MedicineBoxItem(box_id=box1.id, medicine_id=2, packed_quantity=10),
        models.MedicineBoxItem(box_id=box1.id, medicine_id=3, packed_quantity=15),
        models.MedicineBoxItem(box_id=box1.id, medicine_id=6, packed_quantity=5),
        models.MedicineBoxItem(box_id=box1.id, medicine_id=7, packed_quantity=10),
        models.MedicineBoxItem(box_id=box1.id, medicine_id=8, packed_quantity=20),
    ]
    for item in box_items:
        medicine = db.query(models.Medicine).filter(models.Medicine.id == item.medicine_id).first()
        medicine.stock_quantity -= item.packed_quantity
    db.add_all(box_items)
    box1.status = models.MedicineBoxStatus.PACKED

    db.commit()
    print("种子数据创建完成！")
    print("=" * 50)
    print("测试账号：")
    print("  管理员: admin / admin123")
    print("  协调员: coordinator / coord123")
    print("  医生: doctor / doctor123")
    print("  志愿者: volunteer / vol123")
    print("  财务: finance / finance123")
    print("=" * 50)


if __name__ == "__main__":
    init_db()
