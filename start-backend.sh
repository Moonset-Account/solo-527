#!/bin/bash

set -e

echo "========================================"
echo "  宿舍报修消息通知中心 - 后端启动"
echo "========================================"

cd "$(dirname "$0")/backend"

if [ ! -d "venv" ]; then
    echo "📦 创建 Python 虚拟环境..."
    python3 -m venv venv
fi

echo "🐍 激活虚拟环境并安装依赖..."
source venv/bin/activate
pip install -r requirements.txt

if [ ! -f ".env" ]; then
    echo "⚙️  创建环境配置文件..."
    cp .env.example .env
    echo "请修改 backend/.env 中的数据库配置"
fi

echo "🔄 执行数据库迁移..."
python manage.py migrate

echo "🌱 初始化示例数据..."
python manage.py shell << 'EOF'
from apps.users.models import User, Role, RoleConfig
from django.contrib.auth.hashers import make_password

# 创建默认角色配置
for role, name in [(Role.STUDENT, '学生'), (Role.DORM_MANAGER, '宿管老师'), (Role.MAINTENANCE, '维修人员'), (Role.ADMIN, '管理员')]:
    RoleConfig.objects.get_or_create(
        role=role,
        defaults={'description': f'{name}角色', 'permissions': {}}
    )

# 创建管理员
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin123', real_name='系统管理员', role=Role.ADMIN, is_verified=True)
    print('✅ 创建管理员: admin / admin123')

# 创建学生用户
if not User.objects.filter(username='student').exists():
    User.objects.create_user('student', '123456', real_name='张三', role=Role.STUDENT, student_id='2024001', dorm_building='1号楼', dorm_room='301', phone='13800138000', is_verified=True)
    print('✅ 创建学生: student / 123456')

# 创建宿管
if not User.objects.filter(username='dorm').exists():
    User.objects.create_user('dorm', '123456', real_name='李老师', role=Role.DORM_MANAGER, student_id='T001', dorm_building='1号楼', phone='13800138001', is_verified=True)
    print('✅ 创建宿管: dorm / 123456')

# 创建维修人员
if not User.objects.filter(username='worker').exists():
    User.objects.create_user('worker', '123456', real_name='王师傅', role=Role.MAINTENANCE, student_id='W001', phone='13800138002', is_verified=True)
    print('✅ 创建维修: worker / 123456')

print('✅ 默认用户创建完成')
EOF

echo ""
echo "🚀 启动 Django 开发服务器 (端口 8000)..."
python manage.py runserver 0.0.0.0:8000
