#!/usr/bin/env python3
"""
API端点验证脚本 - 验证所有视图、URL和权限配置正确
"""
import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'clinic.settings')
django.setup()

from django.urls import get_resolver
from django.urls.exceptions import Resolver404


def check_url_patterns():
    print("=" * 70)
    print("检查 URL 路由配置")
    print("=" * 70)

    resolver = get_resolver()
    api_patterns = []

    def extract_patterns(patterns, prefix=''):
        for pattern in patterns:
            if hasattr(pattern, 'url_patterns'):
                extract_patterns(pattern.url_patterns, prefix + str(pattern.pattern))
            else:
                full_path = prefix + str(pattern.pattern)
                if 'api/' in full_path and not '<format>' in full_path:
                    api_patterns.append(full_path)

    try:
        extract_patterns(resolver.url_patterns)
    except Exception as e:
        print(f"URL解析错误: {e}")
        return False

    print(f"\n找到 {len(api_patterns)} 个API端点:\n")

    key_endpoints = [
        '/api/patients/profiles/',
        '/api/patients/profiles/me/',
        '/api/doctors/daily-slots/',
        '/api/appointments/appointments/',
        '/api/appointments/appointments/my-appointments/',
        '/api/appointments/appointments/{id}/reschedule/',
        '/api/appointments/followup-plans/',
        '/api/appointments/waiting-queue/',
        '/api/appointments/medication-reminders/',
        '/api/appointments/medication-reminders/my-reminders/',
        '/api/appointments/reschedule-reasons/',
        '/api/medical/summaries/',
        '/api/medical/followup-records/',
        '/api/medical/permissions/',
        '/api/notifications/sms/',
        '/api/notifications/notifications/',
        '/api/reports/appointment-summary/',
        '/api/reports/cancellation-reason-stats/',
    ]

    found_count = 0
    for endpoint in key_endpoints:
        found = any(endpoint.replace('{id}', '1') in p or endpoint in p for p in api_patterns)
        status = "✓" if found else "✗"
        if found:
            found_count += 1
        print(f"  {status} {endpoint}")

    print(f"\n关键端点: {found_count}/{len(key_endpoints)} 已配置")
    return found_count == len(key_endpoints)


def check_views():
    print("\n" + "=" * 70)
    print("检查 视图类 导入和权限配置")
    print("=" * 70)

    try:
        from patients.views import PatientProfileViewSet, ChronicDiseaseViewSet
        print("  ✓ patients.views 导入成功")
        print(f"    - PatientProfileViewSet 权限: {PatientProfileViewSet.permission_classes}")
    except Exception as e:
        print(f"  ✗ patients.views 导入失败: {e}")
        return False

    try:
        from doctors.views import DoctorProfileViewSet, DailySlotViewSet
        print("  ✓ doctors.views 导入成功")
    except Exception as e:
        print(f"  ✗ doctors.views 导入失败: {e}")
        return False

    try:
        from appointments.views import (
            AppointmentViewSet, FollowUpPlanViewSet,
            WaitingQueueViewSet, MedicationReminderViewSet,
            RescheduleReasonViewSet
        )
        print("  ✓ appointments.views 导入成功")
        print(f"    - RescheduleReasonViewSet 权限: {RescheduleReasonViewSet.permission_classes}")
    except Exception as e:
        print(f"  ✗ appointments.views 导入失败: {e}")
        return False

    try:
        from medical_records.views import (
            MedicalSummaryViewSet, FollowUpRecordViewSet,
            MedicalRecordPermissionViewSet
        )
        print("  ✓ medical_records.views 导入成功")
    except Exception as e:
        print(f"  ✗ medical_records.views 导入失败: {e}")
        return False

    try:
        from notifications.views import SMSMessageViewSet, NotificationViewSet
        print("  ✓ notifications.views 导入成功")
    except Exception as e:
        print(f"  ✗ notifications.views 导入失败: {e}")
        return False

    try:
        from reports.views import ReportViewSet
        print("  ✓ reports.views 导入成功")
        print(f"    - ReportViewSet 权限: {ReportViewSet.permission_classes}")
    except Exception as e:
        print(f"  ✗ reports.views 导入失败: {e}")
        return False

    return True


def check_models():
    print("\n" + "=" * 70)
    print("检查 模型方法 和 业务逻辑")
    print("=" * 70)

    try:
        from appointments.models import Appointment
        import inspect

        reschedule_method = inspect.getsource(Appointment.reschedule)
        has_cancelled_at = 'cancelled_at' in reschedule_method
        has_reschedule_reason = 'reschedule_reason' in reschedule_method
        has_original_reason = 'original_reason' in reschedule_method

        print(f"  ✓ Appointment.reschedule() 方法检查:")
        print(f"    - 记录 cancelled_at: {'✓' if has_cancelled_at else '✗'}")
        print(f"    - 记录 reschedule_reason: {'✓' if has_reschedule_reason else '✗'}")
        print(f"    - 保留 original_reason: {'✓' if has_original_reason else '✗'}")

        if not (has_cancelled_at and has_reschedule_reason and has_original_reason):
            return False
    except Exception as e:
        print(f"  ✗ 模型方法检查失败: {e}")
        return False

    try:
        from reports.services import AppointmentReportService
        import inspect

        stats_method = inspect.getsource(AppointmentReportService.get_cancellation_reason_stats)
        has_doctor_absent = 'DOCTOR_ABSENT' in stats_method
        has_patient_request = 'PATIENT_REQUEST' in stats_method
        has_medicine_shortage = 'MEDICINE_SHORTAGE' in stats_method
        has_no_show = 'NO_SHOW' in stats_method

        print(f"  ✓ 报表统计方法检查:")
        print(f"    - 统计医生停诊: {'✓' if has_doctor_absent else '✗'}")
        print(f"    - 统计患者申请: {'✓' if has_patient_request else '✗'}")
        print(f"    - 统计药品缺货: {'✓' if has_medicine_shortage else '✗'}")
        print(f"    - 统计患者爽约: {'✓' if has_no_show else '✗'}")

        if not (has_doctor_absent and has_patient_request and has_medicine_shortage and has_no_show):
            return False
    except Exception as e:
        print(f"  ✗ 报表统计检查失败: {e}")
        return False

    return True


def check_permissions():
    print("\n" + "=" * 70)
    print("检查 权限类 定义")
    print("=" * 70)

    try:
        from core.permissions import (
            IsAdminOrNurse, IsAdminOrNurseOrDoctor,
            IsDoctor, IsPatient, IsOwnerOrStaff
        )
        print("  ✓ 所有权限类定义成功")
        print(f"    - IsAdminOrNurse: {IsAdminOrNurse}")
        print(f"    - IsAdminOrNurseOrDoctor: {IsAdminOrNurseOrDoctor}")
        print(f"    - IsOwnerOrStaff: {IsOwnerOrStaff}")
    except Exception as e:
        print(f"  ✗ 权限类导入失败: {e}")
        return False

    return True


def main():
    print("\n🏥 诊所复诊预约系统 - API 验证脚本\n")

    all_passed = True

    all_passed &= check_url_patterns()
    all_passed &= check_views()
    all_passed &= check_models()
    all_passed &= check_permissions()

    print("\n" + "=" * 70)
    if all_passed:
        print("✅ 所有检查通过！API配置正确，可以正常使用。")
    else:
        print("❌ 部分检查未通过，请查看上述错误信息。")
    print("=" * 70)

    return 0 if all_passed else 1


if __name__ == '__main__':
    sys.exit(main())
