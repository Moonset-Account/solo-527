.PHONY: help build up down migrate fixtures superuser logs shell restart

help: ## 显示帮助
	@awk 'BEGIN {FS = ":.*##"; printf "\n使用方法: make [目标]\n\n目标:\n"} /^[a-zA-Z_-]+:.*?##/ { printf "  %-20s %s\n", $$1, $$2 }' $(MAKEFILE_LIST)

build: ## 构建所有服务
	docker-compose build

up: ## 启动所有服务
	docker-compose up -d

down: ## 停止所有服务
	docker-compose down

migrate: ## 执行数据库迁移
	docker-compose exec backend python manage.py migrate

fixtures: ## 加载初始数据
	docker-compose exec backend python manage.py loaddata fixtures/initial_data.json

superuser: ## 创建超级用户
	docker-compose exec backend python manage.py createsuperuser

logs: ## 查看日志
	docker-compose logs -f

backend-logs: ## 查看后端日志
	docker-compose logs -f backend

frontend-logs: ## 查看前端日志
	docker-compose logs -f frontend

celery-logs: ## 查看 Celery 日志
	docker-compose logs -f celery_worker

shell: ## 进入 Django Shell
	docker-compose exec backend python manage.py shell

dbshell: ## 进入数据库 Shell
	docker-compose exec db psql -U dental_user dental_clinic

restart: ## 重启所有服务
	docker-compose restart

clean: ## 清理停止的容器和未使用的镜像
	docker-compose down --rmi local

init: build up migrate fixtures superuser ## 初始化项目（构建+启动+迁移+数据+创建用户）
	@echo "项目初始化完成！"
	@echo "前端: http://localhost:3000"
	@echo "后端: http://localhost:8000"
	@echo "Admin: http://localhost:8000/admin"
