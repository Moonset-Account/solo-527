#!/usr/bin/env python3
import os
import sys

def show_help():
    print("""
连锁茶饮原料损耗看板 - 配置切换工具

用法:
  python3 switch_config.py [mode]

模式:
  dev        - 开发模式: SQLite + Celery EAGER (默认)
  production - 生产模式: PostgreSQL + Redis + Celery Worker
  status     - 查看当前配置状态

环境变量说明:
  PostgreSQL:
    DB_ENGINE=postgresql
    DB_NAME=tea_loss_dashboard
    DB_USER=postgres
    DB_PASSWORD=your_password
    DB_HOST=localhost
    DB_PORT=5432

  Redis/Celery:
    USE_REDIS=True
    REDIS_URL=redis://localhost:6379/0
""")

def show_status():
    print("\n当前配置状态:")
    print(f"  DB_ENGINE:    {os.environ.get('DB_ENGINE', 'sqlite (默认)')}")
    print(f"  USE_REDIS:    {os.environ.get('USE_REDIS', 'False (默认 EAGER 模式)')}")
    print(f"  REDIS_URL:    {os.environ.get('REDIS_URL', 'redis://localhost:6379/0')}")
    print()
    print("启动命令:")
    print("  开发模式:  python3 manage.py runserver 0.0.0.0:9000")
    print("  生产模式:  python3 manage.py runserver 0.0.0.0:9000")
    print("  Celery:    celery -A tea_loss_dashboard worker -l info")
    print()

def set_dev_mode():
    print("\n✅ 已切换到开发模式（SQLite + Celery EAGER）")
    print("\n请在终端执行以下命令:")
    print("  unset DB_ENGINE USE_REDIS")
    print("  python3 manage.py runserver 0.0.0.0:9000")
    print()

def set_production_mode():
    print("\n✅ 已配置生产模式（PostgreSQL + Redis + Celery 异步）")
    print("\n请在终端执行以下命令（修改密码等参数为实际值）:")
    print("""
  export DB_ENGINE=postgresql
  export DB_NAME=tea_loss_dashboard
  export DB_USER=postgres
  export DB_PASSWORD=your_password
  export DB_HOST=localhost
  export DB_PORT=5432
  export USE_REDIS=True
  export REDIS_URL=redis://localhost:6379/0

  # 初始化数据库（首次运行）
  python3 manage.py migrate
  python3 init_data.py
  python3 init_aggregation.py

  # 启动服务
  python3 manage.py runserver 0.0.0.0:9000

  # 另开终端启动 Celery Worker
  celery -A tea_loss_dashboard worker -l info
""")
    print("注意: 请确保 PostgreSQL 和 Redis 服务已启动")
    print()

if __name__ == '__main__':
    if len(sys.argv) < 2:
        show_help()
        show_status()
    elif sys.argv[1] == 'dev':
        set_dev_mode()
    elif sys.argv[1] == 'production':
        set_production_mode()
    elif sys.argv[1] == 'status':
        show_status()
    else:
        show_help()
