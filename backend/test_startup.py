#!/usr/bin/env python3
"""
简单的后端启动测试脚本
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

print("🚀 测试后端启动...")
print("=" * 60)

try:
    from app import create_app, db
    print("✅ 导入 create_app 和 db 成功")
except Exception as e:
    print(f"❌ 导入失败: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

try:
    app = create_app()
    print("✅ 创建 Flask 应用成功")
except Exception as e:
    print(f"❌ 创建应用失败: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

try:
    with app.app_context():
        db.create_all()
        print("✅ 数据库表创建成功")
except Exception as e:
    print(f"❌ 数据库操作失败: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

try:
    rules = []
    for rule in app.url_map.iter_rules():
        if '/api/' in str(rule):
            rules.append(str(rule))
    print(f"✅ 共注册 {len(rules)} 个 API 接口")
except Exception as e:
    print(f"❌ 获取路由失败: {e}")
    sys.exit(1)

print("\n" + "=" * 60)
print("🎉 后端启动测试通过！")
print("\n启动命令:")
print("  cd backend && python3 run.py")
print("\n健康检查:")
print("  curl http://localhost:5000/health")
