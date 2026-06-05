import os, sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
import django
django.setup()

from accounts.serializers import UserSerializer
from accounts.views import UserListView, UserDetailView
from common.serializers import AuditLogSerializer
from common.views import AuditLogListView
from common.urls import urlpatterns

print('Backend imports OK')

from rest_framework.test import APIClient
from rest_framework.authtoken.models import Token
from accounts.models import User

admin = User.objects.get(username='admin')
token, _ = Token.objects.get_or_create(user=admin)
client = APIClient()
client.credentials(HTTP_AUTHORIZATION=f'Token {token.key}')

resp = client.get('/api/accounts/users/', {'role': 'admin,teacher'})
print(f'GET /api/accounts/users/?role=admin,teacher -> {resp.status_code}, count={resp.data["count"]}')
for u in resp.data['results']:
    print(f'  - {u["username"]} ({u["role"]})')

resp = client.get('/api/audit-log/')
print(f'GET /api/audit-log/ -> {resp.status_code}, count={resp.data["count"]}')

resp = client.get('/api/children/')
print(f'GET /api/children/ -> {resp.status_code}, count={resp.data["count"]}')

resp = client.get('/api/pickup/')
print(f'GET /api/pickup/ -> {resp.status_code}, count={resp.data["count"]}')

resp = client.get('/api/notifications/')
print(f'GET /api/notifications/ -> {resp.status_code}')

resp = client.get('/api/finance/payments/')
print(f'GET /api/finance/payments/ -> {resp.status_code}, count={resp.data["count"]}')

resp = client.get('/api/daily-records/')
print(f'GET /api/daily-records/ -> {resp.status_code}, count={resp.data["count"]}')

# Test Bearer rejection / Token acceptance
client2 = APIClient()
admin2 = User.objects.get(username='admin')
token2, _ = Token.objects.get_or_create(user=admin2)
client2.credentials(HTTP_AUTHORIZATION=f'Bearer {token2.key}')
resp_bearer = client2.get('/api/children/')
print(f'\nGET with Bearer prefix -> {resp_bearer.status_code} (should be 401)')

client2.credentials(HTTP_AUTHORIZATION=f'Token {token2.key}')
resp_token = client2.get('/api/children/')
print(f'GET with Token prefix -> {resp_token.status_code} (should be 200)')

print('\nAll API tests passed!')
