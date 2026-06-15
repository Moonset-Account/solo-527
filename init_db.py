import asyncio
from sqlalchemy import select, text
from app.database import Base, engine, AsyncSessionLocal
from app.redis_client import init_redis, close_redis
from app.models import User, Event, TicketType, SystemConfig, Seat
from app.enums import UserRole, EventStatus, TicketType as TTEnum, ConfigStatus, SeatArea, SeatStatus
from app.utils import hash_password, now
from datetime import timedelta


async def init_default_data():
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User.id).where(User.username == "admin"))
        if not result.scalar_one_or_none():
            admin = User(
                username="admin",
                email="admin@concert-tickets.com",
                real_name="系统管理员",
                hashed_password=hash_password("admin123"),
                role=UserRole.ADMIN,
                is_active=True,
            )
            operator = User(
                username="operator",
                email="operator@concert-tickets.com",
                real_name="运营专员",
                hashed_password=hash_password("op123456"),
                role=UserRole.OPERATOR,
                is_active=True,
            )
            finance = User(
                username="finance",
                email="finance@concert-tickets.com",
                real_name="财务人员",
                hashed_password=hash_password("fin123456"),
                role=UserRole.FINANCE,
                is_active=True,
            )
            test = User(
                username="test001",
                email="test001@concert-tickets.com",
                real_name="测试用户",
                phone="13800138000",
                hashed_password=hash_password("test123456"),
                role=UserRole.USER,
                is_active=True,
            )
            db.add_all([admin, operator, finance, test])
            await db.commit()
            print("创建默认用户: admin/admin123, operator/op123456, finance/fin123456, test001/test123456")

        tt_result = await db.execute(select(TicketType.id).limit(1))
        if not tt_result.scalar_one_or_none():
            ticket_types = [
                TicketType(code="VIP", name="VIP票", type=TTEnum.VIP, color="#E74C3C", icon="star", sort_order=1, is_default=False),
                TicketType(code="NORMAL", name="普通票", type=TTEnum.SINGLE, color="#3498DB", icon="ticket", sort_order=2, is_default=True),
                TicketType(code="STUDENT", name="学生票", type=TTEnum.STUDENT, color="#2ECC71", icon="graduation", sort_order=3, is_default=False),
                TicketType(code="EARLY", name="早鸟票", type=TTEnum.EARLY_BIRD, color="#F39C12", icon="bird", sort_order=4, is_default=False),
            ]
            db.add_all(ticket_types)
            await db.commit()
            print("创建默认票种")

        cfg_result = await db.execute(select(SystemConfig.id).limit(1))
        if not cfg_result.scalar_one_or_none():
            configs = [
                SystemConfig(key="site.title", name="站点标题", category="basic", value_type="string",
                              value={"value": "音乐演出票务平台"}, status=ConfigStatus.ENABLED, sort_order=1),
                SystemConfig(key="seat.lock_timeout", name="座位锁定超时(秒)", category="seat", value_type="integer",
                              value={"value": 300}, status=ConfigStatus.ENABLED, sort_order=1),
                SystemConfig(key="seat.repeat_max", name="重复占座最大次数", category="seat", value_type="integer",
                              value={"value": 3}, status=ConfigStatus.ENABLED, sort_order=2),
                SystemConfig(key="seat.repeat_window", name="重复占座检测窗口(秒)", category="seat", value_type="integer",
                              value={"value": 60}, status=ConfigStatus.ENABLED, sort_order=3),
                SystemConfig(key="refund.fee_rate", name="退款手续费率", category="refund", value_type="float",
                              value={"value": 0.05}, status=ConfigStatus.ENABLED, sort_order=1),
                SystemConfig(key="refund.min_fee", name="最低退款手续费", category="refund", value_type="float",
                              value={"value": 2.0}, status=ConfigStatus.ENABLED, sort_order=2),
                SystemConfig(key="refund.enable_auto", name="启用自动退款", category="refund", value_type="boolean",
                              value={"value": False}, status=ConfigStatus.DRAFT, sort_order=3),
                SystemConfig(key="order.max_tickets", name="单笔最大票数", category="order", value_type="integer",
                              value={"value": 6}, status=ConfigStatus.ENABLED, sort_order=1),
                SystemConfig(key="gray.booking_flow", name="新购票流程灰度", category="gray", value_type="string",
                              value={"value": "0%", "comment": "可配置0%/10%/50%/100%"}, status=ConfigStatus.DISABLED, sort_order=1),
            ]
            db.add_all(configs)
            await db.commit()
            print("创建默认配置项")

        ev_result = await db.execute(select(Event.id).limit(1))
        if not ev_result.scalar_one_or_none():
            base_time = now() + timedelta(days=7)
            events = [
                Event(
                    code="CONCERT-2026-001",
                    name="夏日摇滚音乐节",
                    artist="多位知名乐队",
                    venue="国家体育场",
                    address="北京市朝阳区国家体育场南路1号",
                    start_time=base_time.replace(hour=19, minute=30),
                    end_time=base_time.replace(hour=23, minute=0),
                    door_time=base_time.replace(hour=18, minute=0),
                    description="年度最盛大的摇滚盛宴，汇聚国内顶尖乐队阵容。",
                    status=EventStatus.ACTIVE,
                    total_seats=0,
                    max_tickets_per_order=4,
                    sales_start_time=now() - timedelta(days=3),
                    sales_end_time=base_time.replace(hour=18, minute=0),
                    refund_deadline=base_time - timedelta(days=2),
                    requires_registration=False,
                    created_by=1,
                    updated_by=1,
                ),
                Event(
                    code="CONCERT-2026-002",
                    name="钢琴诗人独奏会",
                    artist="李云迪",
                    venue="国家大剧院",
                    address="北京市西城区西长安街2号",
                    start_time=base_time + timedelta(days=3, hours=2),
                    end_time=base_time + timedelta(days=3, hours=4, minutes=30),
                    door_time=base_time + timedelta(days=3, hours=1),
                    description="经典钢琴曲之夜，感受音乐的诗意与浪漫。",
                    status=EventStatus.ACTIVE,
                    total_seats=0,
                    max_tickets_per_order=2,
                    sales_start_time=now() - timedelta(days=1),
                    sales_end_time=base_time + timedelta(days=3, hours=1),
                    refund_deadline=base_time + timedelta(days=1),
                    requires_registration=True,
                    registration_start=now(),
                    registration_end=base_time + timedelta(days=2),
                    created_by=1,
                    updated_by=1,
                ),
            ]
            db.add_all(events)
            await db.commit()
            for ev in events:
                areas_config = [
                    {"area": SeatArea.VIP, "rows": 5, "cols": 12, "price": 1880.0, "row_prefix": "V"},
                    {"area": SeatArea.FRONT, "rows": 8, "cols": 20, "price": 980.0, "row_prefix": "A"},
                    {"area": SeatArea.MIDDLE, "rows": 12, "cols": 28, "price": 580.0, "row_prefix": "M"},
                    {"area": SeatArea.BACK, "rows": 10, "cols": 30, "price": 280.0, "row_prefix": "B"},
                ]
                for ac in areas_config:
                    for r in range(1, ac["rows"] + 1):
                        for c in range(1, ac["cols"] + 1):
                            is_blocked = False
                            if r == 3 and c in [10, 11, 12]:
                                is_blocked = True
                            seat = Seat(
                                event_id=ev.id,
                                seat_code=f"{ac['area'].value.upper()}-{ac['row_prefix']}{r}-{c:02d}",
                                row=f"{ac['row_prefix']}{r}",
                                col=c,
                                area=ac["area"],
                                status=SeatStatus.BLOCKED if is_blocked else SeatStatus.AVAILABLE,
                                base_price=ac["price"],
                                current_price=ac["price"],
                                created_by=1,
                                updated_by=1,
                            )
                            db.add(seat)
            await db.commit()

            for ev in events:
                from sqlalchemy import func
                total = await db.execute(select(func.count(Seat.id)).where(Seat.event_id == ev.id))
                total_count = total.scalar() or 0
                from sqlalchemy import update
                await db.execute(update(Event).where(Event.id == ev.id).values(
                    total_seats=total_count,
                ))
            await db.commit()
            print("创建样例场次和座位数据")

    print("默认数据初始化完成")


async def main():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    await init_redis()
    try:
        await init_default_data()
    finally:
        await close_redis()
        await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
