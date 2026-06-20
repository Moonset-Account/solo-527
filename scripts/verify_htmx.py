"""HTMX 端点集成测试 - 使用 TestClient 验证所有 HTML 端点
"""
from __future__ import annotations
import asyncio
import os
import re
import sys
import uuid

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from unittest.mock import AsyncMock, patch

# 使用 SQLite 测试数据库
TEST_DB = "sqlite+aiosqlite:///./test_htmx_endpoints.db"
os.environ["DATABASE_URL"] = TEST_DB


async def run_tests():
    from fastapi.testclient import TestClient
    from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
    from sqlalchemy.orm import selectinload

    from app.database import Base, get_db
    from app.main import app
    from app.models import (
        Tenant, FeatureFlag, Plan, PlanRule, Dictionary, DictionaryVersion,
        Reminder, ReminderVersion,
    )

    engine = create_async_engine(TEST_DB, echo=False)
    TestSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    async def override_get_db():
        async with TestSessionLocal() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db

    from unittest.mock import AsyncMock, patch

    # Mock Redis client
    mock_redis = AsyncMock()
    mock_redis.get.return_value = None
    mock_redis.set.return_value = None

    client = TestClient(app)

    print("=" * 60)
    print("HTMX 端点测试开始")
    print("=" * 60)

    # 测试 1: 创建租户 HTMX 端点
    resp = client.post(
        "/tenants/htmx/",
        data={
            "name": "HTMX页面租户",
            "code": "HTMX_TENANT_1",
            "contact_email": "htmx1@test.com",
            "contact_phone": "13800000001",
            "notes": "从页面表单创建",
        },
        headers={"HX-Request": "true"},
    )
    assert resp.status_code == 201, f"创建租户失败: {resp.status_code} {resp.text[:200]}"
    assert "HTMX页面租户" in resp.text
    assert "HTMX_TENANT_1" in resp.text
    print(f"✅ [HTMX POST /tenants/htmx/] 创建租户成功 (201, HTML片段正确)")
    tenant_id_line = [l for l in resp.text.split("\n") if "data-tenant-id" in l]
    tenant_id = None
    for l in tenant_id_line:
        m = re.search(r'data-tenant-id="([a-f0-9]+)"', l)
        if m:
            tenant_id = m.group(1)
    if not tenant_id:
        m = re.search(r'/tenants/htmx/([a-f0-9]+)/toggle', resp.text)
        if m:
            tenant_id = m.group(1)
    assert tenant_id, f"无法从返回HTML中提取租户ID, HTML={resp.text[:500]}"
    print(f"   提取到租户ID: {tenant_id}")

    # 测试 2: 切换租户状态 HTMX 端点
    resp2 = client.post(
        f"/tenants/htmx/{tenant_id}/toggle",
        headers={"HX-Request": "true"},
    )
    assert resp2.status_code == 200, f"切换租户状态失败: {resp2.status_code} {resp2.text[:200]}"
    assert "HTMX页面租户" in resp2.text
    print(f"✅ [HTMX POST /tenants/htmx/{{id}}/toggle] 切换租户状态成功")

    # 测试 3: 创建套餐 HTMX 端点
    resp3 = client.post(
        "/plans/htmx/",
        data={
            "name": "HTMX测试套餐",
            "code": "HTMX_PLAN_1",
            "price": "599.00",
            "call_limit": "80000",
            "rate_limit": "80",
            "notes": "页面创建的套餐",
        },
        headers={"HX-Request": "true"},
    )
    assert resp3.status_code == 201, f"创建套餐失败: {resp3.status_code} {resp3.text[:200]}"
    assert "HTMX测试套餐" in resp3.text
    assert "HTMX_PLAN_1" in resp3.text
    print(f"✅ [HTMX POST /plans/htmx/] 创建套餐成功")
    plan_id_match = re.search(r'/plans/htmx/([a-f0-9]+)/toggle', resp3.text)
    plan_id = plan_id_match.group(1) if plan_id_match else None
    assert plan_id, "无法提取套餐ID"
    print(f"   提取到套餐ID: {plan_id}")

    # 测试 4: 切换套餐状态
    resp4 = client.post(
        f"/plans/htmx/{plan_id}/toggle",
        headers={"HX-Request": "true"},
    )
    assert resp4.status_code == 200, f"切换套餐状态失败: {resp4.status_code}"
    print(f"✅ [HTMX POST /plans/htmx/{{id}}/toggle] 切换套餐状态成功")

    # 测试 5: 为租户创建功能开关
    resp5 = client.post(
        f"/tenants/htmx/{tenant_id}/feature-flags",
        data={
            "flag_key": "htmx_dark_mode",
            "flag_name": "暗色模式",
            "is_enabled": "true",
            "notes": "用户配置开关",
        },
        headers={"HX-Request": "true"},
    )
    assert resp5.status_code == 201, f"创建功能开关失败: {resp5.status_code} {resp5.text[:200]}"
    assert "htmx_dark_mode" in resp5.text
    assert "暗色模式" in resp5.text
    print(f"✅ [HTMX POST /tenants/htmx/{{tenant_id}}/feature-flags] 创建功能开关成功")
    flag_id_match = re.search(r'feature-flags/([a-f0-9]+)/toggle', resp5.text)
    flag_id = flag_id_match.group(1) if flag_id_match else None
    assert flag_id, "无法提取开关ID"

    # 测试 6: 切换功能开关
    resp6 = client.post(
        f"/tenants/htmx/feature-flags/{flag_id}/toggle",
        headers={"HX-Request": "true"},
    )
    assert resp6.status_code == 200, f"切换开关失败: {resp6.status_code}"
    print(f"✅ [HTMX POST /tenants/htmx/feature-flags/{{id}}/toggle] 切换功能开关成功")

    # 测试 7: 创建套餐规则
    resp7 = client.post(
        f"/plans/htmx/{plan_id}/rules",
        data={
            "rule_key": "htmx_max_upload",
            "rule_name": "最大上传大小",
            "rule_value": "100MB",
            "notes": "上传限制",
        },
        headers={"HX-Request": "true"},
    )
    assert resp7.status_code == 201, f"创建套餐规则失败: {resp7.status_code} {resp7.text[:200]}"
    assert "htmx_max_upload" in resp7.text
    assert "最大上传大小" in resp7.text
    print(f"✅ [HTMX POST /plans/htmx/{{plan_id}}/rules] 创建套餐规则成功")
    rule_id_match = re.search(r'rules/([a-f0-9]+)/toggle', resp7.text)
    rule_id = rule_id_match.group(1) if rule_id_match else None
    assert rule_id, "无法提取规则ID"

    # 测试 8: 切换套餐规则状态
    resp8 = client.post(
        f"/plans/htmx/rules/{rule_id}/toggle",
        headers={"HX-Request": "true"},
    )
    assert resp8.status_code == 200, f"切换规则状态失败: {resp8.status_code}"
    print(f"✅ [HTMX POST /plans/htmx/rules/{{id}}/toggle] 切换套餐规则状态成功")

    # 测试 9: 创建字典项
    resp9 = client.post(
        "/dictionaries/htmx/",
        data={
            "dict_type": "payment_method",
            "dict_key": "htmx_alipay",
            "dict_value": "支付宝支付",
            "sort_order": "5",
            "notes": "字典项",
        },
        headers={"HX-Request": "true"},
    )
    assert resp9.status_code == 201, f"创建字典失败: {resp9.status_code} {resp9.text[:200]}"
    assert "payment_method" in resp9.text
    assert "htmx_alipay" in resp9.text
    assert "支付宝支付" in resp9.text
    print(f"✅ [HTMX POST /dictionaries/htmx/] 创建字典成功")
    dict_id_match = re.search(r'dictionaries/htmx/([a-f0-9]+)/toggle', resp9.text)
    dict_id = dict_id_match.group(1) if dict_id_match else None
    assert dict_id, "无法提取字典ID"

    # 测试 10: 切换字典状态
    resp10 = client.post(
        f"/dictionaries/htmx/{dict_id}/toggle",
        headers={"HX-Request": "true"},
    )
    assert resp10.status_code == 200, f"切换字典状态失败: {resp10.status_code}"
    print(f"✅ [HTMX POST /dictionaries/htmx/{{id}}/toggle] 切换字典状态成功")

    # 测试 11: 创建提醒
    resp11 = client.post(
        "/reminders/htmx/",
        data={
            "reminder_type": "system",
            "title": "HTMX系统提醒",
            "content": "从页面创建的系统提醒",
            "trigger_at": "",
        },
        headers={"HX-Request": "true"},
    )
    assert resp11.status_code == 201, f"创建提醒失败: {resp11.status_code} {resp11.text[:200]}"
    assert "HTMX系统提醒" in resp11.text
    assert "系统提醒" in resp11.text
    print(f"✅ [HTMX POST /reminders/htmx/] 创建提醒成功")
    reminder_id_match = re.search(r'reminders/htmx/([a-f0-9]+)/toggle', resp11.text)
    reminder_id = reminder_id_match.group(1) if reminder_id_match else None
    assert reminder_id, "无法提取提醒ID"

    # 测试 12: 切换提醒状态
    resp12 = client.post(
        f"/reminders/htmx/{reminder_id}/toggle",
        headers={"HX-Request": "true"},
    )
    assert resp12.status_code == 200, f"切换提醒状态失败: {resp12.status_code}"
    print(f"✅ [HTMX POST /reminders/htmx/{{id}}/toggle] 切换提醒状态成功")

    # 验证字典版本快照创建
    async with TestSessionLocal() as db:
        from sqlalchemy import select
        result = await db.execute(
            select(DictionaryVersion)
            .where(DictionaryVersion.dictionary_id == dict_id)
            .order_by(DictionaryVersion.version.desc())
        )
        versions = list(result.scalars().all())
        assert len(versions) >= 2, f"字典版本快照不足: 实际 {len(versions)} 个，期望至少2个(创建+切换)"
        print(f"✅ 字典版本快照已自动创建 {len(versions)} 个 (创建+切换)")

        # 验证提醒版本快照创建
        result2 = await db.execute(
            select(ReminderVersion)
            .where(ReminderVersion.reminder_id == reminder_id)
            .order_by(ReminderVersion.version.desc())
        )
        rem_versions = list(result2.scalars().all())
        assert len(rem_versions) >= 2, f"提醒版本快照不足: 实际 {len(rem_versions)} 个"
        print(f"✅ 提醒版本快照已自动创建 {len(rem_versions)} 个 (创建+切换)")

    # 验证 /tenants/api/ 和 /api/dashboard/stats
    print()
    print("验证 JSON API 端点...")
    api_resp = client.get("/tenants/api/")
    assert api_resp.status_code == 200, f"/tenants/api/ 失败: {api_resp.status_code}"
    data = api_resp.json()
    assert isinstance(data, list), f"返回类型不是list: {type(data)}"
    assert len(data) >= 1, f"租户列表为空"
    t = data[0]
    assert "id" in t and "name" in t and "code" in t
    print(f"✅ [GET /tenants/api/] 返回数据: {len(data)} 条租户记录")

    dash_resp = client.get("/api/dashboard/stats")
    assert dash_resp.status_code == 200, f"/api/dashboard/stats 失败: {dash_resp.status_code}"
    stats = dash_resp.json()
    assert "tenant_count" in stats
    print(f"✅ [GET /api/dashboard/stats] 返回统计: tenant_count={stats.get('tenant_count')}, active_tenants={stats.get('active_tenants')}")

    print()
    print("=" * 60)
    print("全部 HTMX + JSON API 端点验证通过！")
    print("=" * 60)

    await engine.dispose()
    app.dependency_overrides.clear()


if __name__ == "__main__":
    with patch("app.services.usage.redis_client", new=AsyncMock()) as m:
        m.get.return_value = None
        m.set.return_value = None
        asyncio.run(run_tests())

    try:
        os.remove("./test_htmx_endpoints.db")
    except:
        pass
