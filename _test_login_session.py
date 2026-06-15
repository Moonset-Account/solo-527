import sys, os, asyncio
sys.path.insert(0, os.path.dirname(__file__))
os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///:memory:"
os.environ["REDIS_URL"] = "redis://localhost:6379/0"

from fastapi.testclient import TestClient
from httpx import AsyncClient, ASGITransport

# 先初始化 DB 数据
from sqlalchemy import select, func
from app.database import Base, engine, AsyncSessionLocal
from app.main import app
from app.models import Event, Seat, TicketType, TicketTypeConfig, User
from app.enums import EventStatus, SeatArea, SeatStatus, UserRole, TicketType as TTEnum, ConfigStatus
from app.utils import hash_password, now
from datetime import timedelta

async def init_full_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    async with AsyncSessionLocal() as db:
        # 1) 创建演示用户
        users = [
            User(username="admin", email="admin@concert-tickets.com", real_name="系统管理员",
                 hashed_password=hash_password("admin123"), role=UserRole.ADMIN, is_active=True),
            User(username="operator", email="operator@concert-tickets.com", real_name="运营专员",
                 hashed_password=hash_password("op123456"), role=UserRole.OPERATOR, is_active=True),
            User(username="finance", email="finance@concert-tickets.com", real_name="财务人员",
                 hashed_password=hash_password("fin123456"), role=UserRole.FINANCE, is_active=True),
            User(username="test001", email="test001@concert-tickets.com", real_name="测试用户",
                 hashed_password=hash_password("test123456"), role=UserRole.USER, is_active=True, phone="13800138000"),
        ]
        db.add_all(users); await db.commit()

        # 2) 全局票种
        ticket_types = [
            TicketType(code="VIP", name="VIP票", type=TTEnum.VIP, color="#E74C3C", icon="star", sort_order=1, is_default=False),
            TicketType(code="NORMAL", name="普通票", type=TTEnum.SINGLE, color="#3498DB", icon="ticket", sort_order=2, is_default=True),
            TicketType(code="STUDENT", name="学生票", type=TTEnum.STUDENT, color="#2ECC71", icon="graduation", sort_order=3, is_default=False),
        ]
        db.add_all(ticket_types); await db.commit()
        tt_by_code = {tt.code: tt for tt in ticket_types}

        # 3) 样例场次
        base_time = now() + timedelta(days=7)
        ev = Event(
            code="CONCERT-2026-001",
            name="夏日摇滚音乐节",
            artist="多位知名乐队",
            venue="国家体育场",
            start_time=base_time.replace(hour=19, minute=30),
            end_time=base_time.replace(hour=23, minute=0),
            status=EventStatus.ACTIVE,
            total_seats=0,
            max_tickets_per_order=4,
            sales_start_time=now() - timedelta(days=3),
            sales_end_time=base_time.replace(hour=18, minute=0),
            refund_deadline=base_time - timedelta(days=2),
            requires_registration=False,
            created_by=1, updated_by=1,
        )
        db.add(ev); await db.commit()

        # 4) 场次票种配置 ￥1880 VIP, ￥980 普通票
        ttc1 = TicketTypeConfig(event_id=ev.id, ticket_type_id=tt_by_code["VIP"].id,
                                price=1880, original_price=1880, total_inventory=80,
                                sold_count=12, reserved_count=5,
                                created_by=1, updated_by=1)
        ttc2 = TicketTypeConfig(event_id=ev.id, ticket_type_id=tt_by_code["NORMAL"].id,
                                price=980, original_price=980, total_inventory=400,
                                sold_count=156, reserved_count=20,
                                created_by=1, updated_by=1)
        ttc3 = TicketTypeConfig(event_id=ev.id, ticket_type_id=tt_by_code["STUDENT"].id,
                                price=580, original_price=780, total_inventory=100,
                                sold_count=30, reserved_count=0,
                                created_by=1, updated_by=1)
        db.add_all([ttc1, ttc2, ttc3]); await db.commit()

        # 5) 650 个座位（VIP 5×12 / FRONT 10×20），row 前缀区分避免唯一键冲突
        for i, cfg in enumerate([(ttc1, tt_by_code["VIP"]), (ttc2, tt_by_code["NORMAL"])]):
            area = SeatArea.VIP if i == 0 else SeatArea.FRONT
            ttc, tt = cfg
            rows, cols = (5, 12) if i == 0 else (10, 20)
            row_prefix = "V" if i == 0 else "A"  # VIP 区 V1-V5, FRONT 区 A1-A10
            for r in range(1, rows + 1):
                for c in range(1, cols + 1):
                    seat = Seat(event_id=ev.id, seat_code=f"{area.value}-{row_prefix}{r}-{c:02d}",
                                row=f"{row_prefix}{r:02d}", col=c, area=area, status=SeatStatus.AVAILABLE,
                                base_price=ttc.price, current_price=ttc.price,
                                ticket_type_id=tt.id, ticket_type_config_id=ttc.id,
                                created_by=1, updated_by=1)
                    db.add(seat)
        await db.commit()
        total = (await db.execute(select(func.count(Seat.id)).where(Seat.event_id == ev.id))).scalar() or 0
        ev.total_seats = total; await db.commit()
        return ev.id

event_id = asyncio.run(init_full_db())
print(f"✅ 初始化完成: event_id={event_id}")

# =========== 端到端 TestClient 会话验证 ===========
print("\n" + "="*80)
print(" [同步 TestClient 端到端验证（模拟浏览器会话）]")
print("="*80)

