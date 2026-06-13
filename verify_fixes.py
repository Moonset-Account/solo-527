from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

print("\n==== Test 1: /api/prices/trend 无参数 ====")
r = client.get('/api/prices/trend', follow_redirects=False)
print(f"  Status: {r.status_code} (期望 <400 且 !=422)")
ok1 = r.status_code < 400 and r.status_code != 422
print(f"  Result: {'PASS' if ok1 else 'FAIL'}")

print("\n==== Test 2: /api/prices/trend 带 material_name ====")
r = client.get('/api/prices/trend', params={'material_name': '钢材'}, follow_redirects=False)
print(f"  Status: {r.status_code} (期望 <400 且 !=422)")
ok2 = r.status_code < 400 and r.status_code != 422
print(f"  Result: {'PASS' if ok2 else 'FAIL'}")

print("\n==== Test 3: Pydantic schema 校验 delivered_quantity ====")
from app.schemas import DeliveryRecordCreate, DeliveryRecordResponse, DeliveryRecordUpdate
from datetime import date, datetime
from decimal import Decimal

pass3 = 0
tests3 = 0

tests3 += 1
try:
    rec = DeliveryRecordResponse(
        id=1, purchase_id=100,
        delivered_quantity=Decimal('0'),
        delivery_date=date.today(),
        invoice_status_code='closed',
        remark='关闭：取消采购',
        created_at=datetime.now()
    )
    print(f"  PASS: Response.delivered_quantity=0")
    pass3 += 1
except Exception as e:
    print(f"  FAIL: Response.delivered_quantity=0: {e}")

tests3 += 1
try:
    rec2 = DeliveryRecordResponse(
        id=2, purchase_id=101,
        delivered_quantity=Decimal('50.00'),
        delivery_date=date.today(),
        created_at=datetime.now()
    )
    print(f"  PASS: Response.delivered_quantity=50.00")
    pass3 += 1
except Exception as e:
    print(f"  FAIL: {e}")

tests3 += 1
try:
    DeliveryRecordCreate(
        purchase_id=102,
        delivered_quantity=Decimal('0'),
        delivery_date=date.today()
    )
    print(f"  FAIL: Create.delivered_quantity=0 应该拒绝")
except Exception:
    print(f"  PASS: Create.delivered_quantity=0 按预期拒绝")
    pass3 += 1

tests3 += 1
try:
    DeliveryRecordCreate(
        purchase_id=103,
        delivered_quantity=Decimal('20.00'),
        delivery_date=date.today()
    )
    print(f"  PASS: Create.delivered_quantity=20.00")
    pass3 += 1
except Exception as e:
    print(f"  FAIL: {e}")

print(f"  Result: {pass3}/{tests3}")

print("\n==== Test 4: 关键 API 路由 ====")
paths = [
    '/api/prices/trend',
    '/api/prices/trend?material_name=A',
    '/api/prices/stats',
    '/api/prices/stats?material_name=A',
    '/api/prices/materials',
    '/api/prices/records',
    '/api/prices/expiring',
    '/api/prices/export',
    '/api/deliveries',
    '/api/deliveries/export',
    '/api/deliveries/stats/summary',
    '/api/deliveries/stats/diff-types',
    '/api/deliveries/stats/monthly',
]
pass4 = 0
for path in paths:
    r = client.get(path, follow_redirects=False)
    ok = r.status_code < 400 and r.status_code != 422
    if ok: pass4 += 1
    print(f"  {'OK' if ok else 'ER'} {r.status_code:3d} GET {path}")
print(f"  Result: {pass4}/{len(paths)}")

print("\n==== OVERALL ====")
overall = (ok1 and ok2 and pass3 == tests3 and pass4 == len(paths))
print(f"  Total: {'ALL PASS' if overall else 'SOME FAIL'}")
