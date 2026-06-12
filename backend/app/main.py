from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from app.config import settings
from app.database import engine, Base
from app.routers import auth, repairs, admin, export

app = FastAPI(title="Dormitory Repair Portal", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(repairs.router)
app.include_router(admin.router)
app.include_router(export.router)

app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")
app.mount("/exports", StaticFiles(directory=settings.EXPORT_DIR), name="exports")


@app.on_event("startup")
def startup():
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    os.makedirs(settings.EXPORT_DIR, exist_ok=True)
    Base.metadata.create_all(bind=engine)
    from app.database import SessionLocal
    from app.models import User, ClubActivity, SecondHandTrade, SeatViolation
    from passlib.context import CryptContext
    db = SessionLocal()
    try:
        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        if not db.query(User).filter(User.username == "admin").first():
            admin = User(
                username="admin",
                password_hash=pwd_context.hash("admin123"),
                real_name="系统管理员",
                role="admin",
            )
            db.add(admin)
        if not db.query(User).filter(User.username == "staff1").first():
            staff = User(
                username="staff1",
                password_hash=pwd_context.hash("staff123"),
                real_name="维修人员1",
                role="staff",
            )
            db.add(staff)
        if not db.query(User).filter(User.username == "student1").first():
            student = User(
                username="student1",
                password_hash=pwd_context.hash("student123"),
                real_name="张三",
                student_id="2024001",
                dorm_room="A-301",
                phone="13800138000",
                role="student",
            )
            db.add(student)
        if not db.query(User).filter(User.username == "student2").first():
            student2 = User(
                username="student2",
                password_hash=pwd_context.hash("student123"),
                real_name="李四",
                student_id="2024002",
                dorm_room="B-205",
                phone="13800138001",
                role="student",
            )
            db.add(student2)

        if db.query(ClubActivity).count() == 0:
            activities = [
                ClubActivity(title="迎新晚会", description="欢迎新同学加入我们的大家庭", organizer="学生会", location="大礼堂", status="upcoming"),
                ClubActivity(title="编程竞赛", description="展示你的编程能力，赢取丰厚奖品", organizer="计算机协会", location="教学楼A座", status="upcoming"),
                ClubActivity(title="篮球比赛", description="各学院之间的篮球对决", organizer="体育部", location="篮球场", status="ongoing"),
                ClubActivity(title="志愿者活动", description="去社区帮助需要帮助的人", organizer="志愿者协会", location="社区中心", status="upcoming"),
                ClubActivity(title="音乐节", description="一年一度的校园音乐盛会", organizer="音乐协会", location="操场", status="upcoming"),
            ]
            db.add_all(activities)

        if db.query(SecondHandTrade).count() == 0:
            db.commit()
            student_id = db.query(User).filter(User.username == "student1").first().id
            trades = [
                SecondHandTrade(title="高等数学教材", description="九成新，包含习题解答", price=30.0, category="书籍", seller_id=student_id, contact="QQ: 123456", status="available"),
                SecondHandTrade(title="机械键盘", description="樱桃红轴，使用半年", price=200.0, category="电子设备", seller_id=student_id, contact="微信: abc123", status="available"),
                SecondHandTrade(title="台灯", description="护眼LED台灯，可调节亮度", price=50.0, category="生活用品", seller_id=student_id, contact="电话: 13800138000", status="available"),
                SecondHandTrade(title="耳机", description="降噪耳机，音质优秀", price=300.0, category="电子设备", seller_id=student_id, contact="QQ: 654321", status="available"),
            ]
            db.add_all(trades)

        if db.query(SeatViolation).count() == 0:
            db.commit()
            student_id = db.query(User).filter(User.username == "student1").first().id
            student2_id = db.query(User).filter(User.username == "student2").first().id
            violations = [
                SeatViolation(student_id=student_id, seat_number="A-01", library_room="自习室一区", violation_type="占座超时"),
                SeatViolation(student_id=student2_id, seat_number="B-15", library_room="自习室二区", violation_type="未签到"),
                SeatViolation(student_id=student_id, seat_number="C-08", library_room="自习室三区", violation_type="提前离开"),
            ]
            db.add_all(violations)

        db.commit()
    except Exception:
        db.rollback()
    finally:
        db.close()
