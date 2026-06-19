.PHONY: help dev deploy build test backup clean

help:
	@echo "社区议题任务派发系统 - Makefile 命令"
	@echo ""
	@echo "可用命令:"
	@echo "  make dev        - 启动开发环境"
	@echo "  make deploy     - 部署到生产环境"
	@echo "  make build      - 构建 Docker 镜像"
	@echo "  make test       - 运行单元测试"
	@echo "  make backup     - 备份数据库"
	@echo "  make clean      - 停止并清理所有服务"
	@echo "  make logs       - 查看服务日志"
	@echo "  make migrate    - 运行数据库迁移"
	@echo "  make shell      - 进入 Django Shell"

dev:
	@echo "启动开发环境..."
	@bash scripts/dev.sh

deploy:
	@echo "部署到生产环境..."
	@bash scripts/deploy.sh production

build:
	@echo "构建 Docker 镜像..."
	@docker-compose build

test:
	@echo "运行单元测试..."
	@cd backend && python manage.py test --verbosity=2

test-coverage:
	@echo "运行单元测试并生成覆盖率报告..."
	@cd backend && coverage run --source='.' manage.py test
	@cd backend && coverage report
	@cd backend && coverage html

backup:
	@echo "备份数据库..."
	@bash scripts/backup.sh

clean:
	@echo "停止并清理所有服务..."
	@docker-compose down -v

logs:
	@echo "查看服务日志..."
	@docker-compose logs -f

migrate:
	@echo "运行数据库迁移..."
	@cd backend && python manage.py migrate

shell:
	@echo "进入 Django Shell..."
	@cd backend && python manage.py shell

createsuperuser:
	@echo "创建超级用户..."
	@cd backend && python manage.py createsuperuser

collectstatic:
	@echo "收集静态文件..."
	@cd backend && python manage.py collectstatic --noinput
