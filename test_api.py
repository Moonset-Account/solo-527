from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

print("=" * 60)
print("Testing API Endpoints")
print("=" * 60)

# Test health endpoint
response = client.get('/health')
print(f"\n[HEALTH] GET /health: {response.status_code}")
print(f"  Response: {response.json()}")

# Test admin endpoints
print("\n[ADMIN] Testing admin endpoints...")
try:
    response = client.get('/api/admin/invoice-status')
    print(f"  GET /api/admin/invoice-status: {response.status_code}")
except Exception as e:
    print(f"  GET /api/admin/invoice-status error: {e}")

try:
    response = client.get('/api/admin/spec-attachments')
    print(f"  GET /api/admin/spec-attachments: {response.status_code}")
except Exception as e:
    print(f"  GET /api/admin/spec-attachments error: {e}")

# Test price endpoints
print("\n[PRICE] Testing price endpoints...")
try:
    response = client.get('/api/price/materials')
    print(f"  GET /api/price/materials: {response.status_code}")
except Exception as e:
    print(f"  GET /api/price/materials error: {e}")

try:
    response = client.get('/api/price/trend')
    print(f"  GET /api/price/trend: {response.status_code}")
except Exception as e:
    print(f"  GET /api/price/trend error: {e}")

# Test delivery endpoints
print("\n[DELIVERY] Testing delivery endpoints...")
try:
    response = client.get('/api/deliveries/stats')
    print(f"  GET /api/deliveries/stats: {response.status_code}")
except Exception as e:
    print(f"  GET /api/deliveries/stats error: {e}")

try:
    response = client.get('/api/deliveries/stats/diff-types')
    print(f"  GET /api/deliveries/stats/diff-types: {response.status_code}")
except Exception as e:
    print(f"  GET /api/deliveries/stats/diff-types error: {e}")

try:
    response = client.get('/api/deliveries/stats/monthly')
    print(f"  GET /api/deliveries/stats/monthly: {response.status_code}")
except Exception as e:
    print(f"  GET /api/deliveries/stats/monthly error: {e}")

# Test notification endpoints
print("\n[NOTIFICATION] Testing notification endpoints...")
try:
    response = client.get('/api/notification/unread-count')
    print(f"  GET /api/notification/unread-count: {response.status_code}")
except Exception as e:
    print(f"  GET /api/notification/unread-count error: {e}")

# Test approval endpoints
print("\n[APPROVAL] Testing approval endpoints...")
try:
    response = client.get('/api/approval/levels')
    print(f"  GET /api/approval/levels: {response.status_code}")
except Exception as e:
    print(f"  GET /api/approval/levels error: {e}")

# Test page endpoints
print("\n[PAGES] Testing page endpoints...")
try:
    response = client.get('/login')
    print(f"  GET /login: {response.status_code}")
except Exception as e:
    print(f"  GET /login error: {e}")

try:
    response = client.get('/price/dashboard')
    print(f"  GET /price/dashboard: {response.status_code}")
except Exception as e:
    print(f"  GET /price/dashboard error: {e}")

try:
    response = client.get('/delivery/dashboard')
    print(f"  GET /delivery/dashboard: {response.status_code}")
except Exception as e:
    print(f"  GET /delivery/dashboard error: {e}")

try:
    response = client.get('/notifications')
    print(f"  GET /notifications: {response.status_code}")
except Exception as e:
    print(f"  GET /notifications error: {e}")

try:
    response = client.get('/approval/config')
    print(f"  GET /approval/config: {response.status_code}")
except Exception as e:
    print(f"  GET /approval/config error: {e}")

try:
    response = client.get('/admin/invoice-status')
    print(f"  GET /admin/invoice-status: {response.status_code}")
except Exception as e:
    print(f"  GET /admin/invoice-status error: {e}")

try:
    response = client.get('/admin/spec-attachments')
    print(f"  GET /admin/spec-attachments: {response.status_code}")
except Exception as e:
    print(f"  GET /admin/spec-attachments error: {e}")

print("\n" + "=" * 60)
print("All tests completed!")
print("=" * 60)
