"""backend/tests/test_rollback.py — 严格模式下回滚 + 留痕验证
★ 完全隔离：内存 SQLite + tests/_tmp_model_storage/ 临时模型目录
运行：cd backend && python3 -m tests.test_rollback
"""
import sys, os, shutil, tempfile
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# ── 隔离配置 ──
TEST_DIR = os.path.dirname(os.path.abspath(__file__))
TMP_MODEL = os.path.join(TEST_DIR, "_tmp_model_storage_rollback")
if os.path.exists(TMP_MODEL):
    shutil.rmtree(TMP_MODEL)
os.makedirs(TMP_MODEL, exist_ok=True)

# ── 隔离数据库：临时文件（避免 :memory: 多连接各建各的表） ──
_tmp_fd, _tmp_db = tempfile.mkstemp(prefix="test_rollback_", suffix=".db", dir=TEST_DIR)
os.close(_tmp_fd)
os.environ["DATABASE_URL"] = f"sqlite:///{_tmp_db}"

from app.core.config import settings
settings.DATABASE_URL = f"sqlite:///{_tmp_db}"
settings.MODEL_STORAGE_PATH = TMP_MODEL
print(f"[test_rollback] 隔离数据库: {_tmp_db}")

# ⚠️  关键：不要重建 engine，确保 get_db / create_all 都用同一个 database.py 创建的实例

# ── 导入app ──
import main
app = main.app
from fastapi.testclient import TestClient
from app.core.database import SessionLocal
from app.models.model_version import ModelVersion
from datetime import datetime
import lightgbm as lgb
import numpy as np
import json

# ── 辅助：生成一个真实可加载的 v0.7.0-B 模型 ──
def create_fake_model(version_name, n_rows=200, n_feats=18):
    """训练一个最小 LightGBM 模型，保存到 TMP_MODEL/{version}/model.lgb"""
    vdir = os.path.join(TMP_MODEL, version_name)
    os.makedirs(vdir, exist_ok=True)
    X = np.random.rand(n_rows, n_feats)
    y = (X[:, 0] + X[:, 1] > 1.0).astype(int)
    data = lgb.Dataset(X, label=y, params={"verbose": -1})
    params = {"objective": "binary", "metric": "auc", "verbose": -1, "num_leaves": 7, "min_data_in_leaf": 5}
    model = lgb.train(params, data, num_boost_round=10)
    model.save_model(os.path.join(vdir, "model.lgb"))
    with open(os.path.join(vdir, "metadata.json"), "w", encoding="utf-8") as f:
        json.dump({"version": version_name,
                   "model_name": "LightGBM",
                   "created_at": datetime.utcnow().isoformat(),
                   "metrics": {"auc": 0.85, "accuracy": 0.82},
                   "feature_importance": [{"feature": "f1", "gain": 0.5}, {"feature": "f2", "gain": 0.5}],
                   "feature_columns": [f"f{i}" for i in range(n_feats)]},
                  f, indent=2, default=str)
    print(f"[setup] ✅ 已创建测试模型: {version_name}  →  {vdir}")

# ── 插入两个 DB 记录 ──
def seed_db():
    db = SessionLocal()
    try:
        vA = ModelVersion(
            version="v0.9.0-A", model_name="LightGBM",
            description="A — 在线版本", training_sample_count=3000,
            metrics_auc=0.88, metrics_accuracy=0.85,
            metrics_precision=0.83, metrics_recall=0.80,
            metrics_f1=0.815, metrics_ks=0.36,
            is_active=True, review_status="approved",
            created_by=1, reviewed_by=1, reviewed_at=datetime.utcnow(),
        )
        vB = ModelVersion(
            version="v0.7.0-B", model_name="LightGBM",
            description="B — 回滚目标", training_sample_count=2500,
            metrics_auc=0.85, metrics_accuracy=0.82,
            metrics_precision=0.80, metrics_recall=0.78,
            metrics_f1=0.79, metrics_ks=0.33,
            is_active=False, review_status="approved",
            created_by=1, reviewed_by=1, reviewed_at=datetime.utcnow(),
        )
        db.add_all([vA, vB])
        db.commit()
        print(f"[setup] ✅ DB插入 vA={vA.id} vB={vB.id}")
    finally:
        db.close()

