import asyncio
import os
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from passlib.context import CryptContext
from sqlalchemy import select

from app.api import auth, dict, events, notifications, rules
from app.config import settings
from app.database import Base, async_session, engine
from app.models.dict import DictCategory, DictItem
from app.models.event import Event, EventFlow, EventPhoto
from app.models.notification import Notification
from app.models.rule import Rule
from app.models.user import User

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


async def seed_demo_data():
    async with async_session() as db:
        from sqlalchemy import func

        count_result = await db.execute(select(func.count(User.id)))
        if count_result.scalar() > 0:
            return

        users = [
            User(username="worker1", password_hash=pwd_context.hash("changeme"), role="grid_worker", name="张网格"),
            User(username="worker2", password_hash=pwd_context.hash("changeme"), role="grid_worker", name="赵巡查"),
            User(username="handler1", password_hash=pwd_context.hash("changeme"), role="handler", name="王维修"),
            User(username="handler2", password_hash=pwd_context.hash("changeme"), role="handler", name="刘环保"),
            User(username="handler3", password_hash=pwd_context.hash("changeme"), role="handler", name="周监理"),
            User(username="handler4", password_hash=pwd_context.hash("changeme"), role="handler", name="吴电工"),
            User(username="manager1", password_hash=pwd_context.hash("changeme"), role="biz_owner", name="李负责"),
            User(username="admin1", password_hash=pwd_context.hash("changeme"), role="admin", name="王管理"),
        ]
        db.add_all(users)
        await db.commit()
        for u in users:
            await db.refresh(u)

        categories = [
            DictCategory(code="event_type", name="事件类型", description="事件上报的分类"),
            DictCategory(code="photo_tag", name="设施照片标签", description="设施照片的分类标签"),
            DictCategory(code="publication_type", name="结果公示类型", description="结果公示的分类模板"),
            DictCategory(code="vote_topic", name="议题投票分类", description="议题投票的选项分类"),
            DictCategory(code="area", name="区域划分", description="网格区域"),
            DictCategory(code="priority", name="优先级", description="事件优先级"),
        ]
        db.add_all(categories)
        await db.commit()
        for c in categories:
            await db.refresh(c)

        event_type_cat = categories[0]
        photo_tag_cat = categories[1]
        pub_cat = categories[2]
        vote_cat = categories[3]
        area_cat = categories[4]
        priority_cat = categories[5]

        dict_items = [
            DictItem(category_id=event_type_cat.id, code="road_damage", label="道路破损", value="road_damage", sort_order=1),
            DictItem(category_id=event_type_cat.id, code="facility_damage", label="设施损坏", value="facility_damage", sort_order=2),
            DictItem(category_id=event_type_cat.id, code="environment", label="环境卫生", value="environment", sort_order=3),
            DictItem(category_id=event_type_cat.id, code="safety_hazard", label="安全隐患", value="safety_hazard", sort_order=4),
            DictItem(category_id=event_type_cat.id, code="city_management", label="城市管理", value="city_management", sort_order=5),
            DictItem(category_id=event_type_cat.id, code="illegal_construction", label="违建管理", value="illegal_construction", sort_order=6),
            DictItem(category_id=photo_tag_cat.id, code="road", label="道路", value="road", sort_order=1),
            DictItem(category_id=photo_tag_cat.id, code="lighting", label="照明", value="lighting", sort_order=2),
            DictItem(category_id=photo_tag_cat.id, code="greenery", label="绿化", value="greenery", sort_order=3),
            DictItem(category_id=photo_tag_cat.id, code="drainage", label="排水", value="drainage", sort_order=4),
            DictItem(category_id=pub_cat.id, code="rectify_result", label="整改结果", value="rectify_result", sort_order=1),
            DictItem(category_id=pub_cat.id, code="review_result", label="复查结果", value="review_result", sort_order=2),
            DictItem(category_id=vote_cat.id, code="agree", label="同意", value="agree", sort_order=1),
            DictItem(category_id=vote_cat.id, code="disagree", label="反对", value="disagree", sort_order=2),
            DictItem(category_id=vote_cat.id, code="abstain", label="弃权", value="abstain", sort_order=3),
            DictItem(category_id=area_cat.id, code="qingshan", label="青山湖区", value="qingshan", sort_order=1),
            DictItem(category_id=area_cat.id, code="xihu", label="西湖区", value="xihu", sort_order=2),
            DictItem(category_id=priority_cat.id, code="urgent", label="紧急", value="urgent", sort_order=1),
            DictItem(category_id=priority_cat.id, code="high", label="高", value="high", sort_order=2),
        ]
        db.add_all(dict_items)

        rules = [
            Rule(rule_type="timeout_alert", name="整改超时提醒", config={"hours": 72, "notify_roles": ["grid_worker", "manager"]}),
            Rule(rule_type="duplicate_detect", name="重复上报检测", config={"radius_meters": 50, "time_window_hours": 24, "event_type_match": True}),
            Rule(rule_type="timeout_alert", name="复查超时提醒", config={"hours": 24, "notify_roles": ["supervisor"]}),
            Rule(rule_type="escalation", name="自动升级规则", config={"pending_hours": 24, "rectifying_hours": 72}, is_active=False),
            Rule(rule_type="notification", name="整改驳回通知", config={"notify_assigned": True, "include_reason": True}),
        ]
        db.add_all(rules)
        await db.commit()

        now = datetime.now(timezone.utc)
        demo_events = [
            {
                "title": "青山路占道经营",
                "description": "青山路与建设路交叉口有商贩占道经营，影响交通通行",
                "event_type": "city_management",
                "status": "pending",
                "lng": 114.305,
                "lat": 30.593,
                "address": "青山路与建设路交叉口",
                "reporter_id": users[0].id,
                "assignee_id": None,
                "deadline_delta": timedelta(hours=72),
                "flows": [("created", users[0].id, "发现占道经营问题")],
                "photos": [],
            },
            {
                "title": "西湖区井盖缺失",
                "description": "西湖区文三路路面井盖缺失，存在安全隐患",
                "event_type": "safety_hazard",
                "status": "assigned",
                "lng": 114.358,
                "lat": 30.622,
                "address": "文三路289号",
                "reporter_id": users[0].id,
                "assignee_id": users[2].id,
                "deadline_delta": timedelta(hours=48),
                "flows": [("created", users[0].id, "井盖缺失安全隐患"), ("assigned", users[7].id, "指派王维修处理")],
                "photos": [],
            },
            {
                "title": "江干区垃圾分类不规范",
                "description": "江干区某小区垃圾分类投放点设置不规范，居民分类意识差",
                "event_type": "environment",
                "status": "rectifying",
                "lng": 114.423,
                "lat": 30.635,
                "address": "江干区九堡镇",
                "reporter_id": users[1].id,
                "assignee_id": users[3].id,
                "deadline_delta": timedelta(hours=96),
                "flows": [("created", users[1].id, "垃圾分类不规范"), ("assigned", users[7].id, "指派刘环保处理"), ("rectifying", users[3].id, "已联系物业进行分类指导")],
                "photos": [],
            },
            {
                "title": "拱墅区施工噪音扰民",
                "description": "拱墅区某工地夜间施工噪音严重影响周边居民休息",
                "event_type": "safety_hazard",
                "status": "reviewing",
                "lng": 114.321,
                "lat": 30.651,
                "address": "拱墅区运河广场旁",
                "reporter_id": users[1].id,
                "assignee_id": users[4].id,
                "deadline_delta": timedelta(hours=120),
                "flows": [("created", users[1].id, "夜间施工扰民"), ("assigned", users[7].id, "指派周监理处理"), ("rectifying", users[4].id, "已下达停工通知"), ("reviewed", users[4].id, "工地已停止夜间施工")],
                "photos": [],
            },
            {
                "title": "下城区路灯损坏",
                "description": "下城区某路段路灯损坏，夜间照明不足，存在安全风险",
                "event_type": "facility_damage",
                "status": "closed",
                "lng": 114.298,
                "lat": 30.612,
                "address": "下城区朝晖路",
                "reporter_id": users[0].id,
                "assignee_id": users[5].id,
                "deadline_delta": timedelta(hours=240),
                "flows": [("created", users[0].id, "路灯损坏"), ("assigned", users[7].id, "指派吴电工处理"), ("rectifying", users[5].id, "正在更换灯泡"), ("reviewed", users[5].id, "路灯已修复"), ("closed", users[7].id, "确认路灯已恢复正常")],
                "photos": [],
            },
            {
                "title": "滨江区违规搭建",
                "description": "滨江区某小区业主在公共区域违规搭建阳光房",
                "event_type": "illegal_construction",
                "status": "rectifying",
                "lng": 114.378,
                "lat": 30.578,
                "address": "滨江区长河街道",
                "reporter_id": users[0].id,
                "assignee_id": users[3].id,
                "deadline_delta": timedelta(hours=144),
                "flows": [("created", users[0].id, "违规搭建阳光房"), ("assigned", users[7].id, "指派执法人员处理"), ("rectifying", users[3].id, "已下达拆除通知书")],
                "photos": [],
            },
            {
                "title": "萧山区绿化带被毁",
                "description": "萧山区某道路两侧绿化带被车辆碾压损毁",
                "event_type": "environment",
                "status": "pending",
                "lng": 114.512,
                "lat": 30.542,
                "address": "萧山区市心路",
                "reporter_id": users[1].id,
                "assignee_id": None,
                "deadline_delta": timedelta(hours=48),
                "flows": [("created", users[1].id, "绿化带被车辆损毁")],
                "photos": [],
            },
        ]

        for idx, de in enumerate(demo_events):
            created_at = now - timedelta(days=7 - idx)
            deadline = created_at + de["deadline_delta"]
            e = Event(
                title=de["title"],
                description=de["description"],
                event_type=de["event_type"],
                status=de["status"],
                lng=de["lng"],
                lat=de["lat"],
                address=de["address"],
                reporter_id=de["reporter_id"],
                assignee_id=de["assignee_id"],
                created_at=created_at,
                updated_at=created_at,
                closed_at=created_at if de["status"] == "closed" else None,
            )
            db.add(e)
            await db.flush()

            for flow_idx, (action, operator_id, comment) in enumerate(de["flows"]):
                flow_time = created_at + timedelta(hours=flow_idx * 2)
                ef = EventFlow(
                    event_id=e.id,
                    action=action,
                    operator_id=operator_id,
                    comment=comment,
                    created_at=flow_time,
                )
                db.add(ef)

        sample_notifications = [
            (None, users[7].id, "warning", "事件【青山路占道经营】已超过整改时限，请尽快处理"),
            (None, users[7].id, "info", "萧山区市心路绿化带被毁，等待指派"),
            (7, users[5].id, "error", "事件【余杭区污水外溢】复查未通过，需重新整改"),
            (5, users[7].id, "success", "事件【下城区路灯损坏】已完成闭环"),
        ]
        for eid, uid, ntype, msg in sample_notifications:
            n = Notification(
                event_id=eid,
                user_id=uid,
                type=ntype,
                message=msg,
                is_read=(ntype in ("error", "success")),
                created_at=now - timedelta(days=1),
            )
            db.add(n)

        await db.commit()


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    try:
        await seed_demo_data()
    except Exception as e:
        print(f"seed skipped: {e}")
    yield


app = FastAPI(title="网格事件闭环管理系统", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api")
app.include_router(events.router, prefix="/api")
app.include_router(dict.router, prefix="/api")
app.include_router(rules.router, prefix="/api")
app.include_router(notifications.router, prefix="/api")

upload_dir = settings.UPLOAD_DIR
os.makedirs(upload_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=upload_dir), name="uploads")
