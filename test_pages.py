import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'makerspace.settings')
import django
django.setup()

from django.test import Client
from django.contrib.auth import get_user_model

User = get_user_model()
client = Client()

user = User.objects.get(email='member@makerspace.com')
client.force_login(user)

test_urls = [
    '/equipment/',
    '/bookings/calendar/',
    '/bookings/my/',
    '/training/courses/',
    '/training/applications/',
    '/training/certifications/',
    '/consumables/',
    '/consumables/usage/',
    '/maintenance/',
    '/maintenance/tickets/',
    '/maintenance/tickets/create/',
    '/safety/incidents/',
    '/scan/',
    '/history/',
    '/notifications/',
]

print('页面访问测试：')
all_ok = True
for url in test_urls:
    try:
        response = client.get(url)
        status = '✅' if response.status_code == 200 else '❌'
        print(f'  {status} {url} - {response.status_code}')
        if response.status_code != 200:
            all_ok = False
    except Exception as e:
        print(f'  ❌ {url} - 错误: {e}')
        all_ok = False

if all_ok:
    print('\n🎉 所有页面访问正常！')
else:
    print('\n⚠️  有页面访问失败，请检查')
