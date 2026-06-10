from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.core.security import get_password_hash
from app.models.user import User, UserRole
from app.models.dictionary import DictionaryType, DictionaryItem, SystemConfig
from app.models.position import Position
from app.models.candidate import Candidate
from app.models.todo import ReminderRule


def init_dictionary(db: Session):
    types = [
        {"type_code": "source_channel", "type_name": "招聘渠道", "is_system": True,
         "description": "候选人投递渠道"},
        {"type_code": "degree", "type_name": "学历", "is_system": True,
         "description": "候选人学历等级"},
        {"type_code": "job_type", "type_name": "职位类型", "is_system": True,
         "description": "职位类型分类"},
        {"type_code": "interview_type", "type_name": "面试类型", "is_system": True,
         "description": "面试方式分类"},
        {"type_code": "application_status", "type_name": "投递状态", "is_system": True,
         "description": "候选人投递状态"},
        {"type_code": "priority", "type_name": "优先级", "is_system": True,
         "description": "待办事项优先级"},
    ]

    items_map = {
        "source_channel": [
            {"item_code": "campus", "item_value": "校园招聘", "sort_order": 1},
            {"item_code": "online", "item_value": "官网投递", "sort_order": 2},
            {"item_code": "referral", "item_value": "内部推荐", "sort_order": 3},
            {"item_code": "zhaopin", "item_value": "智联招聘", "sort_order": 4},
            {"item_code": "liepin", "item_value": "猎聘", "sort_order": 5},
            {"item_code": "boss", "item_value": "BOSS直聘", "sort_order": 6},
        ],
        "degree": [
            {"item_code": "bachelor", "item_value": "本科", "sort_order": 1},
            {"item_code": "master", "item_value": "硕士", "sort_order": 2},
            {"item_code": "doctor", "item_value": "博士", "sort_order": 3},
            {"item_code": "college", "item_value": "大专", "sort_order": 4},
        ],
        "job_type": [
            {"item_code": "full_time", "item_value": "全职", "sort_order": 1},
            {"item_code": "intern", "item_value": "实习", "sort_order": 2},
            {"item_code": "campus", "item_value": "校招", "sort_order": 3},
        ],
        "interview_type": [
            {"item_code": "phone", "item_value": "电话面试", "sort_order": 1},
            {"item_code": "video", "item_value": "视频面试", "sort_order": 2},
            {"item_code": "onsite", "item_value": "现场面试", "sort_order": 3},
            {"item_code": "assessment", "item_value": "测评", "sort_order": 4},
        ],
    }

    for t in types:
        existing = db.query(DictionaryType).filter(DictionaryType.type_code == t["type_code"]).first()
        if not existing:
            dict_type = DictionaryType(**t)
            db.add(dict_type)
            db.flush()

            if t["type_code"] in items_map:
                for item in items_map[t["type_code"]]:
                    db.add(DictionaryItem(
                        type_id=dict_type.id,
                        item_label=item["item_value"],
                        **item,
                    ))

    db.commit()


def init_system_configs(db: Session):
    configs = [
        {"config_key": "interview_reminder_hours", "config_value": "24", "config_label": "面试提前提醒小时数",
         "config_type": "number", "group_name": "reminder", "description": "面试开始前多少小时发送提醒"},
        {"config_key": "stage_timeout_days", "config_value": "7", "config_label": "阶段超时天数",
         "config_type": "number", "group_name": "reminder", "description": "状态停留超过多少天触发升级催办"},
        {"config_key": "max_interview_per_day", "config_value": "8", "config_label": "每日最大面试数",
         "config_type": "number", "group_name": "interview", "description": "每人每日最大面试安排数量"},
        {"config_key": "default_assessment_duration", "config_value": "60", "config_label": "默认测评时长(分钟)",
         "config_type": "number", "group_name": "assessment", "description": "默认测评考试时长"},
        {"config_key": "offer_validity_days", "config_value": "7", "config_label": "Offer有效期(天)",
         "config_type": "number", "group_name": "offer", "description": "Offer发放后有效期天数"},
        {"config_key": "escalation_hours", "config_value": "48", "config_label": "待办升级时间(小时)",
         "config_type": "number", "group_name": "reminder", "description": "待办未处理多少小时后自动升级"},
        {"config_key": "reminder_frequency_minutes", "config_value": "60", "config_label": "提醒频率(分钟)",
         "config_type": "number", "group_name": "reminder", "description": "重复提醒的间隔时间"},
    ]

    for c in configs:
        existing = db.query(SystemConfig).filter(SystemConfig.config_key == c["config_key"]).first()
        if not existing:
            db.add(SystemConfig(**c))

    db.commit()