with TestClient(app) as client:
    # [1] /api/health 健康检查
    r = client.get("/api/health")
    print(f"\n[1] /api/health -> {r.status_code}: {r.json()}")
    assert r.status_code == 200

    # [2] 以 application/x-www-form-urlencoded POST /api/auth/login
    r = client.post("/api/auth/login", data={
        "username": "admin",
        "password": "admin123",
        "grant_type": "password",
    })
    print(f"\n[2] POST /api/auth/login (form 编码) -> {r.status_code}")
    assert r.status_code == 200, f"登录失败: {r.status_code} {r.text}"
    j = r.json()
    print(f"    响应 code={j['code']}, user={j['data']['user']['username']}, role={j['data']['user']['role']}")
    print(f"    Cookie access_token: {'已设置' if 'access_token' in r.cookies else '未设置'}")
    assert j["code"] == 0, f"登录响应 code != 0: {j}"
    assert "access_token" in r.cookies, "登录成功后必须设置 access_token cookie"

    # [3] /events 和 /admin 页面
    r = client.get("/events")
    print(f"\n[3] /events (未登录可访问) -> {r.status_code}, len={len(r.text)}")
    assert r.status_code == 200
    r = client.get("/admin")
    print(f"\n[4] /admin (已登录) -> {r.status_code}, len={len(r.text)}")
    assert r.status_code == 200

    # [5] /login 页面
    r = client.get("/login")
    print(f"\n[5] /login -> {r.status_code}, len={len(r.text)}")
    assert r.status_code == 200

    # [6] 真实登录后查询 /api/admin/ticket-types (全局票种列表)
    r = client.get("/api/admin/ticket-types")
    print(f"\n[6] GET /api/admin/ticket-types -> {r.status_code}, code={r.json().get('code')}")
    assert r.status_code == 200 and r.json()["code"] == 0
    print(f"    票种数: {len(r.json()['data'])}")
    for t in r.json()["data"]:
        print(f"    - [{t['code']}] {t['name']}, color={t['color']}")

    # [7] 真实登录后查询 /api/admin/events/{id}/ticket-type-configs (核心！)
    r = client.get(f"/api/admin/events/{event_id}/ticket-type-configs")
    print(f"\n[7] GET /api/admin/events/{event_id}/ticket-type-configs -> {r.status_code}")
    assert r.status_code == 200, f"status: {r.status_code}, body: {r.text}"
    j = r.json()
    print(f"    code={j['code']}")
    assert j["code"] == 0, f"响应 code != 0: {j}"
    cfgs = j["data"]
    print(f"    配置数: {len(cfgs)}")
    for c in cfgs:
        ttc_name = c.get("ticket_type_name")
        ttc_color = c.get("ticket_type_color")
        ttc_code = c.get("ticket_type_code")
        price = c["price"]
        inv = c["total_inventory"]
        sold = c["sold_count"]
        resv = c["reserved_count"]
        avail = c.get("available_count")
        print(f"    - {ttc_name} ({ttc_code}) 色={ttc_color} | ¥{price} 总{inv} 售{sold} 留{resv} 可用={avail}")
        assert ttc_name is not None, "票种名不能为 None (lazy load 失败!)"
        assert ttc_color is not None, "票种颜色不能为 None (lazy load 失败!)"
        assert ttc_code is not None, "票种编码不能为 None (lazy load 失败!)"
        assert avail == inv - sold - resv, f"可用数计算错: {avail} != {inv}-{sold}-{resv}"
    # 验证数据准确性
    by_name = {c["ticket_type_name"]: c for c in cfgs}
    assert by_name["VIP票"]["price"] == 1880
    assert by_name["VIP票"]["available_count"] == 80 - 12 - 5
    assert by_name["VIP票"]["ticket_type_color"] == "#E74C3C"
    assert by_name["普通票"]["ticket_type_code"] == "NORMAL"

    # [8] /api/public/events/{id}/ticket-types (前台，无需登录)
    r = client.get(f"/api/public/events/{event_id}/ticket-types")
    print(f"\n[8] GET /api/public/events/{event_id}/ticket-types -> {r.status_code}, code={r.json().get('code')}")
    assert r.status_code == 200 and r.json()["code"] == 0
    cfgs2 = r.json()["data"]
    print(f"    配置数={len(cfgs2)}")
    for c in cfgs2:
        print(f"    - {c['ticket_type_name']}: 库存={c['total_inventory']}, 可用={c['available_count']}")
        assert c["ticket_type_name"] is not None
        assert c["ticket_type_color"] is not None
        assert c["ticket_type_code"] is not None

    # [9] 换 operator 角色登录（测试角色检查）
    client2 = TestClient(app)
    with client2:
        r = client2.post("/api/auth/login", data={
            "username": "operator", "password": "op123456", "grant_type": "password",
        })
        print(f"\n[9] operator 登录 -> {r.status_code}, code={r.json().get('code')}")
        assert r.status_code == 200 and r.json()["code"] == 0
        r = client2.get(f"/api/admin/events/{event_id}/ticket-type-configs")
        print(f"    同接口运营权限访问 -> {r.status_code}, code={r.json().get('code')}")
        assert r.status_code == 200 and r.json()["code"] == 0
        print(f"    配置数={len(r.json()['data'])}")

print("\n" + "="*80)
print(" ✅ 全部验证通过：")
print("  1. 前端 form 编码提交登录 → 成功设置 cookie / 返回 LoginResponse")
print("  2. 角色字段序列化: admin / operator 分别能进入后台接口")
print("  3. /admin/ticket-types 页面能加载场次票种配置的名称/颜色/编码（无 MissingGreenlet）")
print("  4. 演示账号 admin/admin123, operator/op123456 等能正常登录")
print("  5. /events、/admin、/login 页面全部 HTTP 200")
print("="*80)