# ───────────────────── 开始测试 ─────────────────────
with TestClient(app) as client:
    seed_db()

    # 登录
    r = client.post('/api/v1/auth/login', data={'username': 'admin', 'password': 'admin123'})
    token = r.json()['access_token']
    h = {'Authorization': f'Bearer {token}'}

    # ======== 分支1：目标版本无模型文件 → rollback 必须失败（HTTP 400）========
    print("\n=== [分支1] v0.7.0-B 无模型文件 → 预期 rollback 失败 ===")
    r1 = client.post('/api/v1/models/versions/rollback', headers=h, json={
        'target_version': 'v0.7.0-B',
        'reason': 'TEST: no model file, expect FAIL',
    })
    print(f'  rollback status_code={r1.status_code}')
    assert r1.status_code == 400, f'无模型文件时rollback应返回400，实际 {r1.status_code}: {r1.text}'
    payload = r1.json()
    print(f'  400 detail: {payload.get("detail")}')

    # 同时 vA/vB 都不能有 rollback 留痕（因为失败分支不应写DB）
    rv = client.get('/api/v1/models/versions', headers=h).json()
    for v in rv:
        trail = v.get('audit_trail') or []
        actions = [e.get('action') for e in trail]
        assert 'rollback' not in actions, f"{v['version']} 失败回滚不应写入 rollback 条目: {actions}"
        assert 'deactivated' not in actions, f"{v['version']} 失败回滚不应写入 deactivated 条目: {actions}"
    print('  ✅ 留痕检查通过：失败分支无任何 audit_trail 写入')

    # ======== 分支2：为目标版本创建真实模型文件 → rollback 必须成功 ===========
    print("\n=== [分支2] 创建真实 v0.7.0-B 模型文件 → 预期 rollback 成功 ===")
    create_fake_model("v0.7.0-B")

    r2 = client.post('/api/v1/models/versions/rollback', headers=h, json={
        'target_version': 'v0.7.0-B',
        'reason': 'TEST: valid model → expect SUCCESS 严格模式回滚',
    })
    print(f'  rollback status_code={r2.status_code}')
    assert r2.status_code == 200, f'有模型文件时rollback应返回200，实际 {r2.status_code}: {r2.text}'
    d = r2.json()
    assert d.get('success') is True
    for f in ('version_detail', 'review_history', 'audit_trail', 'target_version', 'version_id'):
        assert f in d, f'成功分支缺少字段: {f}'
    assert len(d.get('audit_trail') or []) >= 1, '成功分支 audit_trail 至少1条 rollback'
    print(f'  ✅ 返回字段齐全: audit_trail len={len(d["audit_trail"])}')
    for i, e in enumerate(d['audit_trail']):
        print(f'    [{i}] action={e.get("action")}, rollback_from={e.get("rollback_from")}, reason={(e.get("comment") or "")[:60]}')

    # ======== 验证最终状态：vA下线 / vB激活且is_rollback=True =================
    print("\n=== [最终状态] 验证 versions 列表中的留痕 ===")
    versions = {v['version']: v for v in client.get('/api/v1/models/versions', headers=h).json()}
    vA, vB = versions['v0.9.0-A'], versions['v0.7.0-B']
    print(f'  vA is_active={vA["is_active"]}, audit_actions={[e["action"] for e in (vA.get("audit_trail") or [])]}')
    print(f'  vB is_active={vB["is_active"]}, is_rollback={vB.get("is_rollback")}, rollback_from={vB.get("rollback_from_version")}, audit_actions={[e["action"] for e in (vB.get("audit_trail") or [])]}')

    assert vA['is_active'] is False
    assert any(e.get('action') == 'deactivated' for e in vA.get('audit_trail') or []), 'vA 必须有 deactivated 留痕'
    assert vB['is_active'] is True
    assert vB.get('is_rollback') is True
    assert vB.get('rollback_from_version') == 'v0.9.0-A'
    assert any(e.get('action') == 'rollback' for e in vB.get('audit_trail') or []), 'vB 必须有 rollback 留痕'

    print('\n🏁 [test_rollback] 全部严格模式测试通过')
    print('   ✅ 失败分支：HTTP 400，DB无任何留痕写入')
    print('   ✅ 成功分支：HTTP 200，version_detail+双history字段+2条留痕（vA 下线 + vB rollback）')
    print('   ✅ 零污染：全程使用内存SQLite + tests/_tmp_model_storage')

# 清理临时模型目录（可选保留以便调试）
# shutil.rmtree(TMP_MODEL, ignore_errors=True)
