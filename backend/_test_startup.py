import sys, os, time
sys.path.insert(0, '.')
t0 = time.time()
try:
    import main
    print('main.py imported OK in %.1fs' % (time.time()-t0))
    app = main.app
    print('FastAPI app created, routes:')
    ok_paths = ['/health', '/api/v1/auth/login', '/docs', '/openapi.json',
                '/api/v1/data/appointments', '/api/v1/models/scores',
                '/api/v1/feedback', '/api/v1/dashboard']
    routes_found = []
    for route in app.routes:
        if hasattr(route, 'path') and route.path in ok_paths:
            methods = sorted([m for m in getattr(route, 'methods', set()) if m != 'HEAD'])
            routes_found.append((route.path, methods))
            print('  - %s %s' % (route.path, methods))
    print('\n%d key routes registered' % len(routes_found))

    # Test lifespan / health via TestClient if possible
    from fastapi.testclient import TestClient
    client = TestClient(app)
    print('\n=== Testing /health ===')
    try:
        r = client.get('/health')
        print('GET /health =>', r.status_code, r.json())
    except Exception as e:
        print('error:', e)

    print('\n=== Testing /api/v1/auth/login (POST wrong creds) ===')
    try:
        from fastapi.security.oauth2 import OAuth2PasswordRequestForm
        data = {'username': 'admin', 'password': 'admin123'}
        r = client.post('/api/v1/auth/login', data=data)
        print('POST /login =>', r.status_code)
        if r.status_code == 200:
            print('  token_type:', r.json().get('token_type'), ', has access_token:', bool(r.json().get('access_token')))
        else:
            print('  body:', r.text[:300])
    except Exception as e:
        print('error:', e)

    print('\n=== Testing protected /api/v1/models/scores with token ===')
    try:
        r = client.post('/api/v1/auth/login', data={'username': 'admin', 'password': 'admin123'})
        if r.status_code == 200 and r.json().get('access_token'):
            token = r.json()['access_token']
            h = {'Authorization': f'Bearer {token}'}
            r2 = client.get('/api/v1/models/scores', headers=h)
            print('GET /models/scores =>', r2.status_code, 'count:', len(r2.json()) if r2.status_code == 200 else r2.text[:200])
            r3 = client.get('/api/v1/data/appointments', headers=h)
            print('GET /data/appointments =>', r3.status_code, 'count:', len(r3.json()) if r3.status_code == 200 else r3.text[:200])
    except Exception as e:
        print('error:', e)

    print('\nAll startup tests completed.')

except Exception as e:
    import traceback
    print('IMPORT FAILED:', repr(e))
    traceback.print_exc()
    sys.exit(1)
