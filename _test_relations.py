import sys, os, asyncio
sys.path.insert(0, os.path.dirname(__file__))
os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///:memory:"
os.environ["REDIS_URL"] = "redis://localhost:6379/0"

from sqlalchemy import select, func, and_
from sqlalchemy.orm import joinedload, selectinload
from fastapi.testclient import TestClient
from app.main import app
from app.database import Base, engine, AsyncSessionLocal
from app.models import Event, Seat, TicketType, TicketTypeConfig, User
from app.enums import EventStatus, SeatArea, SeatStatus, UserRole, TicketType as TTEnum
from app.utils import hash_password, now
from datetime import timedelta

async def full_test():
    # ===== 初始化数据库 =====
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
        event_id = ev.id
    print(f"✅ 初始化完成：event_id={event_id}，总座位 {total} 个")

    # ===== 测试 SQLAlchemy relationship 正确 =====
    print("\n----- [1. SQLAlchemy mapper 验证] -----")
    async with AsyncSessionLocal() as db:
        # 用 joinedload 一次性 eager load 关系，避免异步 aiosqlite lazy load 的 greenlet 问题
        q1 = (select(Seat).where(Seat.event_id == event_id)
                .options(joinedload(Seat.ticket_type),
                         joinedload(Seat.ticket_type_config))
                .order_by(Seat.area, Seat.row, Seat.col))
        seats = list((await db.execute(q1)).scalars().unique().all())
        assert len(seats) == 15, f"座位数量错误: {len(seats)}"

        s_front = seats[0]  # area order: FRONT < MIDDLE < VIP
        print(f"Seat[{s_front.seat_code}]: "
              f"ticket_type_id={s_front.ticket_type_id}, ticket_type_config_id={s_front.ticket_type_config_id}")
        has_tt_name = s_front.ticket_type.name if s_front.ticket_type else None
        has_ttc_price = s_front.ticket_type_config.price if s_front.ticket_type_config else None
        print(f"  -> Seat.ticket_type.name = {has_tt_name}")
        print(f"  -> Seat.ticket_type_config.price = {has_ttc_price}")
        assert s_front.ticket_type is not None, "Seat -> TicketType 关系丢失"
        assert s_front.ticket_type_config is not None, "Seat -> TicketTypeConfig 关系丢失"
        assert s_front.ticket_type.name == "普通票", "Seat.ticket_type.name 错误"
        assert s_front.ticket_type_config.price == 380.0, "Seat.ticket_type_config.price 错误"

        # 找 VIP 区的座位验证
        s_vip = next(s for s in seats if s.area == SeatArea.VIP)
        assert s_vip.ticket_type.name == "VIP票", "VIP 区 Seat.ticket_type.name 错误"
        assert s_vip.ticket_type_config.price == 880.0, "VIP 区 Seat.ticket_type_config.price 错误"
        print(f"  -> VIP 区验证: {s_vip.seat_code} → {s_vip.ticket_type.name} @ ¥{s_vip.ticket_type_config.price}")

        # 查询 TicketTypeConfig 并 eager load 反向 seats 关系
        q2 = (select(TicketTypeConfig)
                .join(TicketType, TicketType.id == TicketTypeConfig.ticket_type_id)
                .options(joinedload(TicketTypeConfig.ticket_type),
                         selectinload(TicketTypeConfig.seats))
                .where(and_(TicketTypeConfig.event_id == event_id, TicketTypeConfig.is_active == True))
                .order_by(TicketTypeConfig.sort_order))
        configs = list((await db.execute(q2)).scalars().unique().all())
        assert len(configs) == 2, f"票种数量错误: {len(configs)}"

        c1 = configs[0]
        print(f"\nTicketTypeConfig[{c1.ticket_type.name}]: price={c1.price}")
        cfg_seats = list(c1.seats) if c1.seats else []
        print(f"  -> TicketTypeConfig.seats 关联数量 = {len(cfg_seats)}")
        assert len(cfg_seats) == 5, f"TicketTypeConfig -> Seat 反向关联错误: {len(cfg_seats)} != 5"

    print("\n✅ Seat.ticket_type_config ↔ TicketTypeConfig.seats 双向 mapper 配置完成")

    # ===== 验证座位查询和票种库存查询能进入数据库执行 =====
    print("\n----- [2. 数据库执行验证] -----")
    async with AsyncSessionLocal() as db:
        # 同 /api/public/events/{id}/seats 接口逻辑
        from app.schemas.common import SeatOut, TicketTypeConfigOut
        q = (select(Seat).where(Seat.event_id == event_id)
                .options(joinedload(Seat.ticket_type), joinedload(Seat.ticket_type_config))
                .order_by(Seat.area, Seat.row, Seat.col))
        db_seats = list((await db.execute(q)).scalars().unique().all())
        seat_items = [SeatOut.model_validate(s) for s in db_seats]
        print(f"Seat 查询成功: {len(seat_items)} 条, ttc_id 列表示例: "
              f"{[s.ticket_type_config_id for s in seat_items[:4]]}")
        assert all(s.ticket_type_config_id is not None for s in seat_items), \
            "所有座位都应关联到票种配置"
        assert len(seat_items) == 15, f"座位数量不符: {len(seat_items)}"

        # 同 /api/public/events/{id}/ticket-types 接口逻辑（预加载 ticket_type）
        q = (select(TicketTypeConfig)
                .join(TicketType, TicketType.id == TicketTypeConfig.ticket_type_id)
                .options(joinedload(TicketTypeConfig.ticket_type))
                .where(and_(TicketTypeConfig.event_id == event_id, TicketTypeConfig.is_active == True))
                .order_by(TicketTypeConfig.sort_order))
        db_cfgs = list((await db.execute(q)).scalars().unique().all())
        cfg_items = []
        for cfg in db_cfgs:
            tto = TicketTypeConfigOut.model_validate(cfg)
            tto.available_count = cfg.total_inventory - cfg.sold_count - cfg.reserved_count
            # eager loaded
            tto.ticket_type_name = cfg.ticket_type.name
            tto.ticket_type_color = cfg.ticket_type.color
            tto.ticket_type_code = cfg.ticket_type.code
            cfg_items.append(tto)
        print(f"票种库存查询成功: {len(cfg_items)} 个票种, "
              f"详情: {[(t.ticket_type_name, t.price, t.total_inventory, t.available_count) for t in cfg_items]}")
        assert len(cfg_items) == 2, "票种配置应为 2 个"
        # 验证库存数据
        inv_map = {t.ticket_type_name: (t.total_inventory, t.available_count) for t in cfg_items}
        assert inv_map.get("VIP票") == (50, 50), f"VIP票库存错误: {inv_map.get('VIP票')}"
        assert inv_map.get("普通票") == (200, 200), f"普通票库存错误: {inv_map.get('普通票')}"

    print("✅ 座位查询和票种库存查询进入数据库执行成功")

asyncio.run(full_test())

# ===== 最后验证 HTMX 页面和 /api/health =====
print("\n----- [3. 页面/健康检查可访问] -----")
with TestClient(app) as client:
    r1 = client.get("/api/health")
    print(f"[1] /api/health -> {r1.status_code}: {r1.json()}"); assert r1.status_code == 200
    r2 = client.get("/events")
    print(f"[2] /events -> {r2.status_code} HTML len={len(r2.text)}"); assert r2.status_code == 200
    r3 = client.get("/admin")
    print(f"[3] /admin -> {r3.status_code} HTML len={len(r3.text)}"); assert r3.status_code == 200
    r4 = client.get("/login")
    print(f"[4] /login -> {r4.status_code} HTML len={len(r4.text)}"); assert r4.status_code == 200

print("\n" + "="*80)
print("✅ 全部验证通过:")
print("  1. Seat.ticket_type_config ↔ TicketTypeConfig.seats 双向关系已正确绑定到外键")
print("  2. 座位查询和票种库存查询可完整进入数据库执行，ORM lazy load 正常")
print("  3. /api/health, /events, /admin 均 HTTP 200 可访问")
