import asyncio

from passlib.context import CryptContext

from app.database import async_session
from app.models.dict import DictCategory, DictItem
from app.models.rule import Rule
from app.models.user import User

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


async def seed():
    async with async_session() as db:
        from sqlalchemy import select

        result = await db.execute(select(User).limit(1))
        if result.scalar_one_or_none():
            print("数据库已有数据，跳过初始化")
            return

        users = [
            User(username="worker1", password_hash=pwd_context.hash("changeme"), role="grid_worker", name="张网格"),
            User(username="manager1", password_hash=pwd_context.hash("changeme"), role="biz_owner", name="李负责"),
            User(username="admin1", password_hash=pwd_context.hash("changeme"), role="admin", name="王管理"),
        ]
        db.add_all(users)

        categories = [
            DictCategory(code="event_type", name="事件类型", description="事件上报的分类"),
            DictCategory(code="photo_tag", name="设施照片标签", description="设施照片的分类标签"),
            DictCategory(code="publication_type", name="结果公示类型", description="结果公示的分类模板"),
            DictCategory(code="vote_topic", name="议题投票分类", description="议题投票的选项分类"),
        ]
        db.add_all(categories)
        await db.commit()
        for c in categories:
            await db.refresh(c)

        items = [
            DictItem(category_id=categories[0].id, code="road_damage", label="道路破损", value="road_damage", sort_order=1),
            DictItem(category_id=categories[0].id, code="facility_damage", label="设施损坏", value="facility_damage", sort_order=2),
            DictItem(category_id=categories[0].id, code="environment", label="环境卫生", value="environment", sort_order=3),
            DictItem(category_id=categories[0].id, code="safety_hazard", label="安全隐患", value="safety_hazard", sort_order=4),
            DictItem(category_id=categories[1].id, code="road", label="道路", value="road", sort_order=1),
            DictItem(category_id=categories[1].id, code="lighting", label="照明", value="lighting", sort_order=2),
            DictItem(category_id=categories[1].id, code="greenery", label="绿化", value="greenery", sort_order=3),
            DictItem(category_id=categories[1].id, code="drainage", label="排水", value="drainage", sort_order=4),
            DictItem(category_id=categories[2].id, code="rectify_result", label="整改结果", value="rectify_result", sort_order=1),
            DictItem(category_id=categories[2].id, code="review_result", label="复查结果", value="review_result", sort_order=2),
            DictItem(category_id=categories[3].id, code="agree", label="同意", value="agree", sort_order=1),
            DictItem(category_id=categories[3].id, code="disagree", label="反对", value="disagree", sort_order=2),
            DictItem(category_id=categories[3].id, code="abstain", label="弃权", value="abstain", sort_order=3),
        ]
        db.add_all(items)

        rules = [
            Rule(rule_type="timeout_alert", name="整改超时提醒", config={"hours": 72, "notify_roles": ["grid_worker", "manager"]}),
            Rule(rule_type="duplicate_detect", name="重复上报检测", config={"radius_meters": 50, "time_window_hours": 24, "event_type_match": True}),
        ]
        db.add_all(rules)

        await db.commit()
        print("数据库初始化完成")


if __name__ == "__main__":
    asyncio.run(seed())
