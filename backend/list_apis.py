#!/usr/bin/env python3
"""
列出所有API接口并按功能分类
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app

app = create_app()

print("=" * 80)
print("校友导师匹配平台 - API 接口清单")
print("=" * 80)

# 按功能分类
categories = {
    "认证与用户": ["/auth", "/users"],
    "资料审核": ["/mentors", "/students"],
    "预约会话": ["/appointments", "/time-slots"],
    "通知系统": ["/notifications"],
    "附件上传": ["/upload", "/uploads", "/attachments"],
    "历史追踪": ["/audit-logs", "/history"],
    "反馈评价": ["/feedback"],
    "数据看板": ["/dashboard"],
    "行业标签": ["/industry", "/industries"],
}

all_rules = []
for rule in app.url_map.iter_rules():
    if '/api/' in str(rule):
        all_rules.append(str(rule))

all_rules.sort()

# 按分类显示
for category, prefixes in categories.items():
    print(f"\n📋 {category}:")
    print("-" * 80)
    count = 0
    for rule in all_rules:
        for prefix in prefixes:
            if prefix in rule:
                print(f"  {rule}")
                count += 1
                break
    print(f"  共 {count} 个接口")

# 未分类的接口
classified = set()
for prefixes in categories.values():
    for prefix in prefixes:
        for rule in all_rules:
            if prefix in rule:
                classified.add(rule)

unclassified = [r for r in all_rules if r not in classified]
if unclassified:
    print(f"\n📋 其他接口:")
    print("-" * 80)
    for rule in unclassified:
        print(f"  {rule}")

print("\n" + "=" * 80)
print(f"总计: {len(all_rules)} 个 API 接口")
print("=" * 80)
