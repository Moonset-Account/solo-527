import sys, os, json, uuid
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.database import Base, get_db
from app.main import app

tmp_db = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                      "data", "_test_rq_batch.db")
if os.path.exists(tmp_db):
    os.remove(tmp_db)

engine = create_engine(f"sqlite:///{tmp_db}", echo=False)
Base.metadata.drop_all(engine)
Base.metadata.create_all(engine)
TestingSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    db = TestingSession()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db


# 先造一批 ticket（模拟 seed 后的状态）
from app.models.ticket import Ticket, Category, TicketStatus

db = TestingSession()
for i, (name, code) in enumerate([("支付问题", "PAY"), ("退款问题", "REF"), ("物流问题", "LOG")], 1):
    db.add(Category(id=i, name=name, code=code, description="x"))
for i in range(1, 21):
    db.add(Ticket(id=i, ticket_no=f"TK{i:05d}", title=f"模拟工单{i}", content=f"模拟内容{i}",
                  channel="app", status=TicketStatus.NEW.value))
db.commit()
db.close()

print("=" * 70)
print("TEST RQ-BATCH: 真实 POST /api/v1/inference/batch?use_queue=true 端到端")
print("=" * 70)

FAKE_RQ_JOB_ID = f"rq:job:{uuid.uuid4()}"
print(f"  [mock RQ] 将返回 job_id = {FAKE_RQ_JOB_ID}")

mock_queue = MagicMock()
fake_job = MagicMock()
fake_job.id = FAKE_RQ_JOB_ID
mock_queue.enqueue.return_value = fake_job


def fake_get_queue():
    print("  [mock RQ] get_inference_queue() 被调用 -> 返回 mock queue")
    return mock_queue


client = TestClient(app)

# 关键：patch `app.core.queue.get_inference_queue`（原始定义处）
# 因为路由函数内部 `from app.core.queue import get_inference_queue` 每次执行都会重新读取模块属性
with patch("app.core.queue.get_inference_queue", side_effect=fake_get_queue):
    payload = {"ticket_ids": list(range(1, 21)), "store_predictions": True}
    params = {"use_queue": "true", "created_by": "运营-小赵"}
    print(f"  POST /api/v1/inference/batch  ticket_count={len(payload['ticket_ids'])} use_queue=true")
    resp = client.post("/api/v1/inference/batch", params=params, json=payload)

print(f"  HTTP 状态码: {resp.status_code}")
assert resp.status_code == 202, f"期望 202 Accepted, 实际 {resp.status_code}"

body = resp.json()
print(f"  响应体字段: {list(body.keys())}")
print(json.dumps({k: v for k, v in body.items() if k != "results"},
                 ensure_ascii=False, indent=4))

assert body["total"] == 20, f"total 期望 20，实际 {body['total']}"
assert body["task_id"] is not None, "异步响应必须返回 task_id"
assert body["job_id"] is not None, "异步响应必须返回 RQ job_id"
assert body["status"] == "pending", f"status 必须是 pending，实际 {body['status']}"
assert body["job_id"] == FAKE_RQ_JOB_ID, "返回的 job_id 必须等于 RQ 入队时拿到的 job.id"

task_id = body["task_id"]
job_id = body["job_id"]
print(f"\n  ✅ 运营现在可以用以下标识追踪:")
print(f"     task_id = {task_id}   (本地批量任务表主键)")
print(f"     job_id  = {job_id}    (Redis Queue job id)")
print(f"     status  = pending     (等待 worker 取走)")

# 断言：enqueue 被正确调用，参数包含 task_id
assert mock_queue.enqueue.called, "queue.enqueue 必须被调用"
call_args = mock_queue.enqueue.call_args
called_task_id = call_args.kwargs.get("task_id") or call_args[1].get("task_id")
print(f"\n  [mock RQ] queue.enqueue 被调用:")
print(f"     func  = {call_args[0][0]!r}")
print(f"     kwargs task_id = {called_task_id}")
assert called_task_id == task_id, "入队时必须把 task_id 传给 worker 入口"

print()
print("=" * 70)
print("后续运营追踪链路模拟（1. GET list -> 2. GET detail -> 3. worker 完成后再查）")
print("=" * 70)

# 1) GET 列表
resp = client.get("/api/v1/inference/batch?page=1&page_size=10&status=pending")
assert resp.status_code == 200
d = resp.json()
print(f"\n  1) GET /api/v1/inference/batch?status=pending")
print(f"     total = {d['total']}")
for it in d["items"]:
    print(f"       #{it['id']}  status={it['status']}  job_id={it['job_id']}  "
          f"total_count={it['total_count']}  created_by={it.get('created_by')}")
