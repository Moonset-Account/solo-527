#!/bin/bash
set -e

echo "========================================="
echo "  社区议题任务派发系统 - 部署脚本"
echo "========================================="

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/.."
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"

ENV="${1:-production}"

echo ""
echo "环境: $ENV"
echo "项目目录: $PROJECT_DIR"
echo ""

step() {
    echo ""
    echo ">>> $1"
}

step "检查 Docker 和 Docker Compose..."
if ! command -v docker &> /dev/null; then
    echo "错误: Docker 未安装"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "错误: Docker Compose 未安装"
    exit 1
fi

step "创建环境变量文件..."
if [ ! -f "$PROJECT_DIR/.env" ]; then
    cp "$PROJECT_DIR/.env.example" "$PROJECT_DIR/.env"
    echo "已创建 .env 文件，请修改配置后重新运行"
    exit 0
fi

step "加载环境变量..."
set -a
source "$PROJECT_DIR/.env"
set +a

step "停止现有服务..."
docker-compose -f "$PROJECT_DIR/docker-compose.yml" down

step "构建并启动服务..."
if [ "$ENV" = "production" ]; then
    docker-compose -f "$PROJECT_DIR/docker-compose.yml" -f "$PROJECT_DIR/docker-compose.prod.yml" up -d --build
else
    docker-compose -f "$PROJECT_DIR/docker-compose.yml" up -d --build
fi

step "等待数据库启动..."
sleep 10

step "运行数据库迁移..."
docker-compose -f "$PROJECT_DIR/docker-compose.yml" exec -T backend python manage.py migrate --noinput

step "收集静态文件..."
docker-compose -f "$PROJECT_DIR/docker-compose.yml" exec -T backend python manage.py collectstatic --noinput

step "创建超级用户（如果不存在）..."
docker-compose -f "$PROJECT_DIR/docker-compose.yml" exec -T backend python manage.py shell << 'EOF'
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@example.com', 'admin123')
    print("超级用户创建成功: admin / admin123")
else:
    print("超级用户已存在")
EOF

step "启动 Celery Worker..."
docker-compose -f "$PROJECT_DIR/docker-compose.yml" exec -T backend celery -A config worker -l info -D

step "启动 Celery Beat..."
docker-compose -f "$PROJECT_DIR/docker-compose.yml" exec -T backend celery -A config beat -l info -D

echo ""
echo "========================================="
echo "  部署完成！"
echo "========================================="
echo ""
echo "访问地址:"
echo "  前端: http://localhost:3000"
echo "  后端API: http://localhost:8000/api/v1/"
echo "  管理后台: http://localhost:8000/admin/"
echo ""
echo "默认账号:"
echo "  管理员: admin / admin123"
echo ""
echo "常用命令:"
echo "  查看日志: docker-compose logs -f"
echo "  停止服务: docker-compose down"
echo "  重启服务: docker-compose restart"
echo ""
