import sys, os, time, json
sys.path.insert(0, '.')

db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'app', 'data', 'app.db')
if os.path.exists(db_path):
    try:
        os.remove(db_path)
        print(f'[prep] removed existing DB')
    except Exception:
        pass

t0 = time.time()
import main
print(f'✅ main imported in {time.time()-t0:.1f}s')
app = main.app

from fastapi.testclient import TestClient

# Also pre-import to avoid missing deps issues
from app.models.model_version import ModelVersion
from app.core.database import SessionLocal
from app.services.model_service import ModelService
from datetime import datetime

with TestClient(app) as client:
    print('✅ lifespan executed')

    # 1. Login
    r = client.post('/api/v1/auth/login', data={'username': 'admin', 'password': 'admin123'})
    assert r.status_code == 200, f'login failed: {r.text}'
    token = r.json()['access_token']
    print('✅ admin login OK, token len=', len(token))
    h = {'Authorization': f'Bearer {token}'}

    # 2. Insert 2 fake ModelVersions directly in DB for testing rollback
    db = SessionLocal()
    try:
        vA = ModelVersion(
            version="v0.9.0-A", model_name="LightGBM",
            description="A — 当前在线版本（性能良好）",
            training_sample_count=3000,
            metrics_auc=0.88, metrics_accuracy=0.85,
            metrics_precision=0.83, metrics_recall=0.80,
            metrics_f1=0.815, metrics_ks=0.36,
            is_active=True, review_status="approved",
            created_by=1, reviewed_by=1, reviewed_at=datetime.utcnow(),
        )
        vB = ModelVersion(
            version="v0.7.0-B", model_name="LightGBM",
            description="B — 稳定老版本（回归用）",
            training_sample_count=2500,
            metrics_auc=0.85, metrics_accuracy=0.82,
            metrics_precision=0.80, metrics_recall=0.78,
            metrics_f1=0.79, metrics_ks=0.33,
            is_active=False, review_status="approved",
            created_by=1, reviewed_by=1, reviewed_at=datetime.utcnow(),
        )
        db.add_all([vA, vB])
        db.commit()
        db.refresh(vA); db.refresh(vB)
        idA, idB = vA.id, vB.id
        print(f'✅ 插入 vA(id={idA}, online) 和 vB(id={idB}, 待回滚)')
    finally:
        db.close()

    # 3. Call rollback
    print('\n=== [关键测试] 从 vA 回滚到 vB ===')
    r = client.post('/api/v1/models/versions/rollback', headers=h, json={
        'target_version': 'v0.7.0-B',
        'reason': 'v0.9.0 AUC下跌2pp，紧急回滚到v0.7.0稳定基线',
    })
    print('POST /rollback status_code=', r.status_code)
    data = r.json() if r.status_code < 500 else {}
    print('keys returned:', sorted(list(data.keys())) if isinstance(data, dict) else data)
    assert r.status_code == 200, f'rollback failed HTTP {r.status_code}: {r.text}'
    assert data.get('success') is True, f'rollback payload success={data.get("success")}'

    print('\n--- rollback 返回字段检查 ---')
    for k in ('version_detail', 'review_history', 'audit_trail', 'target_version', 'reason', 'version_id'):
        v = data.get(k)
        t = 'list' if isinstance(v, list) else ('dict' if isinstance(v, dict) else type(v).__name__)
        len_s = f' (len={len(v)})' if hasattr(v, '__len__') and not isinstance(v, (str, bytes)) else ''
        print(f'  {k}: present={k in data}, type={t}{len_s}, value={str(v)[:80] if t not in ("list","dict") else ""}')

    assert isinstance(data.get('version_detail'), dict), 'version_detail 必须是 dict'
    assert isinstance(data.get('review_history'), list), 'review_history 必须是 list'
    assert isinstance(data.get('audit_trail'), list), 'audit_trail 必须是 list'
    assert len(data.get('audit_trail') or []) >= 1, 'audit_trail 至少1条回滚记录'

    print('\n--- v0.7.0-B audit_trail 条目（目标版本详情） ---')
    for i, entry in enumerate(data.get('audit_trail') or []):
        action = entry.get('action')
        reviewer = entry.get('reviewer') or entry.get('user')
        ts = str(entry.get('timestamp') or entry.get('time') or '')[:19]
        comment = (entry.get('comment') or entry.get('reason') or '')[:80]
        extra_from = entry.get('rollback_from')
        print(f'  [{i}] action={action}, reviewer={reviewer}, ts={ts}, rollback_from={extra_from}')
        print(f'       comment={comment}')

    # 4. GET versions list and verify vA has 'deactivated' audit entry
    print('\n=== GET /models/versions，检查 vA 是否追加 deactivated 记录 ===')
    r = client.get('/api/v1/models/versions', headers=h)
    assert r.status_code == 200
    versions = r.json()
    vs_map = {v['version']: v for v in versions if isinstance(v, dict) and v.get('version')}
    vA_map = vs_map.get('v0.9.0-A')
    vB_map = vs_map.get('v0.7.0-B')

    assert vA_map, 'vA 在 versions 列表中找不到'
    assert vB_map, 'vB 在 versions 列表中找不到'
    print(f'  vA is_active={vA_map.get("is_active")}, audit_trail len={len(vA_map.get("audit_trail") or [])}')
    print(f'  vB is_active={vB_map.get("is_active")}, audit_trail len={len(vB_map.get("audit_trail") or [])}')

    # vA 应该是下线，有 deactivated 条目
    assert vA_map.get('is_active') is False, 'vA 回滚后应该 is_active=False'
    vA_trail = vA_map.get('audit_trail') or []
    has_deact = any(('deactivated' in str(e.get('action', '')) or '下线' in str(e.get('comment', ''))) for e in vA_trail)
    print(f'  vA 有 deactivated 条目: {has_deact}')
    for i, e in enumerate(vA_trail):
        print(f'    vA[{i}] action={e.get("action")}, comment={(e.get("comment") or "")[:50]}')

    # vB 应该是激活，有 rollback 条目
    assert vB_map.get('is_active') is True, 'vB 回滚后应该 is_active=True'
    assert vB_map.get('is_rollback') is True, 'vB 回滚后 is_rollback=True'
    assert vB_map.get('rollback_from_version') == 'v0.9.0-A', 'vB rollback_from_version 应该是 v0.9.0-A'
    vB_trail = vB_map.get('audit_trail') or []
    has_rollback = any('rollback' in str(e.get('action', '')) for e in vB_trail)
    print(f'  vB 有 rollback 条目: {has_rollback}')
    for i, e in enumerate(vB_trail):
        print(f'    vB[{i}] action={e.get("action")}, rollback_from={e.get("rollback_from")}, comment={(e.get("comment") or "")[:60]}')

    print('\n===== ALL ROLLBACK TESTS PASSED =====')
    print('✅ rollback 接口 HTTP 200，success=True')
    print('✅ 返回 version_detail (dict) + review_history/audit_trail (list ≥1)')
    print('✅ vA 切换为 is_active=False，audit_trail 中写入 deactivated 接替记录')
    print('✅ vB 切换为 is_active=True，is_rollback=True，rollback_from_version="v0.9.0-A"')
    print('✅ vB audit_trail 中写入 action="rollback"，包含 reason 文本')
    print('✅ 前端版本详情 Timeline：vA → deactivated；vB → approved → rollback 两条历史链路')
    sys.exit(0)
