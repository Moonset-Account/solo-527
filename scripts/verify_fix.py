import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'test_check.db')
DB_PATH = os.path.abspath(DB_PATH)
if os.path.exists(DB_PATH):
    os.remove(DB_PATH)

TEST_DB_URL = f'sqlite:///{DB_PATH}'
engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

import app.database as _db_mod
_db_mod.engine = engine
_db_mod.SessionLocal = SessionLocal

from app import models  # NOQA - register models with Base
from app.database import Base
Base.metadata.create_all(bind=engine)
db = SessionLocal()
print("Using test DB:", engine.url)
print("Tables in metadata:", list(Base.metadata.tables.keys()))

from datetime import date, timedelta, datetime
from app.models import Region, Community, Technician, RepairOrder, WorkRecord, Review, OrderStatus
from app.utils import generate_order_no, build_full_address

r = Region(name="测试区", city="北京", demand_level=80)
db.add(r); db.flush()
c = Community(name="测试社区", region_id=r.id, address_prefix="xxx街")
db.add(c); db.flush()
t = Technician(name="张测试", phone="13000000001", community_id=c.id)
db.add(t); db.flush()

today = date.today()
orders_with_refund = 0
for i in range(6):
    sched = today - timedelta(days=i)
    completed = (i % 2 == 0)
    refunded = (i == 2)
    status = (OrderStatus.REFUNDED.value if refunded else
              (OrderStatus.COMPLETED.value if completed else OrderStatus.IN_PROGRESS.value))
    o = RepairOrder(
        order_no=generate_order_no(),
        customer_name="客户"+str(i),
        customer_phone="1380000000"+str(i),
        appliance_type="空调",
        fault_description="故障"+str(i),
        status=status,
        region_id=r.id,
        community_id=c.id,
        address_detail=str(i+1)+"号楼",
        schedule_date=sched,
        schedule_time_slot="上午",
        technician_id=t.id,
        repair_fee=200, parts_fee=50, total_fee=250,
        paid=completed or refunded
    )
    o.full_address = build_full_address(r.name, c.name, o.address_detail)
    if refunded:
        o.refund_reason = "not_repaired"
        o.refund_amount = 200
        o.refunded_at = datetime.utcnow()
        orders_with_refund += 1
    db.add(o)
    db.flush()
    if completed or refunded:
        db.add(WorkRecord(order_id=o.id, technician_id=t.id, work_date=sched,
                          community_id=c.id, hours_spent=2.0, status=status))

db.commit()
print(f"Created test data: technician #{t.id}, orders with refund: {orders_with_refund}")

from app.routers.technicians import get_technician_load_detail
result = get_technician_load_detail(t.id, today-timedelta(days=10), today, db)
print("\n=== Load Detail ===")
print(f"Total orders: {result.total_orders}, total_hours: {result.total_hours}")
print(f"By date entries: {len(result.by_date)}")
print(f"By community entries: {len(result.by_community)}")
print(f"Refund breakdown: {result.refund_breakdown}")
for d in result.by_date:
    print(f"  {d.date_key}: orders={d.order_count}, hours={d.hours}, "
          f"refund_issues={d.refund_issues}, reasons={d.refund_reasons}")
for c_obj in result.by_community:
    print(f"  Community {c_obj['community_name']}: {c_obj['order_count']} orders, {c_obj['hours']}h")

assert len(result.by_date) > 0, "by_date empty"
assert len(result.by_community) > 0, "by_community empty"
assert any(d.refund_issues > 0 for d in result.by_date), "no refund issues found"
assert any(len(d.refund_reasons) > 0 for d in result.by_date), "no refund reasons found"
assert len(result.refund_breakdown) > 0, "refund_breakdown empty"
print("\n✅ REFUND REASON SPLIT FIX VERIFIED")

from app.routers.dispatch import get_todos, dispatch_dashboard
todos = get_todos(db)
print("\n=== Todos ===", todos)
dash = dispatch_dashboard(db)
print("\n=== Dashboard ===")
print("region_stats count:", len(dash['region_stats']))
print("pending_orders count:", len(dash['pending_orders']))
print("abnormal_orders count:", len(dash['abnormal_orders']))
print("idle_technicians:", len(dash['idle_technicians']))
print("\n✅ DASHBOARD VERIFIED")

db.close()
os.remove('test_check.db')
print("\nAll logic tests passed ✅")
