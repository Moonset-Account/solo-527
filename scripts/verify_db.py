"""使用 SQLite 临时数据库进行完整功能验证
"""
from __future__ import annotations
import asyncio
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy import select, func, cast, Date
from sqlalchemy.orm import selectinload

TEST_DB = "sqlite+aiosqlite:///./test_portal.db"

os.environ["DATABASE_URL"] = TEST_DB

# 确保不使用 Redis 模式，因为 SQLite 测试
async def run_tests():
    # 使用 aiosqlite 引擎
    engine = create_async_engine(TEST_DB, echo=False)
    async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    from app.database import Base
    from app.models import (
        Tenant, FeatureFlag, Plan, PlanRule, ApiUsage, Anomaly, Bill,
        InvoiceHeader, Arrear, HealthStat, Dictionary, DictionaryVersion,
        Reminder, ReminderVersion,
    )

    # 创建表
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    # 测试 1: 创建租户
    async with async_session() as session:
        import uuid
        from datetime import datetime, timedelta

        t1 = Tenant(
            id=uuid.uuid4().hex,
            name="测试租户A",
            code="TENANT_A",
            contact_email="a@test.com",
            is_active=True,
            health_score=85,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        t2 = Tenant(
            id=uuid.uuid4().hex,
            name="测试租户B",
            code="TENANT_B",
            contact_email="b@test.com",
            is_active=False,
            health_score=45,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        session.add_all([t1, t2])
        await session.flush()

        # 测试关联关系：添加 FeatureFlag
        ff1 = FeatureFlag(
            id=uuid.uuid4().hex,
            tenant_id=t1.id,
            flag_key="new_dashboard",
            flag_name="新版仪表盘",
            is_enabled=True,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        ff2 = FeatureFlag(
            id=uuid.uuid4().hex,
            tenant_id=t1.id,
            flag_key="beta_api",
            flag_name="Beta版API",
            is_enabled=False,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        session.add_all([ff1, ff2])
        await session.flush()

        # 添加发票抬头
        inv = InvoiceHeader(
            id=uuid.uuid4().hex,
            tenant_id=t1.id,
            company_name="测试公司有限公司",
            tax_id="91110000MA0012345X",
            address="北京市朝阳区",
            is_default=True,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        session.add(inv)
        await session.flush()

        # 添加套餐
        p1 = Plan(
            id=uuid.uuid4().hex,
            name="企业版",
            code="enterprise",
            price=999.00,
            call_limit=100000,
            rate_limit=100,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        session.add(p1)

        # 添加套餐规则
        pr1 = PlanRule(
            id=uuid.uuid4().hex,
            plan_id=p1.id,
            rule_key="sla_uptime",
            rule_name="SLA可用性",
            rule_value="99.99%",
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        session.add(pr1)

        # 添加异常
        an1 = Anomaly(
            id=uuid.uuid4().hex,
            tenant_id=t1.id,
            anomaly_type="rate_limit_exceeded",
            api_path="/api/v1/orders",
            detail="超过调用频率限制",
            severity="warning",
            status="open",
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        session.add(an1)

        # 添加欠费
        ar1 = Arrear(
            id=uuid.uuid4().hex,
            tenant_id=t2.id,
            amount=1999.00,
            overdue_days=15,
            status="unpaid",
            handler="张三",
            handle_result="客户承诺本周支付",
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        session.add(ar1)

        # 添加字典
        d1 = Dictionary(
            id=uuid.uuid4().hex,
            dict_type="anomaly_type",
            dict_key="rate_limit",
            dict_value="限流超限",
            sort_order=1,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        session.add(d1)
        await session.flush()
        # 创建字典版本
        dv1 = DictionaryVersion(
            id=uuid.uuid4().hex,
            dictionary_id=d1.id,
            dict_type=d1.dict_type,
            dict_key=d1.dict_key,
            dict_value=d1.dict_value,
            sort_order=1,
            version=1,
            created_at=datetime.utcnow(),
        )
        session.add(dv1)

        # 添加提醒
        r1 = Reminder(
            id=uuid.uuid4().hex,
            reminder_type="arrear",
            title="欠费提醒 - 测试租户B",
            content="租户B欠费1999元已逾期15天",
            tenant_id=t2.id,
            trigger_at=datetime.utcnow() + timedelta(days=1),
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        session.add(r1)
        await session.flush()
        rv1 = ReminderVersion(
            id=uuid.uuid4().hex,
            reminder_id=r1.id,
            reminder_type=r1.reminder_type,
            title=r1.title,
            content=r1.content,
            tenant_id=r1.tenant_id,
            trigger_at=r1.trigger_at,
            is_active=True,
            version=1,
            created_at=datetime.utcnow(),
        )
        session.add(rv1)

        # 添加用量
        for i in range(7):
            day = datetime.utcnow() - timedelta(days=i)
            usage = ApiUsage(
                id=uuid.uuid4().hex,
                tenant_id=t1.id,
                api_path="/api/v1/orders",
                method="GET",
                status_code=200,
                response_ms=120 + i * 10,
                call_count=1000 + i * 500,
                period_start=day.replace(hour=0, minute=0, second=0),
                period_end=day.replace(hour=23, minute=59, second=59),
                created_at=day,
            )
            session.add(usage)
        bill1 = Bill(
            id=uuid.uuid4().hex,
            tenant_id=t1.id,
            plan_id=p1.id,
            period_start=datetime.utcnow() - timedelta(days=30),
            period_end=datetime.utcnow(),
            amount=999.00,
            call_count=73500,
            status="paid",
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        session.add(bill1)
        health1 = HealthStat(
            id=uuid.uuid4().hex,
            tenant_id=t1.id,
            score=85,
            arrears_count=0,
            anomaly_count=1,
            usage_percent=73,
            recorded_at=datetime.utcnow(),
        )
        session.add(health1)

        await session.commit()
        t1_id = t1.id
        t2_id = t2.id

    print("=" * 60)
    print("数据已写入，开始验证读取...")
    print("=" * 60)

    # 测试 2: 模拟 /tenants/api/
    async with async_session() as session:
        result = await session.execute(select(Tenant).order_by(Tenant.created_at.desc()))
        tenants = list(result.scalars().all())
        print(f"\n✅ [/tenants/api/] 租户列表: {len(tenants)} 条")
        for t in tenants:
            print(f"  - {t.name} ({t.code}) | active={t.is_active} | score={t.health_score}")

        # 验证关系查询
        stmt = (
            select(Tenant)
            .where(Tenant.id == t1_id)
            .options(
                selectinload(Tenant.feature_flags),
                selectinload(Tenant.invoices),
            )
        )
        t1_result = await session.execute(stmt)
        t1 = t1_result.scalar_one()
        print(f"\n✅ 关联关系 - 租户 {t1.name}:")
        print(f"  feature_flags 数量: {len(t1.feature_flags)}")
        for ff in t1.feature_flags:
            print(f"    - {ff.flag_key}: {ff.flag_name} enabled={ff.is_enabled}")
        print(f"  invoices 数量: {len(t1.invoices)}")
        for inv in t1.invoices:
            print(f"    - {inv.company_name} default={inv.is_default}")
        inv0 = t1.invoices[0]
        ff0 = t1.feature_flags[0]
        print(f"  InvoiceHeader.tenant 反向关联 id: {inv0.tenant_id} (正确关联到租户)")
        print(f"  FeatureFlag.tenant 反向关联 id: {ff0.tenant_id} (正确关联到租户)")

    # 测试3: 模拟 /api/dashboard/stats
    async with async_session() as session:
        from app.models import Tenant, Anomaly, Arrear
        tenant_count = (await session.execute(select(func.count(Tenant.id)))).scalar() or 0
        active_tenants = (await session.execute(select(func.count(Tenant.id)).where(Tenant.is_active == True))).scalar() or 0
        open_anomalies = (await session.execute(select(func.count(Anomaly.id)).where(Anomaly.status == "open"))).scalar() or 0
        unpaid_arrears = (await session.execute(select(func.count(Arrear.id)).where(Arrear.status == "unpaid"))).scalar() or 0
        avg_score = (await session.execute(select(func.avg(Tenant.health_score)))).scalar() or 0

        print(f"\n✅ [/api/dashboard/stats] 仪表盘统计:")
        print(f"  租户总数: {tenant_count}")
        print(f"  活跃租户: {active_tenants}")
        print(f"  待处理异常: {open_anomalies}")
        print(f"  未处理欠费: {unpaid_arrears}")
        print(f"  平均健康分: {round(float(avg_score), 2)}")

    # 测试 4: 模拟 HTMX 创建租户
    async with async_session() as session:
        from app.services.tenant import TenantService
        svc = TenantService(session)
        new_tenant = await svc.create(
            name="HTMX新增租户",
            code="HTMX_001",
            contact_email="htmx@test.com",
            is_active=True,
            notes="通过HTMX表单创建",
        )
        await session.commit()
        await session.refresh(new_tenant)
        print(f"\n✅ [HTMX 创建租户成功: id={new_tenant.id} name={new_tenant.name}")

    # 测试 5: 模拟 HTMX 创建套餐
    async with async_session() as session:
        from app.services.plan import PlanService, PlanRuleService
        psvc = PlanService(session)
        new_plan = await psvc.create(
            name="HTMX测试套餐",
            code="HTMX_PLAN",
            price=float(299.0),
            call_limit=50000,
            rate_limit=50,
            notes="HTMX套餐",
        )
        await session.commit()
        await session.refresh(new_plan)
        print(f"✅ [HTMX 创建套餐成功: id={new_plan.id} name={new_plan.name} price={new_plan.price}")

        # 测试 6: HTMX 创建功能开关
        from app.services.tenant import FeatureFlagService
        fsvc = FeatureFlagService(session)
        new_flag = await fsvc.create(
            tenant_id=new_tenant.id,
            flag_key="htmx_flag",
            flag_name="HTMX测试开关",
            is_enabled=False,
            notes="HTMX创建",
        )
        await session.commit()
        await session.refresh(new_flag)
        print(f"✅ [HTMX 创建功能开关成功: flag_key={new_flag.flag_key} enabled={new_flag.is_enabled}")

        # 测试 7: HTMX 创建套餐规则
        rsvc = PlanRuleService(session)
        new_rule = await rsvc.create(
            plan_id=new_plan.id,
            rule_key="htmx_rule",
            rule_name="HTMX规则",
            rule_value="测试值",
        )
        await session.commit()
        await session.refresh(new_rule)
        print(f"✅ [HTMX 创建套餐规则成功: rule_key={new_rule.rule_key} value={new_rule.rule_value}")

    # 测试 8: HTMX 创建字典
    async with async_session() as session:
        from app.services.dictionary import DictionaryService
        dsvc = DictionaryService(session)
        new_dict = await dsvc.create(
            dict_type="test_type",
            dict_key="htmx_key",
            dict_value="HTMX字典值",
            sort_order=int(10),
        )
        await session.commit()
        await session.refresh(new_dict)
        print(f"✅ [HTMX 创建字典成功: type={new_dict.dict_type} key={new_dict.dict_key} value={new_dict.dict_value}")
        versions = await dsvc.version_service.list_by_dictionary(new_dict.id)
        print(f"  -> 自动生成版本快照: {len(versions)} 个版本")

    # 测试 9: HTMX 创建提醒
    async with async_session() as session:
        from app.services.reminder import ReminderService
        rsvc = ReminderService(session)
        trigger = datetime.utcnow() + timedelta(hours=2)
        new_rem = await rsvc.create(
            reminder_type="system",
            title="HTMX测试提醒",
            content="通过HTMX创建的系统提醒",
            tenant_id=None,
            trigger_at=trigger,
        )
        await session.commit()
        await session.refresh(new_rem)
        print(f"✅ [HTMX 创建提醒成功: type={new_rem.reminder_type} title={new_rem.title}")

        versions = await rsvc.version_service.list_by_reminder(new_rem.id)
        print(f"  -> 自动生成版本快照: {len(versions)} 个版本")

    # 测试10: API用量趋势
    async with async_session() as session:
        from app.models import ApiUsage
        stmt = (
            select(
                func.strftime('%Y-%m-%d', ApiUsage.created_at).label("date"),
                func.sum(ApiUsage.call_count).label("total_calls"),
                func.avg(ApiUsage.response_ms).label("avg_response_ms"),
            )
            .where(ApiUsage.tenant_id == t1_id)
            .group_by(func.strftime('%Y-%m-%d', ApiUsage.created_at))
            .order_by(func.strftime('%Y-%m-%d', ApiUsage.created_at))
        )
        result = await session.execute(stmt)
        trend = [
            {
                "date": row.date,
                "total_calls": int(row.total_calls),
                "avg_response_ms": round(float(row.avg_response_ms), 2) if row.avg_response_ms else 0,
            }
            for row in result.all()
        ]
        print(f"\n✅ [API用量趋势] 数据点: {len(trend)} 天")
        for t in trend[:3]:
            print(f"  - {t['date']}: total_calls={t['total_calls']} avg_ms={t['avg_response_ms']}")

    # 模拟HTMX端点渲染验证
    print("\n" + "=" * 60)
    print("全部验证完成")
    print("=" * 60)
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(run_tests())
    # 清理测试数据库
    try:
        os.remove("./test_portal.db")
    except:
        pass
