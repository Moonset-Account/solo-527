from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

routes = []
for route in app.routes:
    if hasattr(route, 'path') and hasattr(route, 'methods'):
        for method in route.methods:
            routes.append((method, route.path))

price_routes = [(m, p) for m, p in routes if '/price' in p.lower()]
delivery_routes = [(m, p) for m, p in routes if '/deliver' in p.lower()]

print('[PRICE ROUTES]')
for m, p in sorted(price_routes):
    print(f'  {m:6s} {p}')

print()
print('[DELIVERY ROUTES]')
for m, p in sorted(delivery_routes):
    print(f'  {m:6s} {p}')

print()
print('Route verification:')

expected = [
    '/api/prices/trend',
    '/api/prices/stats',
    '/api/prices/materials',
    '/api/prices/records',
    '/api/prices/expiring',
    '/api/prices/export',
    '/api/deliveries',
    '/api/deliveries/stats/summary',
    '/api/deliveries/stats/diff-types',
    '/api/deliveries/stats/monthly',
    '/api/deliveries/export',
]

all_paths = [p for _, p in routes]
for exp in expected:
    found = exp in all_paths
    print(f'  {"OK" if found else "MISSING"} {exp}')
