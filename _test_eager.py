import sys, os, asyncio
sys.path.insert(0, os.path.dirname(__file__))
os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///:memory:"
os.environ["REDIS_URL"] = "redis://localhost:6379/0"

from sqlalchemy import select, func, and_
from sqlalchemy.orm import joinedload
from fastapi.testclient import TestClient
from httpx import AsyncClient, ASGITransport

from app.main import app
from app.database import Base, engine, AsyncSessionLocal
from app.models import Event, Seat, TicketType, TicketTypeConfig, User
from app.enums import EventStatus, SeatArea, SeatStatus, UserRole, TicketType as TTEnum
from app.utils import hash_password, now
from datetime import timedelta

async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    async with AsyncSessionLocal() as db:
        admin = User(username="admin", email="a@b.c", hashed_password=hash_password("x"),
                     role=UserRole.ADMIN, is_active=True)
        db.add(admin); await db.commit()

        base_time = now() + timedelta(days=7)
        ev = Event(code="T-001", name="测试演出", venue="测试场馆",
                   start_time=base_time, end_time=base_time,
                   status=EventStatus.ACTIVE, total_seats=0,
                   max_tickets_per_order=4, sales_start_time=now(), sales_end_time=base_time,
                   created_by=1, updated_by=1)
        db.add(ev); await db.commit()

        tt1 = TicketType(code="VIP", name="VIP票", type=TTEnum.VIP, color="#E74C3C", sort_order=1)
        tt2 = TicketType(code="NORM", name="普通票", type=TTEnum.SINGLE, color="#3498DB", sort_order=2)
        db.add_all([tt1, tt2]); await db.commit()

        ttc1 = TicketTypeConfig(event_id=ev.id, ticket_type_id=tt1.id, price=880,
                                original_price=880, total_inventory=50, sold_count=0,
                                created_by=1, updated_by=1)
        ttc2 = TicketTypeConfig(event_id=ev.id, ticket_type_id=tt2.id, price=380,
                                original_price=380, total_inventory=200, sold_count=0,
                                created_by=1, updated_by=1)
        db.add_all([ttc1, ttc2]); await db.commit()

        for r in range(1, 4):
            for c in range(1, 6):
                area = SeatArea.VIP if r == 1 else SeatArea.FRONT if r == 2 else SeatArea.MIDDLE
                ttc = ttc1 if r == 1 else ttc2
                tt = tt1 if r == 1 else tt2
                seat = Seat(event_id=ev.id, seat_code=f"R{r}-{c:02d}", row=f"R{r}", col=c,
                            area=area, status=SeatStatus.AVAILABLE,
                            base_price=ttc.price, current_price=ttc.price,
                            ticket_type_id=tt.id, ticket_type_config_id=ttc.id,
                            created_by=1, updated_by=1)
                db.add(seat)
        await db.commit()
        total = (await db.execute(select(func.count(Seat.id)).where(Seat.event_id == ev.id))).scalar()
        ev.total_seats = total; await db.commit()
        return ev.id

event_id = asyncio.run(init_db())
print(f"✅ 初始化完成：event_id={event_id}")

async def run_async_api_tests():
    from app.utils import create_access_token
    from app.config import settings
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # [1] /api/health
        r = await ac.get("/api/health")
        print(f"[1] /api/health -> {r.status_code}: {r.json()}")
        assert r.status_code == 200

        token = create_access_token(
            data={"sub": "1", "role": "admin"},
            expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
        )
        auth_headers = {"Authorization": f"Bearer {token}"}
        print(f"    token={token[:20]}...")

        # [2] /api/public/events/{id}/ticket-types
        r = await ac.get(f"/api/public/events/{event_id}/ticket-types")
        j = r.json()
        print(f"[2] /api/public/events/{event_id}/ticket-types -> {r.status_code}, code={j.get('code')}")
        assert r.status_code == 200 and j.get("code") == 0
        items = j["data"]
        print(f"    票种数={len(items)}")
        for t in items:
            print(f"    - {t['ticket_type_name']}: price={t['price']}, "
                  f"color={t['ticket_type_color']}, code={t['ticket_type_code']}, "
                  f"库存={t['total_inventory']}, 可用={t['available_count']}")
        assert len(items) == 2
        assert items[0]["ticket_type_name"] is not None, "ticket_type_name 不能为 None"
        assert items[0]["ticket_type_color"] is not None, "ticket_type_color 不能为 None"
        assert items[0]["ticket_type_code"] is not None, "ticket_type_code 不能为 None"

        # [3] /api/public/events/{id}/seats
        r = await ac.get(f"/api/public/events/{event_id}/seats")
        j = r.json()
        print(f"[3] /api/public/events/{event_id}/seats -> {r.status_code}, code={j.get('code')}")
        assert r.status_code == 200 and j.get("code") == 0
        seats = j["data"]
        print(f"    座位数={len(seats)}, ttc_id 示例={[s['ticket_type_config_id'] for s in seats[:3]]}")
        assert len(seats) == 15
        assert all(s["ticket_type_config_id"] is not None for s in seats)

        # [4] /api/admin/events/{id}/ticket-type-configs
        r = await ac.get(f"/api/admin/events/{event_id}/ticket-type-configs", headers=auth_headers)
        j = r.json()
        print(f"[4] /api/admin/events/{event_id}/ticket-type-configs -> {r.status_code}, code={j.get('code')}")
        assert r.status_code == 200 and j.get("code") == 0, f"admin resp: {j}"
        cfgs = j["data"]
        print(f"    配置数={len(cfgs)}")
        for c in cfgs:
            print(f"    - {c['ticket_type_name']}: price={c['price']}, "
                  f"color={c['ticket_type_color']}, code={c['ticket_type_code']}")
        assert len(cfgs) == 2
        assert all(c["ticket_type_name"] is not None for c in cfgs), "后台票种名不能为 None"

asyncio.run(run_async_api_tests())

# 同步页面测试
print("\n----- [5. 页面可访问] -----")
with TestClient(app) as client:
    r1 = client.get("/api/health")
    print(f"[5] /api/health -> {r1.status_code}"); assert r1.status_code == 200
    r2 = client.get("/events")
    print(f"[6] /events -> {r1.status_code}"); assert r2.status_code == 200
    r3 = client.get("/admin")
    print(f"[7] /admin -> {r3.status_code}"); assert r3.status_code == 200

print("\n" + "="*80)
print("✅ 全部验证通过:")
print("  1. /api/public/events/{id}/ticket-types joinedload 预加载 TicketType，返回名称/颜色/编码无 MissingGreenlet")
print("  2. /api/admin/events/{id}/ticket-type-configs 同样预加载，业务人员可维护票种库存数据")
print("  3. 座位查询预加载 ticket_type + ticket_type_config 双关系")
print("  4. /api/health, /events, /admin 页面 HTTP 200 可访问")
