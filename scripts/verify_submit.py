import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'test_submit.db')
DB_PATH = os.path.abspath(DB_PATH)
if os.path.exists(DB_PATH):
    os.remove(DB_PATH)

TEST_DB_URL = f'sqlite:///{DB_PATH}'
engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

import app.database as _db_mod
_db_mod.engine = engine
_db_mod.SessionLocal = SessionLocal

from app import models
from app.database import Base
Base.metadata.create_all(bind=engine)
db = SessionLocal()

from datetime import date, timedelta, datetime
from app.models import Region, Community, Technician, RepairOrder, WorkRecord, Review, OrderStatus, ActionLog
from app.utils import generate_order_no, build_full_address, log_action
from app.models import ActionType

print("=== 1. Seed regions & communities ===")
regions_data = [
    {"name": "朝阳区", "city": "北京", "demand_level": 85},
    {"name": "海淀区", "city": "北京", "demand_level": 92},
]
regions = []
for rd in regions_data:
    r = Region(**rd)
    db.add(r)
    regions.append(r)
db.flush()

communities_data = [
    {"name": "望京SOHO花园", "region_id": regions[0].id, "address_prefix": "朝阳望京"},
    {"name": "国贸阳光小区", "region_id": regions[0].id, "address_prefix": "朝阳国贸"},
    {"name": "中关村软件园社区", "region_id": regions[1].id, "address_prefix": "海淀中关村"},
]
communities = []
for cd in communities_data:
    c = Community(**cd)
    db.add(c)
    communities.append(c)
db.flush()
print(f"  {len(regions)} regions, {len(communities)} communities")

print("\n=== 2. Test /communities/options HTML endpoint ===")
from app.routers.dispatch import get_community_options

all_options = get_community_options(None, db)
print("  All options HTML:")
print("   ", all_options.replace('\n', '\n    '))

chaoyang_options = get_community_options(regions[0].id, db)
print(f"\n  Region {regions[0].name} options:")
print("   ", chaoyang_options.replace('\n', '\n    '))

haidian_options = get_community_options(regions[1].id, db)
print(f"\n  Region {regions[1].name} options:")
print("   ", haidian_options.replace('\n', '\n    '))

assert '<option value="">请选择社区</option>' in all_options
assert '望京SOHO花园' in all_options
assert '中关村软件园社区' in all_options
assert '望京SOHO花园' in chaoyang_options
assert '中关村软件园社区' not in chaoyang_options
print("  ✅ 社区 options 返回 HTML 格式正确")

print("\n=== 3. Create test order with community, address, schedule ===")
order = RepairOrder(
    order_no=generate_order_no(),
    customer_name="测试客户",
    customer_phone="13800000000",
    appliance_type="空调",
    fault_description="不制冷",
    status=OrderStatus.PENDING.value,
    priority=2,
    region_id=regions[0].id,
    community_id=communities[0].id,
    address_detail="3号楼2单元501",
    schedule_date=date.today() + timedelta(days=1),
    schedule_time_slot="上午 9:00-12:00",
)
order.full_address = build_full_address(regions[0].name, communities[0].name, order.address_detail)
db.add(order)
db.flush()
order_id = order.id

log_action(db, ActionType.CREATE_ORDER, "维修站长", order.id, {"customer": "测试客户"})
log_action(db, ActionType.SCHEDULE, "维修站长", order.id, {"schedule_date": order.schedule_date.isoformat()})
db.commit()

order_check = db.query(RepairOrder).filter(RepairOrder.id == order_id).first()
print(f"  Order ID: {order_check.id}")
print(f"  Region: {order_check.region_id} ({order_check.region.name if order_check.region else 'N/A'})")
print(f"  Community: {order_check.community_id} ({order_check.community.name if order_check.community else 'N/A'})")
print(f"  Full address: {order_check.full_address}")
print(f"  Schedule date: {order_check.schedule_date}")
print(f"  Schedule slot: {order_check.schedule_time_slot}")
print(f"  Fault desc: {order_check.fault_description}")

assert order_check.community_id == communities[0].id
assert order_check.region_id == regions[0].id
assert order_check.full_address == "朝阳区 望京SOHO花园 3号楼2单元501"
assert order_check.schedule_date == date.today() + timedelta(days=1)
assert order_check.schedule_time_slot == "上午 9:00-12:00"
print("  ✅ 工单保存了社区、地址、预约时间，且关联主记录")

print("\n=== 4. Test /logs/rows HTML endpoint ===")
from app.routers.dispatch import get_action_log_rows

all_rows = get_action_log_rows(limit=10, db=db)
print("  All log rows HTML:")
print("   ", all_rows.replace('\n', ' ')[:300], '...')

order_rows = get_action_log_rows(limit=10, order_id=order_id, db=db)
print(f"\n  Order #{order_id} log rows:")
print("   ", order_rows.replace('\n', ' ')[:300], '...')

assert '<tr>' in all_rows
assert '<td class="mono">' in all_rows
assert '维修站长' in all_rows
assert '创建工单' in all_rows
assert order_rows.count('<tr>') >= 2
assert '预约安排' in order_rows
print("  ✅ 操作日志返回 HTML 表格行，含人员、时间、详情")

print("\n=== 5. Count action logs for order ===")
log_count = db.query(ActionLog).filter(ActionLog.order_id == order_id).count()
print(f"  Order #{order_id} has {log_count} action logs")
assert log_count >= 2
print("  ✅ 操作历史与工单关联")

db.close()
os.remove(DB_PATH)

print("\n🎉 ALL TESTS PASSED ✅")
