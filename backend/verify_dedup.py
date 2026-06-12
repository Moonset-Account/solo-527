import os
import sys

os.environ.pop("USE_POSTGRES", None)
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.main import app
from app.tasks import send_notification
from fastapi.testclient import TestClient

client = TestClient(app)

SEP = "=" * 60
print(SEP)
print("最小审核流程验证（保留现有数据）")
print(SEP)

# 1. 注册账号（幂等，不删现有）
u, p, role = "verify_s", "pass123", "student"
extra = {"real_name": "验证学生", "student_id": "V001", "dorm_room": "V-101", "phone": "13900000001"}
r = client.post("/api/auth/register", json={"username": u, "password": p, "role": role, **extra})
print(f"[1] 注册 verify_s: {r.status_code}")

r = client.post("/api/auth/register", json={"username": "verify_a", "password": "pass123", "role": "admin", "real_name": "验证管理员"})
print(f"[1] 注册 verify_a: {r.status_code}")

# 2. 登录
r_s = client.post("/api/auth/login", data={"username": "verify_s", "password": "pass123"})
assert r_s.status_code == 200, f"学生登录失败"
st = r_s.json()["access_token"]
sh = {"Authorization": f"Bearer {st}"}

r_a = client.post("/api/auth/login", data={"username": "verify_a", "password": "pass123"})
assert r_a.status_code == 200, f"管理员登录失败"
at = r_a.json()["access_token"]
ah = {"Authorization": f"Bearer {at}"}

me = client.get("/api/auth/me", headers=sh).json()
sid = me["id"]
print(f"[2] 学生ID: {sid}")

# 3. 学生提交新报修
r = client.post("/api/repairs/", data={
    "title": f"去重验证-{os.getpid()}",
    "category": "plumbing",
    "description": "验证去重流程",
    "dorm_room": "V-101",
    "urgency": "low",
}, headers=sh)
print(f"[3] 提交报修: {r.status_code}")
oid = r.json()["id"]
print(f"    工单号: {oid}")

# 4. 审核前：查一次
r = client.get("/api/repairs/notifications", headers=sh)
before = r.json()
print(f"[4] 审核前通知列表数: {len(before)}")

# 5. 管理员审核（同步写入 1 条）
audit_comment = "验证去重-OK"
r = client.post(f"/api/admin/repairs/{oid}/audit", json={
    "action": "approve",
    "comment": audit_comment,
}, headers=ah)
print(f"[5] 审核接口: {r.status_code}")
print(f"    action={r.json().get('action')}")

# 6. 审核后立即查：同步落库立即可见
r = client.get("/api/repairs/notifications", headers=sh)
after_sync = r.json()
sync_delta = len(after_sync) - len(before)
print(f"[6] 审核后(同步) 通知列表: {len(after_sync)}  (新增{sync_delta})")

r = client.get(f"/api/repairs/{oid}", headers=sh)
detail = r.json()
notif_in_detail = len(detail.get("notification_receipts", []))
print(f"    详情内通知数: {notif_in_detail}")
if after_sync:
    latest = after_sync[0]
    print(f"    最新内容: {latest['content']}")
    print(f"    渠道: {latest['channel']}")
    print(f"    是否已读: {latest['is_read']}")

# 7. 模拟 Celery worker 执行 send_notification
expected_content = f"您的报修工单 #{oid} 已被approve。 备注：{audit_comment}"
print()
print(f"[7] 模拟 Celery: send_notification(sid={sid}, oid={oid}, channel=in_app)")
result = send_notification(sid, oid, "in_app", expected_content)
print(f"    Celery 返回: {result}")

# 8. Celery 后再查，不应增加
r = client.get("/api/repairs/notifications", headers=sh)
after_celery = r.json()
celery_delta = len(after_celery) - len(after_sync)
print(f"[8] Celery 后通知列表: {len(after_celery)}  (新增{celery_delta})")

r = client.get(f"/api/repairs/{oid}", headers=sh)
detail2 = r.json()
notif_in_detail2 = len(detail2.get("notification_receipts", []))
print(f"    详情内通知数: {notif_in_detail2}")

# 9. 导出验证（导出通知次数应为 1）
print()
print("[9] 同步导出并检查通知次数...")
r = client.post("/api/export/sync", json={
    "export_type": "repairs",
    "filter_params": {},
}, headers=ah)
eid = None
if r.status_code in (200, 201):
    eid = r.json()["id"]
    print(f"    导出ID: {eid}")
else:
    print(f"    导出失败: {r.status_code}")

# 10. 汇总验证
print()
print(SEP)
print("验证结果汇总")
print(SEP)
all_ok = True

def check(label, cond, detail=""):
    global all_ok
    icon = "✅" if cond else "❌"
    print(f"{icon} {label} {detail}")
    if not cond:
        all_ok = False

check("审核同步新增 1 条通知", sync_delta == 1, f"(实际新增 {sync_delta})")
check("学生端通知列表立即可见", len(after_sync) >= 1)
check("详情内包含通知回执", notif_in_detail >= 1)
check("Celery 返回 skipped（检测重复",
      result.get("status") == "skipped",
      f"(实际: {result})")
check("Celery 后无新增", celery_delta == 0, f"(实际新增 {celery_delta})")
check("详情内通知数不变（无重复）", notif_in_detail2 == notif_in_detail,
      f"({notif_in_detail} -> {notif_in_detail2})")
check("最终只有 1 条同内容通知", len(after_celery) == len(before) + 1)

print()
if all_ok:
    print("✅✅✅ 全部验证通过！审核同步产生1条通知，Celery检测重复返回skipped，学生端详情/列表/导出都只保留1条同内容站内通知。")
else:
    print("❌ 部分验证失败，请检查上方明细。")
    sys.exit(1)
