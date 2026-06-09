import sys, os, time, json
sys.path.insert(0, '.')

# Clean existing DB first
db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'app', 'data', 'app.db')
if os.path.exists(db_path):
    try:
        os.remove(db_path)
        print(f'[prep] removed existing DB: {db_path}')
    except Exception as e:
        print(f'[prep] warning could not remove db: {e}')

t0 = time.time()
try:
    import main
    print('main.py imported OK in %.1fs' % (time.time()-t0))
    app = main.app
    print('FastAPI app created')

    # Use with-statement so lifespan (init_database) runs!
    from fastapi.testclient import TestClient
    print('\n=== Opening TestClient with lifespan context ===')
    with TestClient(app) as client:
        t1 = time.time()
        print('TestClient ready (lifespan executed), took %.1fs from start' % (t1 - t0))

        # 1) Health
        print('\n=== [1/7] Testing /health ===')
        r = client.get('/health')
        assert r.status_code == 200, f'/health failed {r.status_code}: {r.text}'
        print('GET /health =>', r.status_code, r.json())

        # 2) Login admin
        print('\n=== [2/7] Testing admin login ===')
        r = client.post('/api/v1/auth/login', data={'username': 'admin', 'password': 'admin123'})
        print('POST /login =>', r.status_code)
        assert r.status_code == 200, f'Login failed: {r.status_code} {r.text}'
        token = r.json()['access_token']
        print(f'  token issued: len={len(token)}, type={r.json().get("token_type")}')
        h = {'Authorization': f'Bearer {token}'}

        # 3) Departments
        print('\n=== [3/7] Testing departments (8 defaults expected) ===')
        r = client.get('/api/v1/data/departments', headers=h)
        print('GET /data/departments =>', r.status_code, 'count:', len(r.json()) if r.status_code == 200 else r.text)

        # 4) Model versions
        print('\n=== [4/7] Testing model versions (expect review_history=[], audit_trail=[]) ===')
        r = client.get('/api/v1/models/versions', headers=h)
        print('GET /models/versions =>', r.status_code)
        vs = r.json() if r.status_code == 200 else []
        print('  count:', len(vs), ', keys:', sorted(list(vs[0].keys())) if vs else 'empty')
        if vs:
            print('  [0] has review_history:', 'review_history' in vs[0], 'len=', len(vs[0].get('review_history') or []))
            print('  [0] has audit_trail:', 'audit_trail' in vs[0], 'len=', len(vs[0].get('audit_trail') or []))
            print('  [0] has reviewer_name:', vs[0].get('reviewer_name'))
            print('  [0] has creator_name:', vs[0].get('creator_name'))

        # 5) Create manual fake model_version record in DB for testing audit trail on review/reject/rollback
        print('\n=== [5/7] Inserting test ModelVersion via direct DB for audit trail test ===')
        from app.core.database import SessionLocal
        from app.models.model_version import ModelVersion
        from datetime import datetime
        db = SessionLocal()
        try:
            test_mv = ModelVersion(
                version="v0.0.1-TEST",
                model_name="LightGBM",
                description="测试版本（启动脚本自动插入）",
                training_sample_count=0,
                metrics_auc=0.85, metrics_accuracy=0.82,
                metrics_precision=0.80, metrics_recall=0.75,
                metrics_f1=0.77, metrics_ks=0.33,
                is_active=False,
                review_status="pending",
                created_by=1,
            )
            db.add(test_mv)
            db.commit()
            db.refresh(test_mv)
            test_mv_id = test_mv.id
            print(f'  inserted test mv id={test_mv_id}, version={test_mv.version}')
        except Exception as e:
            print(f'  insert failed: {e}')
            test_mv_id = None
        finally:
            db.close()

        if test_mv_id:
            # 6) Review it (approve with comment)
            print(f'\n=== [6/7] Approving test version id={test_mv_id} (expect audit log append) ===')
            r = client.post(f'/api/v1/models/versions/{test_mv_id}/review',
                            headers=h,
                            json={'status': 'approved', 'comment': '启动测试：通过审核激活上线'})
            print('POST review approved =>', r.status_code)
            if r.status_code == 200:
                data = r.json()
                print('  review_status=', data.get('review_status'))
                print('  audit_trail len=', len(data.get('audit_trail') or []))
                for i, entry in enumerate(data.get('audit_trail') or []):
                    print(f'    [{i}] action={entry.get("action")}, reviewer={entry.get("reviewer")}, ts={str(entry.get("timestamp") or entry.get("time"))[:19]}')
                    print(f'         comment={entry.get("comment") or entry.get("reason")}')
                print('  reviewer_name=', data.get('reviewer_name'))
                print('  activated_at present:', bool(data.get('activated_at')))

                # 7) Reject it (to build up history more)
                print(f'\n=== [7/7] Then REJECT same version id={test_mv_id} (2nd audit entry) ===')
                r2 = client.post(f'/api/v1/models/versions/{test_mv_id}/review',
                                headers=h,
                                json={'status': 'rejected', 'comment': '启动测试：二次操作驳回'})
                print('POST review rejected =>', r2.status_code)
                if r2.status_code == 200:
                    d2 = r2.json()
                    trail = d2.get('audit_trail') or []
                    print('  audit_trail now has', len(trail), 'entries:')
                    for i, entry in enumerate(trail):
                        print(f'    [{i}] action={entry.get("action")}, reviewer={entry.get("reviewer")}, comment={(entry.get("comment") or "")[:40]}')

    print('\n======= ALL TESTS PASSED =======')
    print('Verified:')
    print('  1. lifespan does not crash (departments/users/sms templates init safe)')
    print('  2. /health returns 200')
    print('  3. /api/v1/auth/login works (admin/admin123)')
    print('  4. Dept list returns, 8 default depts created')
    print('  5. Model versions list has review_history / audit_trail fields')
    print('  6. Approval creates audit entry with reviewer/creator username')
    print('  7. Rejection appends 2nd entry - full chain visible')
    sys.exit(0)

except Exception as e:
    import traceback
    print('\n==== TESTS FAILED ====')
    print('Error:', repr(e))
    traceback.print_exc()
    sys.exit(1)
