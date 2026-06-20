"""新增功能验证 - 发票抬头 + 健康度统计
"""
from __future__ import annotations
import asyncio
import os
import sys
from unittest.mock import AsyncMock, patch

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

TEST_DB = "sqlite+aiosqlite:///./test_new_features.db"
os.environ["DATABASE_URL"] = TEST_DB


async def run_tests():
    from unittest.mock import AsyncMock, patch

    from fastapi.testclient import TestClient
    from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

    from app.database import Base, get_db
    from app.main import app

    engine = create_async_engine(TEST_DB, echo=False)
    TestSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    async def override_get_db():
        async with TestSessionLocal() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db

    client = TestClient(app)

    print("=" * 60)
    print("新功能验证")
    print("=" * 60)

    # 先创建一些测试数据
    import uuid
    from datetime import datetime

    async with TestSessionLocal() as db:
        from app.models import Tenant, Arrear

        # 3个租户
        t1 = Tenant(id=uuid.uuid4().hex, name="健康租户A", code="HEALTH_A",
                    is_active=True, health_score=95, created_at=datetime.utcnow(), updated_at=datetime.utcnow())
        t2 = Tenant(id=uuid.uuid4().hex, name="中等租户B", code="MID_B",
                    is_active=True, health_score=70, created_at=datetime.utcnow(), updated_at=datetime.utcnow())
        t3 = Tenant(id=uuid.uuid4().hex, name="低健康租户C", code="LOW_C",
                    is_active=False, health_score=45, created_at=datetime.utcnow(), updated_at=datetime.utcnow())
        db.add_all([t1, t2, t3])

        # 2条欠费
        a1 = Arrear(id=uuid.uuid4().hex, tenant_id=t3.id, amount=2999.00,
                    overdue_days=30, status="unpaid", handler="张三",
                    handle_result="", notes="长期欠费",
                    created_at=datetime.utcnow(), updated_at=datetime.utcnow())
        a2 = Arrear(id=uuid.uuid4().hex, tenant_id=t2.id, amount=599.00,
                    overdue_days=5, status="unpaid", handler="",
                    handle_result="", notes="刚逾期",
                    created_at=datetime.utcnow(), updated_at=datetime.utcnow())
        db.add_all([a1, a2])
        await db.commit()

        t1_id = t1.id
        t2_id = t2.id
        t3_id = t3.id

    print("\n--- 发票抬头 HTMX 端点 ---")

    # 测试 1: 创建发票抬头
    resp = client.post(
        "/billing/htmx/invoices/",
        data={
            "tenant_id": t1_id,
            "company_name": "测试科技有限公司",
            "tax_id": "91110000MA1234567X",
            "address": "北京市海淀区中关村大街1号",
            "phone": "010-12345678",
            "bank_name": "工商银行北京分行",
            "bank_account": "6222021234567890123",
            "is_default": "on",
            "notes": "主开票抬头",
        },
    )
    assert resp.status_code == 201, f"创建发票抬头失败: {resp.status_code} {resp.text[:300]}"
    assert "测试科技有限公司" in resp.text
    assert "默认" in resp.text
    assert "启用" in resp.text
    assert "/billing/htmx/invoices/" in resp.text
    print(f"✅ POST /billing/htmx/invoices/ 创建发票抬头成功 (201, HTML行片段正确)")

    import re
    inv_id_match = re.search(r'invoices/([a-f0-9]+)/toggle', resp.text)
    inv_id = inv_id_match.group(1) if inv_id_match else None
    assert inv_id, f"无法提取发票ID, HTML: {resp.text[:500]}"
    print(f"   提取到发票ID: {inv_id}")

    # 测试 2: 切换发票状态
    resp2 = client.post(f"/billing/htmx/invoices/{inv_id}/toggle")
    assert resp2.status_code == 200
    assert "测试科技有限公司" in resp2.text
    assert "停用" in resp2.text
    print(f"✅ POST /billing/htmx/invoices/{{id}}/toggle 切换状态成功")

    # 测试 3: 切回启用
    resp3 = client.post(f"/billing/htmx/invoices/{inv_id}/toggle")
    assert "启用" in resp3.text

    # 测试 4: 创建第2个抬头（非默认）
    resp4 = client.post(
        "/billing/htmx/invoices/",
        data={
            "tenant_id": t1_id,
            "company_name": "备用抬头公司",
            "tax_id": "91110000MA9876543Y",
            "is_default": "",
        },
    )
    assert resp4.status_code == 201
    assert "备用抬头公司" in resp4.text
    inv2_id_match = re.search(r'invoices/([a-f0-9]+)/toggle', resp4.text)
    inv2_id = inv2_id_match.group(1)

    # 测试 5: 设为默认
    resp5 = client.post(f"/billing/htmx/invoices/{inv2_id}/default")
    assert resp5.status_code == 200
    assert "默认" in resp5.text
    print(f"✅ POST /billing/htmx/invoices/{{id}}/default 设为默认成功")

    print("\n--- 健康度统计 ---")

    # 测试 6: 仪表盘统计
    resp6 = client.get("/api/dashboard/stats")
    assert resp6.status_code == 200
    stats = resp6.json()
    assert stats["tenant_count"] == 3, f"租户总数错误: {stats['tenant_count']}"
    assert stats["active_tenants"] == 2
    assert stats["unpaid_arrears"] == 2

    health = stats["health_summary"]
    assert "avg_health_score" in health
    assert "low_health_count" in health
    assert "total_arrears_amount" in health

    assert health["low_health_count"] == 1, f"低健康租户数错误: {health['low_health_count']}"
    assert health["total_arrears_amount"] == 3598.0, f"欠费总额错误: {health['total_arrears_amount']}"
    print(f"✅ GET /api/dashboard/stats 健康度统计完整")
    print(f"   平均健康分: {health['avg_health_score']}")
    print(f"   低健康租户数: {health['low_health_count']}")
    print(f"   欠费总额: ¥{health['total_arrears_amount']}")

    # 测试 7: 欠费页健康度摘要
    resp7 = client.get("/arrears/api/health-summary")
    assert resp7.status_code == 200
    summary = resp7.json()
    assert summary["avg_health_score"] == health["avg_health_score"]
    assert summary["low_health_count"] == health["low_health_count"]
    assert summary["total_arrears_amount"] == health["total_arrears_amount"]
    print(f"✅ GET /arrears/api/health-summary 欠费页健康度摘要一致")

    print("\n--- JSON API 端点完整性 ---")

    # 测试 8: 发票列表 API
    resp8 = client.get(f"/billing/api/invoices/{t1_id}")
    assert resp8.status_code == 200
    invoices = resp8.json()
    assert len(invoices) == 2, f"发票数量错误: {len(invoices)}"
    print(f"✅ GET /billing/api/invoices/{{tenant_id}} 返回 {len(invoices)} 条发票抬头")

    # 测试 9: 创建发票 API
    resp9 = client.post(
        "/billing/api/invoices",
        json={
            "tenant_id": t2_id,
            "company_name": "JSON创建公司",
            "tax_id": "91110000MA0000001Z",
        },
    )
    assert resp9.status_code == 201
    print(f"✅ POST /billing/api/invoices JSON API 创建成功")

    # 测试 10: 欠费列表 API
    resp10 = client.get("/arrears/api/")
    assert resp10.status_code == 200
    arrears = resp10.json()
    assert len(arrears) == 2
    print(f"✅ GET /arrears/api/ 返回 {len(arrears)} 条欠费记录")

    print("\n" + "=" * 60)
    print("全部新功能验证通过！")
    print("=" * 60)

    await engine.dispose()
    app.dependency_overrides.clear()


if __name__ == "__main__":
    with patch("app.services.usage.redis_client", new=AsyncMock()) as m:
        m.get.return_value = None
        m.set.return_value = None
        asyncio.run(run_tests())

    try:
        os.remove("./test_new_features.db")
    except:
        pass
