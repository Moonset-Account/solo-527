#!/usr/bin/env python3
"""
数据库初始化脚本
用法: python scripts/init_db.py [--drop]
"""
import os
import sys
import argparse

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import Database


def main():
    parser = argparse.ArgumentParser(description="初始化数据库表结构")
    parser.add_argument("--drop", action="store_true", help="先删除已有表再重建")
    args = parser.parse_args()

    print("=" * 60)
    print("工业传感器异常预测系统 - 数据库初始化")
    print("=" * 60)

    if args.drop:
        warning = input("⚠️  警告：--drop 将删除所有表和数据！确认吗？(yes/NO): ")
        if warning.lower() != "yes":
            print("已取消操作")
            return

    print(f"\n正在初始化数据库... (drop_first={args.drop})")

    try:
        Database.init_tables(drop_first=args.drop)
        print("✅ 数据库表初始化成功！")
        print("\n已创建的表:")
        tables = [
            "sensor_readings - 传感器原始数据",
            "maintenance_records - 维修记录",
            "shift_records - 班次配置",
            "feature_records - 特征记录",
            "alerts - 告警队列",
            "feedback_records - 人工反馈记录",
            "model_versions - 模型版本",
            "data_versions - 数据版本",
            "relabel_records - 人工改标记录",
        ]
        for t in tables:
            print(f"  · {t}")
    except Exception as e:
        print(f"❌ 初始化失败: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