def init_reminder_rules(db: Session):
    rules = [
        {"rule_name": "面试24小时提醒", "rule_type": "interview_reminder",
         "reminder_frequency_minutes": 60, "max_reminders": 3,
         "description": "面试开始前24小时开始提醒"},
        {"rule_name": "阶段超时催办", "rule_type": "stage_timeout",
         "reminder_frequency_minutes": 1440, "max_reminders": 5,
         "escalation_minutes": 1440,
         "description": "状态停留超时自动升级催办"},
        {"rule_name": "Offer回复提醒", "rule_type": "offer_followup",
         "reminder_frequency_minutes": 720, "max_reminders": 3,
         "description": "Offer发出后提醒候选人回复"},
    ]

    for r in rules:
        existing = db.query(ReminderRule).filter(ReminderRule.rule_name == r["rule_name"]).first()
        if not existing:
            db.add(ReminderRule(**r))

    db.commit()


def init_users(db: Session):
    users = [
        {
            "username": "admin",
            "email": "admin@qinghe.com",
            "password": "admin123",
            "full_name": "系统管理员",
            "role": UserRole.ADMIN,
            "department": "人力资源部",
        },
        {
            "username": "recruiter",
            "email": "recruiter@qinghe.com",
            "password": "recruiter123",
            "full_name": "张招聘",
            "role": UserRole.RECRUITER,
            "department": "人力资源部",
        },
        {
            "username": "candidate1",
            "email": "candidate1@example.com",
            "password": "candidate123",
            "full_name": "李同学",
            "role": UserRole.CANDIDATE,
        },
    ]

    for u in users:
        existing = db.query(User).filter(User.username == u["username"]).first()
        if not existing:
            hashed = get_password_hash(u["password"])
            user = User(
                username=u["username"],
                email=u["email"],
                hashed_password=hashed,
                full_name=u["full_name"],
                role=u["role"],
                department=u.get("department"),
                is_active=True,
            )
            db.add(user)
            db.flush()

            if u["role"] == UserRole.CANDIDATE:
                candidate = Candidate(
                    user_id=user.id,
                    name=u["full_name"],
                    email=u["email"],
                    university="清华大学",
                    major="计算机科学与技术",
                    degree="master",
                    graduation_year=2025,
                    gpa="3.8/4.0",
                    source_channel="campus",
                    phone="13800138000",
                    city="北京",
                )
                db.add(candidate)

    db.commit()


def init_positions(db: Session):
    positions = [
        {
            "title": "后端开发工程师（校招）",
            "department": "技术部",
            "job_type": "campus",
            "city": "北京",
            "salary_range": "20k-30k",
            "description": "参与公司核心后端系统开发，使用 Python/Go 等技术栈。",
            "requirements": "计算机相关专业，熟悉数据结构与算法。",
            "headcount": 5,
        },
        {
            "title": "前端开发工程师（校招）",
            "department": "技术部",
            "job_type": "campus",
            "city": "北京",
            "salary_range": "18k-28k",
            "description": "参与公司前端产品开发，使用 Vue/React 等技术栈。",
            "requirements": "熟悉 HTML/CSS/JS，有 React 或 Vue 项目经验。",
            "headcount": 3,
        },
        {
            "title": "产品经理（校招）",
            "department": "产品部",
            "job_type": "campus",
            "city": "北京",
            "salary_range": "18k-25k",
            "description": "负责产品规划、需求分析和项目跟进。",
            "requirements": "有产品相关实习经验，逻辑思维清晰。",
            "headcount": 2,
        },
    ]

    admin = db.query(User).filter(User.username == "admin").first()
    if admin:
        for p in positions:
            existing = db.query(Position).filter(Position.title == p["title"]).first()
            if not existing:
                db.add(Position(**p, created_by=admin.id, is_active=True))
        db.commit()


def init_all():
    db = SessionLocal()
    try:
        init_dictionary(db)
        init_system_configs(db)
        init_reminder_rules(db)
        init_users(db)
        init_positions(db)
        print("初始化数据完成！")
        print("默认账号:")
        print("  管理员: admin / admin123")
        print("  招聘员: recruiter / recruiter123")
        print("  候选人: candidate1 / candidate123")
    finally:
        db.close()


if __name__ == "__main__":
    init_all()
