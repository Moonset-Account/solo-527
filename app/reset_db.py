"""
数据库重置脚本 - 用于开发环境快速重建数据库
注意：会删除所有表和数据，仅用于开发测试
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import Base, engine
from app.seed import seed_data
from sqlalchemy.orm import sessionmaker


def reset_database():
    print("⚠️  警告：即将删除所有表并重建！")
    print("此操作仅用于开发环境，生产环境禁止使用！")
    
    Base.metadata.drop_all(bind=engine)
    print("✅ 已删除所有表")
    
    Base.metadata.create_all(bind=engine)
    print("✅ 已创建所有表（使用最新模型结构）")
    
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    try:
        seed_data(db)
    finally:
        db.close()
    
    print("\n🎉 数据库重置完成！")
    print("测试账号：")
    print("  admin / admin123")
    print("  coordinator / coord123")
    print("  doctor / doctor123")
    print("  volunteer / vol123")
    print("  finance / finance123")


if __name__ == "__main__":
    confirm = input("确认重置数据库吗？输入 YES 继续: ")
    if confirm.strip() == "YES":
        reset_database()
    else:
        print("已取消")
