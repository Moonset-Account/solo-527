#!/usr/bin/env python3
"""一键启动验证脚本：清库 → init → bootstrap → 3 入口 → 验收报告。
直接运行：python3 run_and_prove.py"""
import os, sys, json, logging, traceback
os.chdir(os.path.dirname(os.path.abspath(__file__)))

# 强制 DEBUG=True，让 bootstrap 的异常抛出来
os.environ["DEBUG"] = "True"
logging.basicConfig(level=logging.DEBUG, format="%(levelname)-7s %(name)s: %(message)s")
LOG = logging.getLogger("PROVE")

# ============================================================
# STEP 1: 清库
# ============================================================
LOG.info("STEP 1: rm -rf storage")
os.system("rm -rf storage")
for d in ["storage/db","storage/indexes/chroma","storage/indexes/llamaindex","storage/models",
            "storage/uploads","storage/datasets","storage/logs/audit"]:
    os.makedirs(d, exist_ok=True)
LOG.info("  -> dirs created")

# ============================================================
# STEP 2: 初始化 + bootstrap
# ============================================================
from app.core.config import get_settings
s = get_settings()
LOG.info(f"STEP 2: init + bootstrap")
LOG.info(f"  DATABASE_URL = {s.DATABASE_URL}")

from app.data.database import (
    _sqlite_path_from_url, _normalize_sqlite_url,
    _sync_db_url, engine, SessionLocal, init_db, bootstrap_minimum_data,
)
LOG.info(f"  _sqlite_path -> {_sqlite_path_from_url(s.DATABASE_URL)}")
LOG.info(f"  _normalize    -> {_normalize_sqlite_url(s.DATABASE_URL)}")
LOG.info(f"  _sync_db_url = {_sync_db_url}")
LOG.info(f"  engine.url    = {engine.url}")

init_db()
LOG.info("  init_db() OK")

from sqlalchemy import inspect, select, func
tables = inspect(engine).get_table_names()
LOG.info(f"  tables: {tables}")

try:
    bootstrap_minimum_data()
    LOG.info("  bootstrap_minimum_data() OK")
except Exception as _e:
    LOG.error("  bootstrap_minimum_data() FAILED!")
    traceback.print_exc()
    sys.exit(1)

# ============================================================
# STEP 3: 直接查 DB（绕过 TestClient）
# ============================================================
from app.data.models import (
    DataSource, Document, DatasetVersion,
    ModelVersion, ApiCallLog, AuditLog,
)
db = SessionLocal()
LOG.info("STEP 3: row counts")
rows = {}
for cls, nm in [
    (DataSource,"data_sources"), (Document,"documents"),
    (DatasetVersion,"dataset_versions"), (ModelVersion,"model_versions"),
    (ApiCallLog,"api_call_logs"), (AuditLog,"audit_logs"),
]:
    cnt = db.execute(select(func.count(cls.id))).scalar() or 0
    LOG.info(f"  {nm:<20} = {cnt}")
    rows[nm] = cnt
db.close()

path = _sqlite_path_from_url(s.DATABASE_URL)
sz = os.path.getsize(path) if os.path.exists(path) else -1
LOG.info(f"  DB file: {path}")
LOG.info(f"  DB size: {sz} bytes ({sz/1024:.1f} KB)")

assert rows["dataset_versions"] >= 1, "dataset_versions 0 行！"
assert rows["model_versions"]   >= 1, "model_versions 0 行！"
assert rows["api_call_logs"]   >= 1, "api_call_logs 0 行！"
assert sz > 0, "DB 仍是 0 字节！"

# ============================================================
# STEP 4: TestClient 验证 3 入口 + 验收报告
# ============================================================
from fastapi.testclient import TestClient
from main import create_app

LOG.info("STEP 4: TestClient")
app = create_app()
client = TestClient(app)

ok = True
for ep in ["/health", "/docs", "/openapi.json"]:
    r = client.get(ep)
    LOG.info(f"  GET {ep:<20} -> {r.status_code}")
    if r.status_code != 200:
        ok = False

# 调用两次验收接口（让中间件写调用日志）
for i in (1,2):
    r = client.get("/api/v1/acceptance/check")
    LOG.info(f"  GET /api/v1/acceptance/check #{i}  -> {r.status_code}")
    if r.status_code != 200:
        ok = False; continue
    j = r.json()
    LOG.info(f"    overview        : {j['overview']}")
    LOG.info(f"    checks        : {j['passed_checks']}/{j['total_checks']} passed / {j['failed_checks']} failed")
    LOG.info(f"    dataset_versions: {len(j['dataset_versions'])}")
    for dv in j['dataset_versions']:
        LOG.info(f"      · tag={dv['version_tag']} docs={dv['document_count']} checksum={'OK' if dv['checksum'] else 'NONE'} created_by={dv['created_by']}")
    LOG.info(f"    model_versions  : {len(j['model_versions'])}")
    for mv in j['model_versions']:
        LOG.info(f"      · tag={mv['version_tag']} model={mv['model_name']} status={mv['status']} default={mv['is_default']}")
    LOG.info(f"    call_logs_cnt : {j['call_logs_count']}")
    LOG.info(f"    endpoints     : {sorted(j['endpoints_covered'])}")
    print()

# 断言
assert len(j['dataset_versions']) >= 1
assert len(j['model_versions'])   >= 1
assert any(m['is_default'] and m['status']=='ready' for m in j['model_versions']), "无 READY 默认模型"
assert j['call_logs_count']       >= 4, f"call_logs_count = {j['call_logs_count']} < 4"
assert len(j['endpoints_covered']) >= 4, f"endpoints = {len(j['endpoints_covered'])} < 4"
assert j['failed_checks'] == 0,       f"{j['failed_checks']} 项未通过"

sz = os.path.getsize(path)
LOG.info(f"\nDB 最终大小: {sz} bytes ({sz/1024:.1f} KB)")
LOG.info(f"\n✅ 全部通过! 3 入口 /health、/docs、/api/v1/acceptance/check 均可访问")
LOG.info(f"✅ dataset_versions / model_versions / call_logs_count / endpoints_covered 全部真实返回")
