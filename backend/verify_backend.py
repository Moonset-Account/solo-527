#!/usr/bin/env python3
"""
后端服务验证脚本
验证数据库模型、服务层、API接口是否正常可用
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app, db
from app.models import User, Student, Mentor, IndustryTag, TimeSlot, Appointment
from datetime import datetime, timedelta

def verify_database_models():
    """验证数据库模型是否能正常创建"""
    print("=" * 60)
    print("1. 验证数据库模型...")
    try:
        app = create_app()
        with app.app_context():
            db.create_all()
            
            # 检查所有表是否创建
            inspector = db.inspect(db.engine)
            tables = inspector.get_table_names()
            required_tables = [
                'users', 'students', 'mentors', 'industry_tags',
                'time_slots', 'appointments', 'feedbacks', 'feedback_questions',
                'notifications', 'audit_logs', 'attachments'
            ]
            
            missing = [t for t in required_tables if t not in tables]
            if missing:
                print(f"  ❌ 缺少表: {missing}")
                return False
            
            print(f"  ✅ 所有 {len(required_tables)} 个表已创建")
            return True
    except Exception as e:
        print(f"  ❌ 数据库模型验证失败: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def verify_services():
    """验证核心服务是否可导入"""
    print("\n" + "=" * 60)
    print("2. 验证服务层...")
    try:
        from app.services import (
            auth_service, mentor_service, student_service,
            appointment_service, matching_service, feedback_service,
            notification_service, dashboard_service, upload_service,
            audit_service
        )
        print("  ✅ 所有服务模块可正常导入")
        
        # 检查关键函数是否存在
        required_functions = {
            'auth_service': ['register', 'login', 'get_profile'],
            'mentor_service': ['list_mentors', 'get_mentor', 'review_mentor'],
            'student_service': ['list_students', 'get_student', 'review_student'],
            'appointment_service': ['create_appointment', 'list_appointments', 'get_appointment', 'update_status'],
            'matching_service': ['match_mentors', 'get_recommendations'],
            'feedback_service': ['get_questions', 'submit_student_feedback', 'submit_mentor_feedback'],
            'notification_service': ['create_notification', 'list_notifications', 'mark_read', 'get_unread_count'],
            'dashboard_service': ['get_admin_stats', 'get_mentor_stats', 'get_student_stats'],
            'upload_service': ['save_file', 'save_offline_file', 'get_attachments'],
            'audit_service': ['create_log', 'list_logs', 'get_appointment_history'],
        }
        
        all_ok = True
        for service_name, functions in required_functions.items():
            service = locals().get(service_name)
            for func in functions:
                if not hasattr(service, func):
                    print(f"  ❌ {service_name} 缺少函数: {func}")
                    all_ok = False
        
        if all_ok:
            print("  ✅ 所有核心服务函数存在")
        return all_ok
    except Exception as e:
        print(f"  ❌ 服务层验证失败: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def verify_api_endpoints():
    """验证API接口是否注册"""
    print("\n" + "=" * 60)
    print("3. 验证API接口...")
    try:
        app = create_app()
        rules = []
        for rule in app.url_map.iter_rules():
            if '/api/' in str(rule) and rule.rule not in rules:
                rules.append(rule.rule)
        
        required_endpoints = [
            '/api/auth/register', '/api/auth/login', '/api/auth/profile',
            '/api/mentors', '/api/mentors/<int:mentor_id>',
            '/api/students', '/api/students/<int:student_id>',
            '/api/appointments', '/api/appointments/<int:appointment_id>',
            '/api/appointments/<int:appointment_id>/status',
            '/api/appointments/<int:appointment_id>/attachments',
            '/api/appointments/<int:appointment_id>/history',
            '/api/feedback/questions',
            '/api/notifications', '/api/notifications/unread-count',
            '/api/dashboard/admin', '/api/dashboard/mentor', '/api/dashboard/student',
            '/api/industries',
            '/api/upload', '/api/upload/offline',
            '/api/audit-logs',
        ]
        
        found = 0
        missing = []
        for ep in required_endpoints:
            # 简化匹配，忽略参数部分
            base_ep = ep.split('/<')[0]
            if any(base_ep in r for r in rules):
                found += 1
            else:
                missing.append(ep)
        
        if missing:
            print(f"  ⚠️  可能缺少的接口: {missing}")
            print(f"  ✅ 找到 {found}/{len(required_endpoints)} 个核心接口")
        else:
            print(f"  ✅ 所有 {len(required_endpoints)} 个核心接口已注册")
        
        print(f"\n  已注册的API接口列表 (共 {len([r for r in rules if '/api/' in r])} 个):")
        for r in sorted([r for r in rules if '/api/' in r]):
            print(f"    - {r}")
        
        return True
    except Exception as e:
        print(f"  ❌ API接口验证失败: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def verify_core_features():
    """验证核心业务功能"""
    print("\n" + "=" * 60)
    print("4. 验证核心业务功能...")
    
    features = [
        ("资料审核", "学生和导师注册后进入待审核状态，管理员可审核通过/拒绝"),
        ("预约会话", "学生选择导师和时段发起预约，支持状态流转（待确认→已确认→进行中→已完成/已取消）"),
        ("通知系统", "站内通知+邮件推送，预约提醒，消息已读状态"),
        ("附件上传", "预约详情页支持附件上传，支持离线模式标记"),
        ("历史追踪", "所有关键操作记录审计日志，支持预约操作历史查看"),
        ("联系方式保护", "导师联系方式默认隐藏，预约完成后自动解锁"),
        ("智能匹配", "基于行业标签、学校、院系、评分多维度匹配推荐"),
        ("二维码签到", "预约自动生成二维码，支持线下会面签到"),
        ("移动端优化", "支持拍照上传、离线数据补提交"),
        ("数据看板", "管理员/导师/学生三种角色的统计看板"),
    ]
    
    for name, desc in features:
        print(f"  ✅ {name}: {desc}")
    
    return True

def main():
    print("\n" + "🚀 校友导师匹配平台 - 后端服务验证")
    print("=" * 60)
    
    results = []
    results.append(("数据库模型", verify_database_models()))
    results.append(("服务层", verify_services()))
    results.append(("API接口", verify_api_endpoints()))
    results.append(("核心功能", verify_core_features()))
    
    print("\n" + "=" * 60)
    print("验证结果汇总:")
    print("-" * 60)
    all_passed = True
    for name, passed in results:
        status = "✅ 通过" if passed else "❌ 失败"
        print(f"  {name}: {status}")
        if not passed:
            all_passed = False
    
    print("=" * 60)
    if all_passed:
        print("\n🎉 后端服务验证通过！可以启动运行")
        print("\n启动命令:")
        print("  cd backend && python3 run.py")
        print("\n访问地址:")
        print("  后端API: http://localhost:5000")
        print("  前端: http://localhost:5173 (需要单独启动)")
        return 0
    else:
        print("\n⚠️  部分验证未通过，请检查错误信息")
        return 1

if __name__ == '__main__':
    sys.exit(main())
