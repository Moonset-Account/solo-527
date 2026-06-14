from datetime import date, timedelta
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import async_session
from app.models.models import (
    User,
    Customer,
    Plan,
    BudgetVersion,
    Contract,
    AcceptanceTemplate,
    InspectionTemplate,
    InspectionTask,
    InspectionRecord,
    SatisfactionRecord,
    Notification,
    ConfigChangeLog,
)
from app.services.auth_service import hash_password


async def seed_demo_data(db: Optional[AsyncSession] = None) -> dict:
    if db is None:
        async with async_session() as session:
            return await _seed_data(session)
    return await _seed_data(db)


async def _seed_data(session: AsyncSession) -> dict:
    try:
        admin = User(
            username="admin",
            password_hash=hash_password("admin123"),
            role="admin",
            display_name="管理员",
            is_demo=True,
        )
        session.add(admin)

        inspector1 = User(
            username="inspector1",
            password_hash=hash_password("inspector123"),
            role="inspector",
            display_name="质检员张三",
            is_demo=True,
        )
        session.add(inspector1)

        inspector2 = User(
            username="inspector2",
            password_hash=hash_password("inspector123"),
            role="inspector",
            display_name="质检员李四",
            is_demo=True,
        )
        session.add(inspector2)

        material_staff = User(
            username="material_staff1",
            password_hash=hash_password("material123"),
            role="material_staff",
            display_name="材料员王五",
            is_demo=True,
        )
        session.add(material_staff)

        await session.flush()

        customer1 = Customer(
            name="客户甲", phone="13800001111", address="北京市朝阳区A小区1号楼", is_demo=True
        )
        customer2 = Customer(
            name="客户乙", phone="13800002222", address="北京市海淀区B小区2号楼", is_demo=True
        )
        customer3 = Customer(
            name="客户丙", phone="13800003333", address="北京市西城区C小区3号楼", is_demo=True
        )
        session.add_all([customer1, customer2, customer3])
        await session.flush()

        plan1 = Plan(name="标准装修方案", description="三室两厅标准装修，包含水电、泥瓦、木工、油漆等全套施工", status="active", is_demo=True)
        plan2 = Plan(name="豪华装修方案", description="四室两厅豪华装修，高端材料，全屋定制", status="active", is_demo=True)
        plan3 = Plan(name="简约装修方案", description="两室一厅简约风格，经济实惠", status="draft", is_demo=True)
        session.add_all([plan1, plan2, plan3])
        await session.flush()

        at1 = AcceptanceTemplate(
            name="标准验收模板",
            items=["水电线路检查", "墙面平整度", "地面平整度", "防水测试", "门窗安装"],
            is_demo=True,
        )
        at2 = AcceptanceTemplate(
            name="精装修验收模板",
            items=["水电验收", "泥瓦验收", "木工验收", "油漆验收", "安装工程验收", "整体空气质量检测"],
            is_demo=True,
        )
        session.add_all([at1, at2])
        await session.flush()

        it1 = InspectionTemplate(
            name="水电巡检模板",
            check_items=["电路布线规范", "水管压力测试", "开关插座位置", "灯具安装", "配电箱接线"],
            is_demo=True,
        )
        it2 = InspectionTemplate(
            name="泥瓦巡检模板",
            check_items=["墙砖空鼓检查", "地砖空鼓检查", "墙面平整度", "地面坡度", "防水闭水试验"],
            is_demo=True,
        )
        session.add_all([it1, it2])
        await session.flush()

        budget1 = BudgetVersion(
            contract_id=None,
            version="V1.0",
            items=[
                {"name": "瓷砖", "amount": 5000, "unit": "项"},
                {"name": "涂料", "amount": 3000, "unit": "项"},
                {"name": "水电材料", "amount": 8000, "unit": "项"},
                {"name": "人工费用", "amount": 20000, "unit": "项"},
            ],
            is_demo=True,
        )
        budget2 = BudgetVersion(
            contract_id=None,
            version="V1.0",
            items=[
                {"name": "大理石", "amount": 15000, "unit": "项"},
                {"name": "实木地板", "amount": 12000, "unit": "项"},
                {"name": "定制橱柜", "amount": 18000, "unit": "项"},
                {"name": "人工费用", "amount": 45000, "unit": "项"},
            ],
            is_demo=True,
        )
        budget3 = BudgetVersion(
            contract_id=None,
            version="V2.0",
            items=[
                {"name": "大理石", "amount": 16000, "unit": "项"},
                {"name": "实木地板", "amount": 13000, "unit": "项"},
                {"name": "定制橱柜", "amount": 19000, "unit": "项"},
                {"name": "人工费用", "amount": 45000, "unit": "项"},
            ],
            is_demo=True,
        )
        session.add_all([budget1, budget2, budget3])
        await session.flush()

        contract1 = Contract(
            name="客户甲-标准装修合同",
            customer_id=customer1.id,
            plan_id=plan1.id,
            budget_version_id=budget1.id,
            status="active",
            amount=80000,
            start_date=date(2026, 1, 1),
            end_date=date(2026, 4, 1),
            is_demo=True,
        )
        contract2 = Contract(
            name="客户乙-豪华装修合同",
            customer_id=customer2.id,
            plan_id=plan2.id,
            budget_version_id=budget2.id,
            status="active",
            amount=200000,
            start_date=date(2026, 2, 1),
            end_date=date(2026, 6, 1),
            is_demo=True,
        )
        contract3 = Contract(
            name="客户丙-标准装修合同",
            customer_id=customer3.id,
            plan_id=plan1.id,
            budget_version_id=None,
            status="draft",
            amount=75000,
            start_date=date(2026, 3, 1),
            end_date=date(2026, 6, 30),
            is_demo=True,
        )
        session.add_all([contract1, contract2, contract3])
        await session.flush()

        today = date.today()
        task1 = InspectionTask(
            contract_id=contract1.id,
            template_id=it1.id,
            inspector_id=inspector1.id,
            node_name="水电验收",
            status="completed",
            deadline=today - timedelta(days=10),
            is_delayed=False,
            is_demo=True,
        )
        task2 = InspectionTask(
            contract_id=contract1.id,
            template_id=it2.id,
            inspector_id=inspector1.id,
            node_name="泥瓦验收",
            status="in_progress",
            deadline=today + timedelta(days=3),
            is_delayed=False,
            is_demo=True,
        )
        task3 = InspectionTask(
            contract_id=contract2.id,
            template_id=it1.id,
            inspector_id=inspector2.id,
            node_name="水电验收",
            status="pending",
            deadline=today - timedelta(days=5),
            is_delayed=True,
            is_demo=True,
        )
        task4 = InspectionTask(
            contract_id=contract2.id,
            template_id=None,
            inspector_id=inspector2.id,
            node_name="木工验收",
            status="accepted",
            deadline=today + timedelta(days=20),
            is_delayed=False,
            is_demo=True,
        )
        task5 = InspectionTask(
            contract_id=contract1.id,
            template_id=None,
            inspector_id=inspector1.id,
            node_name="油漆验收",
            status="pending",
            deadline=today + timedelta(days=30),
            is_delayed=False,
            is_demo=True,
        )
        session.add_all([task1, task2, task3, task4, task5])
        await session.flush()

        record1 = InspectionRecord(
            task_id=task1.id,
            quality_score=90,
            description="水电施工质量良好，线路布局规范，开关插座位置准确",
            photos=["/photos/demo1.jpg", "/photos/demo2.jpg"],
            conclusion="pass",
            is_demo=True,
        )
        record2 = InspectionRecord(
            task_id=task4.id,
            quality_score=85,
            description="木工施工质量合格，部分细节需要微调，已现场整改",
            photos=["/photos/demo3.jpg"],
            conclusion="conditional_pass",
            is_demo=True,
        )
        record3 = InspectionRecord(
            task_id=task3.id,
            quality_score=70,
            description="存在部分线路杂乱问题，需要整改后复检",
            photos=["/photos/demo4.jpg"],
            conclusion="fail",
            is_demo=True,
        )
        session.add_all([record1, record2, record3])
        await session.flush()

        sat1 = SatisfactionRecord(
            contract_id=contract1.id,
            customer_id=customer1.id,
            level="satisfied",
            comment="施工质量很好，沟通顺畅，工期准时",
            is_demo=True,
        )
        sat2 = SatisfactionRecord(
            contract_id=contract2.id,
            customer_id=customer2.id,
            level="neutral",
            comment="还行，有些细节需要改进，希望后续能更完善",
            is_demo=True,
        )
        sat3 = SatisfactionRecord(
            contract_id=contract3.id,
            customer_id=customer3.id,
            level="pending",
            is_demo=True,
        )
        session.add_all([sat1, sat2, sat3])
        await session.flush()

        notif1 = Notification(
            user_id=inspector1.id,
            type="inspection_due",
            title="验收任务即将到期",
            content="泥瓦验收任务将于3天后到期，请尽快完成",
            is_demo=True,
        )
        notif2 = Notification(
            user_id=inspector2.id,
            type="delay_warning",
            title="验收任务已延期",
            content="水电验收任务已延期5天，请尽快处理并通知客户",
            is_demo=True,
        )
        notif3 = Notification(
            user_id=material_staff.id,
            type="material_reminder",
            title="节点延期提醒",
            content="合同「客户乙-豪华装修合同」水电验收节点已延期，请准备后续材料",
            is_demo=True,
        )
        session.add_all([notif1, notif2, notif3])
        await session.flush()

        await session.commit()
        return {"ok": True, "count": 30, "message": "演示数据已成功创建"}
    except Exception as e:
        await session.rollback()
        raise


