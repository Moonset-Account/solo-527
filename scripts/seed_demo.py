import asyncio
import random
from datetime import datetime, date, timedelta, time
from decimal import Decimal

from app.database import async_session
from app.models import (
    User, UserRole, UserStatus, Campus, Classroom, Course, CourseStatus,
    CourseClass, Student, StudentParent, HourPackage, StudentHourPackage,
    Enrollment, Schedule, ScheduleStatus, Attendance, AttendanceStatus,
    HourConsumption, DataEnvironment, TeacherHourRate, Lead, LeadSource,
    LeadStatus, LeadFollowUp, Homework, HomeworkStatus, HomeworkSubmission,
    Notification, NotificationType, PaymentStatus
)
from app.security import hash_password


async def seed_demo_data():
    print("🎲 开始生成演示数据...")
    async with async_session() as db:
        campus1 = Campus(name="松石编程·朝阳校区", address="北京市朝阳区建国路88号", phone="010-88880001", is_demo=True, environment=DataEnvironment.DEMO)
        campus2 = Campus(name="松石编程·海淀校区", address="北京市海淀区中关村大街1号", phone="010-88880002", is_demo=True, environment=DataEnvironment.DEMO)
        db.add_all([campus1, campus2])
        await db.flush()

        rooms = [
            Classroom(name="A101", campus_id=campus1.id, capacity=20, is_demo=True),
            Classroom(name="A102", campus_id=campus1.id, capacity=15, is_demo=True),
            Classroom(name="B201", campus_id=campus1.id, capacity=25, equipment={"projector": True}, is_demo=True),
            Classroom(name="A101", campus_id=campus2.id, capacity=20, is_demo=True),
            Classroom(name="A102", campus_id=campus2.id, capacity=20, is_demo=True),
            Classroom(name="机器人室", campus_id=campus2.id, capacity=15, equipment={"robotics_kit": True}, is_demo=True),
        ]
        db.add_all(rooms)
        await db.flush()

        demo_users = [
            {"email": "demo_principal@songshi.com", "phone": "13800000001", "username": "demo_principal",
             "real_name": "演示校长", "role": UserRole.PRINCIPAL, "campus_id": campus1.id, "gender": "男"},
            {"email": "demo_admin@songshi.com", "phone": "13800000002", "username": "demo_admin",
             "real_name": "演示管理员", "role": UserRole.ADMIN, "campus_id": campus1.id, "gender": "女"},
            {"email": "demo_staff@songshi.com", "phone": "13800000003", "username": "demo_staff",
             "real_name": "演示教务", "role": UserRole.STAFF, "campus_id": campus1.id, "gender": "女"},
            {"email": "demo_teacher1@songshi.com", "phone": "13800000004", "username": "demo_teacher1",
             "real_name": "张老师(Scratch)", "role": UserRole.TEACHER, "campus_id": campus1.id, "gender": "男"},
            {"email": "demo_teacher2@songshi.com", "phone": "13800000005", "username": "demo_teacher2",
             "real_name": "李老师(Python)", "role": UserRole.TEACHER, "campus_id": campus1.id, "gender": "女"},
            {"email": "demo_teacher3@songshi.com", "phone": "13800000006", "username": "demo_teacher3",
             "real_name": "王老师(C++)", "role": UserRole.TEACHER, "campus_id": campus2.id, "gender": "男"},
            {"email": "demo_parent1@songshi.com", "phone": "13900000001", "username": "demo_parent1",
             "real_name": "小明爸爸", "role": UserRole.PARENT, "gender": "男"},
            {"email": "demo_parent2@songshi.com", "phone": "13900000002", "username": "demo_parent2",
             "real_name": "小红妈妈", "role": UserRole.PARENT, "gender": "女"},
            {"email": "demo_parent3@songshi.com", "phone": "13900000003", "username": "demo_parent3",
             "real_name": "小刚妈妈", "role": UserRole.PARENT, "gender": "女"},
        ]
        created_users = []
        for u in demo_users:
            user = User(
                **u, hashed_password=hash_password("Demo@123456"),
                status=UserStatus.ACTIVE,
                is_demo=True, environment=DataEnvironment.DEMO,
            )
            db.add(user)
            created_users.append(user)
        await db.flush()

        teacher_ids = [u.id for u in created_users if u.role == UserRole.TEACHER]
        for tid in teacher_ids:
            for i, base in enumerate([150, 200]):
                rate = TeacherHourRate(
                    teacher_id=tid,
                    effective_from=date(2025, 1+i, 1),
                    base_rate=Decimal(base),
                    overtime_rate=Decimal(base*1.5),
                    is_demo=True,
                )
                db.add(rate)
        await db.flush()

        courses_data = [
            {"name": "Scratch启蒙班", "code": "DEMO-SCR-01", "category": "Scratch", "level": "入门",
             "description": "通过积木式编程，培养6-8岁孩子的计算思维", "total_hours": 32, "default_sessions": 16,
             "default_duration": 90, "price": 3200.00},
            {"name": "Scratch进阶班", "code": "DEMO-SCR-02", "category": "Scratch", "level": "进阶",
             "description": "复杂游戏和动画制作，适合8-10岁", "total_hours": 48, "default_sessions": 24,
             "default_duration": 90, "price": 5280.00},
            {"name": "Python入门", "code": "DEMO-PYT-01", "category": "Python", "level": "入门",
             "description": "Python语言基础，适合10岁以上", "total_hours": 64, "default_sessions": 32,
             "default_duration": 120, "price": 7680.00},
            {"name": "Python游戏开发", "code": "DEMO-PYT-02", "category": "Python", "level": "进阶",
             "description": "Pygame游戏项目实战", "total_hours": 48, "default_sessions": 24,
             "default_duration": 120, "price": 6720.00},
            {"name": "机器人入门", "code": "DEMO-ROB-01", "category": "机器人", "level": "入门",
             "description": "积木搭建+图形化编程", "total_hours": 36, "default_sessions": 18,
             "default_duration": 120, "price": 5400.00},
        ]
        created_courses = []
        for c in courses_data:
            course = Course(**c, status=CourseStatus.PUBLISHED, is_demo=True, environment=DataEnvironment.DEMO)
            db.add(course)
            created_courses.append(course)
        await db.flush()

        packages = [
            HourPackage(name=f"{c.name}课时包", course_id=c.id, total_hours=c.total_hours,
                        bonus_hours=random.choice([0, 2, 4, 6]),
                        price=Decimal(c.price), valid_days=365, description=f"{c.name}标准套餐", is_demo=True, environment=DataEnvironment.DEMO)
            for c in created_courses
        ]
        db.add_all(packages)
        await db.flush()

        classes = []
        for i, course in enumerate(created_courses):
            for j, campus in enumerate([campus1, campus2]):
                cls = CourseClass(
                    name=f"{course.name}-{campus.name[:2]}{j+1}班",
                    course_id=course.id, campus_id=campus.id, max_students=15,
                    start_date=date(2026, 6, 1), end_date=date(2026, 12, 31),
                    status=CourseStatus.PUBLISHED,
                    is_demo=True, environment=DataEnvironment.DEMO,
                )
                classes.append(cls)
        db.add_all(classes)
        await db.flush()

        first_names = ["明", "红", "强", "芳", "伟", "丽", "华", "磊", "敏", "涛",
                       "静", "鑫", "宇", "欣", "然", "睿", "畅", "雨", "洋", "乐"]
        surnames = ["王", "李", "张", "刘", "陈", "杨", "黄", "赵", "周", "吴",
                    "徐", "孙", "马", "朱", "胡", "郭", "何", "林", "高", "罗"]
        grades = ["一年级", "二年级", "三年级", "四年级", "五年级", "六年级",
                  "初一", "初二", "初三"]
        schools = ["朝阳实验小学", "中关村一小", "人民大学附属小学", "朝阳区外国语学校",
                   "北京大学附属小学", "海淀实验小学", "清华附小"]

        created_students = []
        for i in range(25):
            sname = random.choice(surnames) + random.choice(first_names) + (random.choice(first_names) if random.random() > 0.3 else "")
            age = random.randint(6, 15)
            byear = date.today().year - age
            student = Student(
                name=sname,
                gender=random.choice(["男", "女"]),
                birthday=date(byear, random.randint(1,12), random.randint(1,28)),
                school=random.choice(schools),
                grade=grades[max(0, min(age-6, 8))],
                phone=f"139{random.randint(10000000, 99999999)}",
                address=f"北京市朝阳区小区{i+1}号楼",
                is_active=True, is_demo=True, environment=DataEnvironment.DEMO,
            )
            created_students.append(student)
            db.add(student)
        await db.flush()

        parent_users = [u for u in created_users if u.role == UserRole.PARENT]
        for i, stu in enumerate(created_students[:10]):
            pu = parent_users[i % len(parent_users)]
            sp = StudentParent(student_id=stu.id, parent_id=pu.id,
                               relationship=random.choice(["爸爸", "妈妈", "爷爷", "奶奶"]),
                               is_primary=(i%3==0), is_demo=True)
            db.add(sp)

        created_student_pkgs = []
        for student in created_students[:20]:
            pkg = random.choice(packages)
            valid_from = date.today() - timedelta(days=random.randint(0, 60))
            valid_to = valid_from + timedelta(days=pkg.valid_days)
            used = random.randint(0, pkg.total_hours // 3)
            sp = StudentHourPackage(
                student_id=student.id, package_id=pkg.id,
                valid_from=valid_from, valid_to=valid_to,
                total_hours=pkg.total_hours + pkg.bonus_hours,
                used_hours=used,
                payment_status=random.choice([PaymentStatus.PAID, PaymentStatus.PAID, PaymentStatus.PARTIAL, PaymentStatus.UNPAID]),
                paid_amount=pkg.price if random.random() > 0.2 else Decimal(pkg.price) * Decimal("0.5"),
                is_demo=True, environment=DataEnvironment.DEMO,
            )
            created_student_pkgs.append(sp)
            db.add(sp)
        await db.flush()

        enrollments = []
        for student in created_students[:18]:
            for _ in range(random.randint(1, 2)):
                cls = random.choice(classes)
                if not any(e.student_id == student.id and e.course_class_id == cls.id for e in enrollments):
                    sp_match = [p for p in created_student_pkgs
                                if p.student_id == student.id]
                    enrollment = Enrollment(
                        student_id=student.id,
                        course_class_id=cls.id,
                        package_id=sp_match[0].id if sp_match else None,
                        enrolled_at=datetime.utcnow() - timedelta(days=random.randint(7, 60)),
                        is_demo=True, environment=DataEnvironment.DEMO,
                    )
                    enrollments.append(enrollment)
                    db.add(enrollment)
        await db.flush()

        schedules = []
        start_date = date.today() - timedelta(days=30)
        end_date = date.today() + timedelta(days=30)
        weekdays_selected = [0, 2, 4, 5, 6]
        time_slots = [
            (time(9, 0), time(10, 30)),
            (time(10, 45), time(12, 15)),
            (time(14, 0), time(15, 30)),
            (time(15, 45), time(17, 15)),
            (time(18, 30), time(20, 0)),
        ]
        for cls in classes:
            cur = start_date
            session_no = 1
            campus_rooms = [r for r in rooms if r.campus_id == cls.campus_id]
            course_teachers = teacher_ids[:2] if cls.campus_id == campus1.id else teacher_ids[2:]
            while cur <= end_date:
                if cur.weekday() in random.sample(weekdays_selected, random.randint(2, 3)):
                    for _ in range(random.randint(0, 1)):
                        if not campus_rooms or not course_teachers:
                            continue
                        tslot = random.choice(time_slots)
                        tid = random.choice(course_teachers)
                        rid = random.choice(campus_rooms).id
                        is_past = cur < date.today()
                        schedule = Schedule(
                            course_class_id=cls.id,
                            teacher_id=tid, classroom_id=rid,
                            schedule_date=cur,
                            start_time=tslot[0], end_time=tslot[1],
                            duration_minutes=90 if tslot[1].hour-tslot[0].hour==1 else 120,
                            status=ScheduleStatus.CONDUCTED if is_past and random.random()>0.1 else ScheduleStatus.SCHEDULED,
                            session_no=session_no,
                            topic=f"{cls.name} 第{session_no}节：内容{random.choice(['学习循环结构', '制作动画', '函数入门', '项目练习', '测验与讲评'])}",
                            created_by=created_users[2].id,
                            is_demo=True, environment=DataEnvironment.DEMO,
                        )
                        schedules.append(schedule)
                        session_no += 1
                cur += timedelta(days=1)
        db.add_all(schedules)
        await db.flush()

        past_schedules = [s for s in schedules if s.status == ScheduleStatus.CONDUCTED]
        attendances = []
        consumptions = []
        for schedule in past_schedules:
            cls_enrollments = [e for e in enrollments if e.course_class_id == schedule.course_class_id]
            for enrollment in cls_enrollments:
                status = random.choices(
                    [AttendanceStatus.PRESENT, AttendanceStatus.ABSENT, AttendanceStatus.LATE, AttendanceStatus.LEAVE],
                    weights=[70, 10, 12, 8]
                )[0]
                att = Attendance(
                    schedule_id=schedule.id,
                    student_id=enrollment.student_id,
                    enrollment_id=enrollment.id,
                    status=status,
                    check_in_time=datetime.combine(schedule.schedule_date, schedule.start_time) - timedelta(minutes=random.randint(10, 30)) if status in [AttendanceStatus.PRESENT, AttendanceStatus.LATE] else None,
                    recorded_by=created_users[2].id,
                    is_demo=True, environment=DataEnvironment.DEMO,
                )
                attendances.append(att)

                if status in [AttendanceStatus.PRESENT, AttendanceStatus.LATE, AttendanceStatus.MAKEUP]:
                    pkg_match = [p for p in created_student_pkgs if p.student_id == enrollment.student_id]
                    if pkg_match:
                        sp = pkg_match[0]
                        hours = round(schedule.duration_minutes / 60.0, 2)
                        hc = HourConsumption(
                            student_package_id=sp.id,
                            schedule_id=schedule.id,
                            attendance_id=None,
                            hours_used=hours,
                            consumed_at=datetime.combine(schedule.schedule_date, schedule.end_time),
                            is_demo=True, environment=DataEnvironment.DEMO,
                        )
                        consumptions.append(hc)
        db.add_all(attendances)
        db.add_all(consumptions)
        await db.flush()

        source_names = list(LeadSource)
        status_names = list(LeadStatus)
        staff_ids = [u.id for u in created_users if u.role in [UserRole.STAFF, UserRole.PRINCIPAL, UserRole.ADMIN]]
        leads = []
        for i in range(40):
            sname = random.choice(surnames) + random.choice(["先生", "女士"])
            lead_status = random.choices(status_names, weights=[15, 20, 15, 10, 10, 15, 15])[0]
            lead = Lead(
                name=sname,
                phone=f"138{random.randint(10000000, 99999999)}",
                email=f"lead{i}@demo.com" if random.random()>0.5 else None,
                student_name=random.choice(surnames)+random.choice(first_names),
                student_age=random.randint(5, 15),
                student_grade=random.choice(grades),
                source=random.choice(source_names),
                status=lead_status,
                campus_id=random.choice([campus1.id, campus2.id]),
                created_by=created_users[2].id,
                assigned_to=random.choice(staff_ids),
                remarks=random.choice([
                    "对Scratch兴趣浓厚，计划本周试听",
                    "孩子数学基础好，推荐Python课程",
                    "竞赛升学需求，需要详细咨询",
                    "价格比较敏感，等待优惠活动",
                    "先报机器人启蒙班体验",
                    None, None
                ]),
                follow_up_count=random.randint(0, 5),
                converted_at=datetime.utcnow() - timedelta(days=random.randint(1, 30)) if lead_status == LeadStatus.CONVERTED else None,
                is_demo=True, environment=DataEnvironment.DEMO,
            )
            leads.append(lead)
        db.add_all(leads)
        await db.flush()

        converted_ids = [l.id for l in leads if l.status == LeadStatus.CONVERTED]
        for i, lid in enumerate(converted_ids):
            if i < len(created_students):
                student = created_students[i]
                lead = next(l for l in leads if l.id == lid)
                lead.student_id = student.id
                lead.student_name = student.name
                lead.phone = student.phone or lead.phone

        lead_followups = []
        for lead in leads:
            for i in range(lead.follow_up_count):
                fu = LeadFollowUp(
                    lead_id=lead.id,
                    followed_by=random.choice(staff_ids),
                    method=random.choice(["phone", "wechat", "visit", "other"]),
                    content=random.choice([
                        "电话沟通，对方表示兴趣较高",
                        "微信发送课程资料和价格",
                        "上门咨询，参观了教室和设备",
                        "参加了试听课程，孩子很喜欢",
                        "二次跟进，考虑课程时间安排",
                    ]),
                    result=random.choice(["预约试听", "需要考虑", "暂时不报", "已转化", None]),
                    next_action=datetime.utcnow() + timedelta(days=random.randint(1, 7)),
                    is_demo=True,
                )
                lead_followups.append(fu)
        db.add_all(lead_followups)
        await db.flush()

        past_classes_ids = list(set(s.course_class_id for s in past_schedules))
        for ci in past_classes_ids[:5]:
            hw = Homework(
                title=random.choice([
                    "第一单元课后练习：角色移动",
                    "循环结构作业：绘制图形",
                    "变量练习：计算小游戏",
                    "函数作业：封装代码块",
                    "项目作业：制作故事动画",
                ]),
                description="请根据课堂所学内容完成下列练习，并上传代码和截图。",
                course_class_id=ci,
                schedule_id=random.choice(past_schedules).id,
                created_by=random.choice(teacher_ids),
                deadline=datetime.utcnow() + timedelta(days=random.randint(-10, 5)),
                total_points=random.choice([100, 80, 120]),
                is_demo=True, environment=DataEnvironment.DEMO,
            )
            db.add(hw)
            await db.flush()

            cls_enrollments = [e for e in enrollments if e.course_class_id == ci]
            for enrollment in cls_enrollments[:random.randint(5, 12)]:
                submitted = random.random() > 0.3
                reviewed = submitted and random.random() > 0.5
                hs = HomeworkSubmission(
                    homework_id=hw.id,
                    student_id=enrollment.student_id,
                    content="def main():\n    print('Hello World')\n\nmain()",
                    submitted_at=datetime.utcnow() - timedelta(hours=random.randint(1, 48)) if submitted else None,
                    status=(HomeworkStatus.REVIEWED if reviewed
                            else HomeworkStatus.SUBMITTED if submitted
                            else HomeworkStatus.OVERDUE if datetime.utcnow() > hw.deadline
                            else HomeworkStatus.PENDING),
                    score=random.randint(60, 100) if reviewed else None,
                    feedback=random.choice([
                        "作业完成认真，代码逻辑清晰，继续加油！",
                        "整体不错，注意优化循环结构",
                        "完成度高，附加题也做了，值得表扬！",
                        None,
                    ]) if reviewed else None,
                    reviewed_by=random.choice(teacher_ids) if reviewed else None,
                    reviewed_at=datetime.utcnow() - timedelta(minutes=random.randint(30, 1440)) if reviewed else None,
                    is_demo=True,
                )
                db.add(hs)

        notifications = []
        for u in created_users:
            for i in range(random.randint(2, 6)):
                ntype = random.choice(list(NotificationType))
                titles = {
                    NotificationType.CLASS_REMINDER: "【上课提醒】明天有您的课程",
                    NotificationType.HOMEWORK: "【作业通知】新的课后练习已发布",
                    NotificationType.FEEDBACK: "【作业反馈】老师已点评孩子作业",
                    NotificationType.HOURS_LOW: "【课时预警】剩余课时不足3节，请及时续费",
                    NotificationType.NOTICE: random.choice(["【系统公告】端午节放假通知", "【活动通知】暑期班开始招生", "【通知】新学期课时费调整公告"]),
                    NotificationType.SCHEDULE_CHANGE: "【排课变更】排课时间有调整",
                }
                n = Notification(
                    recipient_id=u.id,
                    notification_type=ntype,
                    title=titles[ntype],
                    content=random.choice([
                        "请您留意时间安排，准时参加。",
                        "感谢您的支持与配合！",
                        "有任何问题请联系教务老师。",
                    ]),
                    status=random.choice(["pending", "sent", "read"]),
                    sent_at=datetime.utcnow() - timedelta(hours=random.randint(1, 500)),
                    read_at=datetime.utcnow() - timedelta(hours=random.randint(0, 400)) if random.random() > 0.4 else None,
                    is_demo=True, environment=DataEnvironment.DEMO,
                )
                notifications.append(n)
        db.add_all(notifications)
        await db.commit()

        print("✅ 演示数据生成完成！")
        print(f"   - 用户: {len(demo_users)}")
        print(f"   - 学员: {len(created_students)}")
        print(f"   - 班级: {len(classes)}")
        print(f"   - 排课: {len(schedules)}")
        print(f"   - 线索: {len(leads)}")
        print(f"   - 作业: 已生成")
        print("\n🎯 演示账号 (密码都是 Demo@123456):")
        for u in demo_users:
            print(f"   - {u['real_name']}: {u['email']}")


if __name__ == "__main__":
    asyncio.run(seed_demo_data())
