import os
import sys

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BASE_DIR)

import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'bookstore.settings')
django.setup()

from django.contrib.auth.hashers import make_password
from apps.core.models import User


def reset_test_passwords():
    print("正在重置测试账号密码...")
    
    users_data = [
        {'username': 'admin', 'password': 'admin123', 'role': 'admin'},
        {'username': 'manager', 'password': 'manager123', 'role': 'manager'},
        {'username': 'staff', 'password': 'staff123', 'role': 'staff'},
    ]
    
    for user_data in users_data:
        try:
            user = User.objects.get(username=user_data['username'])
            user.set_password(user_data['password'])
            user.save()
            print(f"  ✅ {user_data['username']} 密码已重置为: {user_data['password']}")
        except User.DoesNotExist:
            print(f"  ⚠️  用户 {user_data['username']} 不存在，正在创建...")
            user = User.objects.create(
                username=user_data['username'],
                role=user_data['role'],
                is_staff=True,
                is_superuser=user_data['role'] == 'admin',
                first_name=user_data['username'].capitalize()
            )
            user.set_password(user_data['password'])
            user.save()
            print(f"  ✅ {user_data['username']} 创建成功，密码: {user_data['password']}")
    
    print("\n密码重置完成！")


if __name__ == '__main__':
    reset_test_passwords()