async def clear_demo_data(db: Optional[AsyncSession] = None) -> dict:
    if db is None:
        async with async_session() as session:
            return await _clear_data(session)
    return await _clear_data(db)


async def _clear_data(session: AsyncSession) -> dict:
    try:
        deleted = {
            "contracts": 0,
            "inspections": 0,
            "records": 0,
            "notifications": 0,
            "satisfaction": 0,
            "plans": 0,
            "customers": 0,
            "users": 0,
            "budget_versions": 0,
            "acceptance_templates": 0,
            "inspection_templates": 0,
            "config_logs": 0,
        }

        model_order = [
            (Notification, "notifications"),
            (SatisfactionRecord, "satisfaction"),
            (InspectionRecord, "records"),
            (InspectionTask, "inspections"),
            (ConfigChangeLog, "config_logs"),
            (Contract, "contracts"),
            (BudgetVersion, "budget_versions"),
            (AcceptanceTemplate, "acceptance_templates"),
            (InspectionTemplate, "inspection_templates"),
            (Plan, "plans"),
            (Customer, "customers"),
            (User, "users"),
        ]

        for model, key in model_order:
            result = await session.execute(
                select(model).where(model.is_demo == True)
            )
            items = result.scalars().all()
            deleted[key] = len(items)
            for item in items:
                await session.delete(item)

        await session.flush()
        await session.commit()
        return {"ok": True, "deleted": deleted}
    except Exception:
        await session.rollback()
        raise
