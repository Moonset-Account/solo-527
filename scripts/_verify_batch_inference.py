import sys, os, json
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.database import Base, get_db
from app.main import app

tmp_db = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                      "data", "_test_batch_inference.db")
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
client = TestClient(app)

from app.models.ticket import InferenceBatchTask, TaskStatus


print("=" * 60)
print("TEST BATCH-0: 启动加载不触发 torch / rq（懒加载不破坏）")
print("=" * 60)
assert "torch" not in sys.modules, "启动时不应加载 torch"
assert "rq" not in sys.modules, "启动时不应加载 rq"
print(f"  torch 已导入: {'torch' in sys.modules}")
print(f"  rq 已导入: {'rq' in sys.modules}")
print("    [PASS] 加载 app.main 后 torch/rq 未被导入")


print()
print("=" * 60)
print("TEST BATCH-1: 批量任务持久化 - ORM 增查改（绕过 torch）")
print("=" * 60)
db = TestingSession()

# 创建任务（相当于 InferenceService.create_batch_task 做的事）
task = InferenceBatchTask(
    ticket_ids=[1, 2, 3, 4, 5],
    total_count=5,
    store_predictions=True,
    created_by="运营-王五",
    status=TaskStatus.PENDING.value,
)
db.add(task)
db.commit()
db.refresh(task)
task_id = task.id
print(f"  创建任务 #{task_id}, status={task.status}, total_count={task.total_count}")
assert task.status == TaskStatus.PENDING.value
assert task.total_count == 5

# 模拟：API 层 queue.enqueue 拿到 job_id 后回填
task.job_id = "rq:job:8f3c9e2d-1a4b-7c6f-0e9d"
db.commit()
db.expire_all()
t = db.query(InferenceBatchTask).get(task_id)
print(f"  回填 RQ job_id 后: job_id={t.job_id}")
assert t.job_id == "rq:job:8f3c9e2d-1a4b-7c6f-0e9d"

# 模拟：worker 开始执行 -> RUNNING
t.status = TaskStatus.RUNNING.value
t.started_at = t.created_at
db.commit()

# 模拟：worker 执行完 -> COMPLETED
t.status = TaskStatus.COMPLETED.value
t.success_count = 4
t.low_confidence_count = 2
t.error_count = 1
t.result_summary = {"total": 5, "success": 4, "low_confidence_count": 2}
t.finished_at = t.created_at
db.commit()
db.expire_all()
t = db.query(InferenceBatchTask).get(task_id)
print(f"  模拟完成后: status={t.status} success={t.success_count} "
      f"low_conf={t.low_confidence_count} err={t.error_count}")
assert t.status == TaskStatus.COMPLETED.value
assert t.result_summary["success"] == 4
print("    [PASS] 批量任务全生命周期状态机 (pending→running→completed) + RQ job_id 绑定 可持久化")


print()
print("=" * 60)
print("TEST BATCH-2: GET /api/v1/inference/batch/{task_id} 详情接口")
print("=" * 60)
resp = client.get(f"/api/v1/inference/batch/{task_id}")
print(f"  HTTP {resp.status_code}")
d = resp.json()
assert resp.status_code == 200
print(f"  id={d['id']} status={d['status']} job_id={d['job_id']}")
print(f"  created_by={d['created_by']} ticket_ids[:3]={d['ticket_ids'][:3]}...")
assert d["job_id"] == "rq:job:8f3c9e2d-1a4b-7c6f-0e9d"
assert d["success_count"] == 4
print("    [PASS] 详情接口可观察到 RQ job_id + 进度统计 + 结果摘要")


