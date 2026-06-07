import random
from datetime import datetime, date, timedelta
from sqlalchemy.orm import Session
from app.models.models import Cleaner, Room, WorkOrder, Rework, ShiftHandover

ROOM_TYPES = ["标准间", "大床房", "商务房", "套房", "总统套房"]
VIP_ROOM_TYPES = ["套房", "总统套房"]
FLOORS = list(range(3, 11))
ROOMS_PER_FLOOR = 16
SHIFTS = ["morning", "afternoon", "evening"]
REWORK_REASONS = [
    "毛巾缺失", "浴巾未更换", "垃圾桶未清", "床单有污渍",
    "水杯未清洗", "拖鞋未摆放", "洗浴用品缺失", "地毯有灰尘",
    "镜子有水渍", "马桶未清洁", "空调滤网脏", "枕头缺失",
]
MISSING_ITEMS = [
    "毛巾", "浴巾", "牙刷", "梳子", "浴帽", "拖鞋",
    "矿泉水", "茶包", "咖啡", "护发素", "身体乳", "衣架",
]
CLEANER_NAMES = [
    "王秀英", "李桂兰", "张翠花", "刘淑芬", "陈玉梅",
    "赵红霞", "周美玲", "吴兰英", "郑凤英", "孙丽华",
    "马秀芳", "朱桂香", "胡美珍", "林秀珍", "何玉兰",
]


def seed_data(db: Session):
    if db.query(Cleaner).first():
        return

    cleaners = []
    for i, name in enumerate(CLEANER_NAMES):
        c = Cleaner(
            name=name,
            employee_id=f"CL{i+1:03d}",
            shift=SHIFTS[i % 3],
            is_active=True,
        )
        cleaners.append(c)
    db.add_all(cleaners)
    db.flush()

    rooms = []
    for floor in FLOORS:
        for j in range(ROOMS_PER_FLOOR):
            room_num = f"{floor}{j+1:02d}"
            rtype = random.choice(ROOM_TYPES)
            is_vip = rtype in VIP_ROOM_TYPES or (floor >= 9)
            rooms.append(Room(
                room_number=room_num,
                floor=floor,
                room_type=rtype,
                is_vip=is_vip,
                status=random.choice(["dirty", "cleaning", "clean", "inspected"]),
            ))
    db.add_all(rooms)
    db.flush()

    cleaner_by_shift = {s: [c for c in cleaners if c.shift == s] for s in SHIFTS}
    rooms_by_floor = {f: [r for r in rooms if r.floor == f] for f in FLOORS}

    today = date.today()
    all_orders = []
    all_reworks = []
    all_handovers = []
    order_counter = 0

    for day_offset in range(14):
        d = today - timedelta(days=day_offset)
        for floor in FLOORS:
            floor_rooms = rooms_by_floor[floor]
            selected_rooms = random.sample(floor_rooms, k=min(random.randint(6, 10), len(floor_rooms)))
            for idx, room in enumerate(selected_rooms):
                order_counter += 1
                shift = SHIFTS[idx % 3]
                shift_cleaners = cleaner_by_shift[shift]
                cleaner = random.choice(shift_cleaners)

                is_late = random.random() < 0.15
                is_vip = room.is_vip

                base_duration = random.uniform(25, 50) if not is_vip else random.uniform(40, 70)
                if is_late:
                    base_duration += random.uniform(5, 15)

                hour_base = {"morning": 7, "afternoon": 14, "evening": 21}[shift]
                assigned_at = datetime.combine(d, datetime.min.time()).replace(
                    hour=hour_base + random.randint(0, 2),
                    minute=random.randint(0, 59)
                )
                start_time = assigned_at + timedelta(minutes=random.randint(5, 20))
                end_time = start_time + timedelta(minutes=base_duration)
                inspection_time = end_time + timedelta(minutes=random.randint(3, 15))

                status = random.choice(["completed", "completed", "completed", "completed", "completed", "rework"])

                order = WorkOrder(
                    order_number=f"WO{d.strftime('%Y%m%d')}{floor:02d}{idx+1:02d}",
                    room_id=room.id,
                    cleaner_id=cleaner.id,
                    shift=shift,
                    status=status,
                    is_late_checkout=is_late,
                    is_vip=is_vip,
                    assigned_at=assigned_at,
                    start_time=start_time,
                    end_time=end_time,
                    inspection_time=inspection_time,
                    cleaning_duration=round(base_duration, 1),
                    date=d,
                )
                all_orders.append(order)

    db.add_all(all_orders)
    db.flush()

    room_map = {r.id: r for r in rooms}

    for order in all_orders:
        if order.status == "rework" or random.random() < 0.2:
            rework_delay = random.uniform(5, 120)
            rework_time = order.inspection_time + timedelta(minutes=rework_delay)
            reason = random.choice(REWORK_REASONS)
            missing = random.choice(MISSING_ITEMS) if random.random() < 0.6 else None

            shift_cleaners = cleaner_by_shift[order.shift]
            rm = room_map[order.room_id]
            all_reworks.append(Rework(
                work_order_id=order.id,
                reason=reason,
                missing_item=missing,
                rework_time=rework_time,
                minutes_after_inspection=round(rework_delay, 1),
                reassigned_cleaner_id=random.choice(shift_cleaners).id if random.random() < 0.3 else None,
                rework_duration=round(random.uniform(10, 30), 1),
                floor=rm.floor,
                room_type=rm.room_type,
                is_vip=order.is_vip,
            ))

        if random.random() < 0.08:
            shift_cleaners = cleaner_by_shift[order.shift]
            other_cleaner = random.choice([c for c in shift_cleaners if c.id != order.cleaner_id])
            handover_at = order.start_time + timedelta(minutes=order.cleaning_duration * random.uniform(0.3, 0.7))
            all_handovers.append(ShiftHandover(
                work_order_id=order.id,
                from_cleaner_id=order.cleaner_id,
                to_cleaner_id=other_cleaner.id,
                handover_time=handover_at,
                from_duration=round(order.cleaning_duration * 0.4, 1),
                to_duration=round(order.cleaning_duration * 0.6, 1),
                note="换班交接",
            ))

    if all_reworks:
        db.add_all(all_reworks)
    if all_handovers:
        db.add_all(all_handovers)

    db.commit()
