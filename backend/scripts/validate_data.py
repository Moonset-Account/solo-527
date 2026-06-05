import os
import sys
import django

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from children.models import Child, ClassGroup, AuthorizedPickupPerson, ParentChildRelation
from daily_records.models import DailyRecord
from pickup.models import PickupRecord
from notifications.models import Notification
from finance.models import Payment, LeaveRequest
from common.audit import AuditLog
from common.validators import validate_phone, validate_id_number, validate_date_range
from django.core.exceptions import ValidationError

User = get_user_model()

def validate_user_constraints():
    print('\n=== 验证用户约束 ===')
    for user in User.objects.all():
        if user.phone and len(user.phone) != 11:
            print(f'  ❌ 用户 {user.username} 手机号长度异常: {user.phone}')
        else:
            print(f'  ✅ 用户 {user.username} 手机号: {user.phone or "未设置"}')
        assert user.role in ('admin', 'teacher', 'parent'), f'用户角色异常: {user.role}'
    print(f'  总用户数: {User.objects.count()}')

def validate_child_constraints():
    print('\n=== 验证儿童档案约束 ===')
    for child in Child.objects.all():
        if child.class_group is None:
            print(f'  ⚠️  儿童 {child.name} 未分配班级')
        else:
            print(f'  ✅ {child.name} → {child.class_group.name}')
        assert child.name, f'儿童姓名为空: pk={child.pk}'
        assert child.birth_date, f'儿童出生日期为空: {child.name}'
    print(f'  总儿童数: {Child.objects.count()}')
    print(f'  在园儿童: {Child.objects.filter(is_active=True).count()}')

def validate_pickup_authorization():
    print('\n=== 验证接送授权约束 (验收重点) ===')
    for record in PickupRecord.objects.filter(status='verified'):
        if record.authorized_person:
            print(f'  ✅ {record.child.name} 接送核验通过: 授权人 {record.authorized_person.name}')
        elif record.actual_person_name:
            auth_exists = AuthorizedPickupPerson.objects.filter(
                child=record.child, name=record.actual_person_name, is_active=True
            ).exists()
            if auth_exists:
                print(f'  ✅ {record.child.name} 接送核验通过: {record.actual_person_name} 是授权人')
            else:
                print(f'  ⚠️  {record.child.name} 非授权人员接送已通过核验: {record.actual_person_name}')
    pending = PickupRecord.objects.filter(status='pending')
    if pending.exists():
        print(f'  ⏳ 待核验接送记录: {pending.count()} 条')
        for r in pending:
            is_auth = AuthorizedPickupPerson.objects.filter(
                child=r.child, name=r.actual_person_name, is_active=True
            ).exists()
            status_text = '🔴 非授权' if r.actual_person_name and not is_auth else '🟡 待确认'
            print(f'    {status_text} {r.child.name} - {r.actual_person_name or "未指定"}')

def validate_class_isolation():
    print('\n=== 验证班级权限隔离 ===')
    for teacher in User.objects.filter(role='teacher'):
        classes = ClassGroup.objects.filter(teacher=teacher)
        print(f'  教师 {teacher.first_name}{teacher.last_name}: 管理 {classes.count()} 个班级')
        for cls in classes:
            children_count = cls.children.filter(is_active=True).count()
            print(f'    - {cls.name}: {children_count} 名儿童')

def validate_daily_records():
    print('\n=== 验证每日记录约束 ===')
    today_records = DailyRecord.objects.filter(date=django.utils.timezone.now().date())
    print(f'  今日记录数: {today_records.count()}')
    for record in today_records:
        print(f'  ✅ {record.child.name}: 情绪={record.get_mood_display()}, 食欲={record.get_appetite_display()}, 午睡={record.nap_start}-{record.nap_end}')

def validate_finance():
    print('\n=== 验证缴费数据 ===')
    pending = Payment.objects.filter(status='pending')
    paid = Payment.objects.filter(status='paid')
    overdue = Payment.objects.filter(status='overdue')
    print(f'  待缴费: {pending.count()} 笔')
    print(f'  已缴费: {paid.count()} 笔')
    print(f'  已逾期: {overdue.count()} 笔')

def validate_leave_requests():
    print('\n=== 验证请假申请 ===')
    for leave in LeaveRequest.objects.all():
        print(f'  {leave.child.name}: {leave.start_date}~{leave.end_date} [{leave.get_status_display()}] - {leave.reason[:20]}')

def validate_audit_trail():
    print('\n=== 验证审计日志 ===')
    total = AuditLog.objects.count()
    print(f'  审计日志总数: {total}')
    for log in AuditLog.objects.all()[:5]:
        print(f'  - {log.user} {log.get_action_display()} {log.model_name} #{log.object_id}')

def validate_export():
    print('\n=== 验证导出功能 ===')
    from common.export import export_as_csv, validate_and_export
    payments = Payment.objects.all()[:10]
    fields = ['id', 'child__name', 'fee_item__name', 'amount', 'status']
    try:
        response = validate_and_export(
            payments, fields,
            field_labels={'id': 'ID', 'child__name': '儿童', 'fee_item__name': '项目', 'amount': '金额', 'status': '状态'},
            filename='test_export.csv'
        )
        print(f'  ✅ CSV导出成功, 文件大小: {len(response.content)} bytes')
    except Exception as e:
        print(f'  ❌ CSV导出失败: {e}')

def main():
    print('=' * 60)
    print('托育中心接送和家园沟通平台 - 数据验证报告')
    print('=' * 60)

    validate_user_constraints()
    validate_child_constraints()
    validate_pickup_authorization()
    validate_class_isolation()
    validate_daily_records()
    validate_finance()
    validate_leave_requests()
    validate_audit_trail()
    validate_export()

    print('\n' + '=' * 60)
    print('验证完成!')
    print('=' * 60)

if __name__ == '__main__':
    main()