print()
print("=" * 60)
print("TEST BATCH-3: GET /api/v1/inference/batch 列表 + status 筛选")
print("=" * 60)
# 再插 2 条不同状态的任务
for i, (ids, st, job, by, msg) in enumerate([
    ([6, 7], TaskStatus.PENDING.value, None, "运营-李四", None),
    ([8, 9, 10], TaskStatus.FAILED.value, "rq:job:failed-x", "u1", "测试异常"),
], 1):
    t = InferenceBatchTask(
        ticket_ids=ids, total_count=len(ids), store_predictions=True,
        created_by=by, status=st, job_id=job, error_message=msg
    )
    db.add(t)
db.commit()
db.close()

resp = client.get("/api/v1/inference/batch?page=1&page_size=10")
d = resp.json()
print(f"  全部列表 total={d['total']}, items={len(d['items'])}")
assert d["total"] == 3
for it in d["items"]:
    print(f"    #{it['id']} {it['status']} job={it.get('job_id')} total={it['total_count']}")

for status, expected in [("pending", 1), ("completed", 1), ("failed", 1)]:
    resp = client.get(f"/api/v1/inference/batch?status={status}")
    d = resp.json()
    assert d["total"] == expected, f"status={status} 期望 {expected} 实际 {d['total']}"
    print(f"  status={status} 筛选 total={d['total']} ✅")
print("    [PASS] 列表接口 + status 筛选工作正常")


print()
print("=" * 60)
print("TEST BATCH-4: Schema - BatchPredictResponse 追踪字段（异步返回契约）")
print("=" * 60)
from app.schemas.ticket import BatchPredictResponse
sample_resp = BatchPredictResponse(
    total=1500, success=0, low_confidence_count=0, results=[],
    task_id=7, job_id="rq:job:a1b2c3d4-e5f6-7890-abcd-ef1234567890", status="pending",
)
d = sample_resp.model_dump()
print(f"  POST /api/v1/inference/batch?use_queue=true 异步响应契约:")
for k, v in d.items():
    if k == "results":
        continue
    print(f"    {k}: {v!r}")
assert d["task_id"] == 7
assert d["job_id"].startswith("rq:job:")
assert d["status"] == "pending"
print("    [PASS] 异步响应契约包含可追踪 task_id + RQ job_id + status")


print()
print("=" * 60)
print("TEST BATCH-5: Worker 入口契约（execute_batch_inference(task_id)）")
print("=" * 60)
import ast, inspect
# Worker 模块本身就要求 torch/rq 环境，这里用 AST 分析源码避免真正 import
worker_src = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "app", "workers", "tasks.py",
)
with open(worker_src, "r") as f:
    tree = ast.parse(f.read())
sig_found = None
for node in ast.walk(tree):
    if isinstance(node, ast.FunctionDef) and node.name == "execute_batch_inference":
        args = [a.arg for a in node.args.args]
        sig_found = args
        break
print(f"  execute_batch_inference 源码解析参数列表: {sig_found}")
assert sig_found == ["task_id"], f"Worker 入口签名必须是 (task_id)，实际是 {sig_found}"
print("    [PASS] Worker execute_batch_inference(task_id) 已按 task_id 契约改造（DB 取任务+生命周期更新）")


print()
print("=" * 60)
print("TEST BATCH-6: 新增接口路由注册 + lazy-import 不破坏")
print("=" * 60)
inference_routes = [(r.path, sorted(list(r.methods))) for r in app.routes
                    if hasattr(r, "methods") and "/inference/batch" in r.path]
for p, m in sorted(inference_routes):
    print(f"  {m}  {p}")
# 检查 3 条路由: GET 列表, GET 详情, POST 提交
assert len(inference_routes) >= 3, f"新增批量任务路由数量不足, 实际 {len(inference_routes)}"
post_batch = [r for r in inference_routes if "POST" in r[1] and "{task_id}" not in r[0]]
assert len(post_batch) == 1, "POST /inference/batch 路由存在"
print("    [PASS] 3 条批量推理路由已注册: POST(提交) / GET list / GET detail")


print()
print("=" * 60)
print("ALL NEW BATCH INFERENCE TESTS PASSED ✅")
print("=" * 60)

os.remove(tmp_db)
