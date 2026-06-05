import os
import sys

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BASE_DIR)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'bookstore.settings')

import django
django.setup()

print("=== 测试认证系统 ===")
print()

from django.contrib.auth import authenticate

test_users = [
    ('admin', 'admin123'),
    ('manager', 'manager123'),
    ('staff', 'staff123'),
]

for username, password in test_users:
    user = authenticate(username=username, password=password)
    if user:
        print(f"✅ {username}: 登录成功 (role: {user.role})")
    else:
        print(f"❌ {username}: 登录失败")
        try:
            from apps.core.models import User
            u = User.objects.get(username=username)
            print(f"   用户存在，检查密码哈希...")
            print(f"   密码哈希: {u.password[:50]}...")
        except Exception as e:
            print(f"   用户不存在或出错: {e}")

print()
print("=== 测试完成 ===")