assert d["total"] == 1
assert d["items"][0]["job_id"] == FAKE_RQ_JOB_ID
print("     ✅ 列表接口返回了可观察到 RQ job_id 的 pending 任务")

# 2) GET 详情
resp = client.get(f"/api/v1/inference/batch/{task_id}")
assert resp.status_code == 200
d = resp.json()
print(f"\n  2) GET /api/v1/inference/batch/{task_id} (任务详情)")
print(f"     id={d['id']}  status={d['status']}  job_id={d['job_id']}")
print(f"     ticket_ids 示例: {d['ticket_ids'][:5]}... (共 {len(d['ticket_ids'])} 条)")
print(f"     started_at={d.get('started_at')}  finished_at={d.get('finished_at')}")
assert d["job_id"] == FAKE_RQ_JOB_ID
assert d["status"] == "pending"
print("     ✅ 详情接口可观察到 RQ job_id + 工单明细 + 未开始执行标记")

# 3) 模拟 Worker 执行完毕 -> 运营刷新详情能看到结果
from app.services.batch_task_service import BatchTaskService
from app.models.ticket import TaskStatus
from datetime import datetime

sess = TestingSession()
BatchTaskService.update(
    sess, task_id,
    status=TaskStatus.COMPLETED.value,
    success_count=19,
    low_confidence_count=7,
    error_count=1,
    result_summary={"total": 20, "success": 19, "low_confidence_count": 7,
                    "by_channel": {"app": 10, "web": 6, "wechat": 3}},
    started_at=datetime.utcnow(),
    finished_at=datetime.utcnow(),
)
sess.close()

resp = client.get(f"/api/v1/inference/batch/{task_id}")
d = resp.json()
print(f"\n  3) Worker 执行完毕后再次 GET /api/v1/inference/batch/{task_id}")
print(f"     status={d['status']}  success={d['success_count']}  "
      f"low_conf={d['low_confidence_count']}  err={d['error_count']}")
print(f"     result_summary: {json.dumps(d['result_summary'], ensure_ascii=False)}")
print(f"     started_at={d.get('started_at')}")
print(f"     finished_at={d.get('finished_at')}")
assert d["status"] == "completed"
assert d["success_count"] == 19
assert d["low_confidence_count"] == 7
assert d["error_count"] == 1
print("     ✅ Worker 回写状态后，运营刷新即可看到进度统计与结果摘要")


print()
print("=" * 70)
print("FAIL 场景模拟: Worker 异常中断 -> 失败原因可观察")
print("=" * 70)

# 再造一个失败任务（用另一个 mock job_id）
FAIL_JOB_ID = "rq:job:failed-deadbeef123456"
mock_queue2 = MagicMock()
fake_job2 = MagicMock(); fake_job2.id = FAIL_JOB_ID
mock_queue2.enqueue.return_value = fake_job2
def fake_get_queue2(): return mock_queue2

with patch("app.core.queue.get_inference_queue", side_effect=fake_get_queue2):
    resp = client.post("/api/v1/inference/batch",
                       params={"use_queue": "true"},
                       json={"ticket_ids": [5, 6, 7], "store_predictions": False})
assert resp.status_code == 202
body2 = resp.json()
fail_task_id = body2["task_id"]
assert body2["job_id"] == FAIL_JOB_ID
print(f"  新任务提交: task_id={fail_task_id}  job_id={FAIL_JOB_ID}  status={body2['status']}")

# 模拟 Worker 抛异常 -> 回写错误
sess = TestingSession()
BatchTaskService.update(
    sess, fail_task_id,
    status=TaskStatus.FAILED.value,
    error_count=3,
    error_message="RuntimeError: Torch CUDA out of memory. Tried to allocate 2.00 GiB",
    started_at=datetime.utcnow(),
    finished_at=datetime.utcnow(),
)
sess.close()

resp = client.get(f"/api/v1/inference/batch?status=failed")
d = resp.json()
print(f"  GET /api/v1/inference/batch?status=failed  -> total={d['total']}")
for it in d["items"]:
    print(f"    #{it['id']}  job_id={it['job_id']}")
    print(f"       error_message: {it.get('error_message')}")
assert d["total"] == 1
assert d["items"][0]["error_message"].startswith("RuntimeError")
print("  ✅ 失败任务的错误堆栈可以通过接口观察到")


print()
print("=" * 70)
print("ALL RQ ASYNC BATCH INFERENCE TESTS PASSED ✅")
print("=" * 70)

os.remove(tmp_db)
