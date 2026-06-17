from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import create_access_token, verify_password, get_password_hash
from app.core.config import settings
from app.models.user import User
from app.schemas.common import UserCreate, UserResponse, Token, UserLogin

router = APIRouter()


@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户名或密码错误",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(status_code=400, detail="账号已被禁用")

    user.last_login_at = __import__("datetime").datetime.utcnow()
    db.commit()

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(subject=user.id, expires_delta=access_token_expires)
    return Token(access_token=access_token, user=user)


@router.post("/register", response_model=UserResponse)
def register(data: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.username == data.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="用户名已存在")
    user = User(
        **data.model_dump(exclude={"password"}),
        password_hash=get_password_hash(data.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/init-demo")
def init_demo_data(db: Session = Depends(get_db)):
    from app.models import Campus, Student, ClassGroup, ClassEnrollment, StudentStatus, ArtMajor
    from app.models.class_group import ClassStatus
    from datetime import date, datetime

    existing = db.query(User).filter(User.username == "admin").first()
    if existing:
        return {"message": "演示数据已存在", "admin_user": "admin / admin123"}

    campus = Campus(name="中央美术学院附中校区", address="北京市朝阳区花家地南街8号", contact_person="张主任", contact_phone="010-12345678")
    db.add(campus)
    db.flush()

    def create_user(username, password, real_name, role, phone=None):
        u = User(
            username=username,
            password_hash=get_password_hash(password),
            real_name=real_name,
            role=role,
            campus_id=campus.id,
            phone=phone,
        )
        db.add(u)
        db.flush()
        return u

    admin = create_user("admin", "admin123", "系统管理员", "admin", "13800000000")
    principal = create_user("principal", "admin123", "李校长", "principal", "13800000001")
    teacher1 = create_user("teacher1", "admin123", "王老师(素描)", "teacher", "13800000002")
    teacher2 = create_user("teacher2", "admin123", "赵老师(色彩)", "teacher", "13800000003")
    parent1 = create_user("parent1", "admin123", "陈女士(陈小明妈妈)", "parent", "13800000010")
    parent2 = create_user("parent2", "admin123", "周先生(周小红爸爸)", "parent", "13800000011")
    operator = create_user("operator", "admin123", "运营-小林", "operator", "13800000020")

    class1 = ClassGroup(
        class_code="CLS2024A001", name="2024届美术集训A班",
        major="fine_arts", class_type="长期集训", max_students=25,
        current_students=23, status=ClassStatus.ONGOING, campus_id=campus.id,
        head_teacher_id=teacher1.id, start_date=datetime(2024, 6, 1),
        end_date=datetime(2025, 1, 31), total_hours=960,
        description="针对央美、清美等名校的高强度集训班",
    )
    class2 = ClassGroup(
        class_code="CLS2024B001", name="2024届美术基础B班",
        major="fine_arts", class_type="基础强化", max_students=20,
        current_students=18, status=ClassStatus.ONGOING, campus_id=campus.id,
        head_teacher_id=teacher2.id, start_date=datetime(2024, 7, 1),
        end_date=datetime(2024, 12, 31), total_hours=480,
        description="素描、色彩、速写基础强化训练",
    )
    class3 = ClassGroup(
        class_code="CLS2024C001", name="2024届编导精品班",
        major="broadcast", class_type="精品小班", max_students=15,
        current_students=12, status=ClassStatus.ONGOING, campus_id=campus.id,
        head_teacher_id=teacher1.id, start_date=datetime(2024, 7, 15),
        end_date=datetime(2024, 12, 15), total_hours=360,
        description="中传、北电编导专业精品课程",
    )
    db.add_all([class1, class2, class3])
    db.flush()

    def create_student(no, name, gender, major, teacher, grade="高三", total=200, remaining=None):
        s = Student(
            student_no=no, name=name, gender=gender,
            birthday=date(2005, 6, 15),
            phone=f"139{str(20000000 + hash(no) % 1000000).zfill(7)}",
            school="北京市第%d中学" % (hash(name) % 10 + 1),
            grade=grade, major=major,
            target_school="中央美术学院",
            enroll_date=date(2024, 6, 1),
            status=StudentStatus.ACTIVE,
            total_hours=total,
            remaining_hours=remaining or total,
            consumed_hours=0 if remaining is None else total - remaining,
            campus_id=campus.id, teacher_id=teacher.id,
        )
        db.add(s)
        db.flush()
        return s

    students = []
    names_m = ["陈小明", "李华", "王梓轩", "张伟", "刘洋", "孙浩然", "周子豪", "吴迪", "郑博文", "徐浩然", "马可", "赵天"]
    names_f = ["周小红", "刘诗雨", "王梓涵", "杨雪", "陈雨琪", "李梦琪", "张婷", "黄思琪", "林诗涵", "许雅婷", "郭雅文", "何雅"]
    for i, n in enumerate(names_m):
        s = create_student(f"STU2024{i+1:03d}", n, "male", ArtMajor.FINE_ARTS if i < 7 else ArtMajor.DESIGN, teacher1 if i < 6 else teacher2, remaining=max(0, 200 - (i*7)))
        students.append(s)
    for i, n in enumerate(names_f):
        s = create_student(f"STU2024{len(names_m)+i+1:03d}", n, "female", ArtMajor.FINE_ARTS if i < 6 else ArtMajor.BROADCAST, teacher1 if i < 6 else teacher2, remaining=max(0, 200 - (i*8)))
        students.append(s)

    for i, s in enumerate(students[:23]):
        ce = ClassEnrollment(class_id=class1.id, student_id=s.id, allocated_hours=200, used_hours=200 - s.remaining_hours, remaining_hours=s.remaining_hours)
        db.add(ce)
    for i, s in enumerate(students[5:23]):
        ce = ClassEnrollment(class_id=class2.id, student_id=s.id, allocated_hours=150, used_hours=80, remaining_hours=70)
        db.add(ce)
    for i, s in enumerate(students[18:30] if len(students) > 18 else students[-12:]):
        ce = ClassEnrollment(class_id=class3.id, student_id=s.id, allocated_hours=360, used_hours=100, remaining_hours=260)
        db.add(ce)

    def add_parent(student, parent_user, rel):
        from app.models import StudentParent
        sp = StudentParent(student_id=student.id, parent_id=parent_user.id, relationship=rel, is_primary=True)
        db.add(sp)

    if students:
        add_parent(students[0], parent1, "母亲")
        add_parent(students[1], parent2, "父亲")

    db.commit()

    return {
        "message": "演示数据初始化完成",
        "accounts": {
            "校长端": "principal / admin123",
            "教师端1(素描)": "teacher1 / admin123",
            "教师端2(色彩)": "teacher2 / admin123",
            "家长端1": "parent1 / admin123",
            "家长端2": "parent2 / admin123",
            "运营端": "operator / admin123",
            "超级管理员": "admin / admin123",
        },
        "统计": {
            "校区数": 1,
            "班级数": 3,
            "学生数": len(students),
            "用户数": 8,
        },
    }
