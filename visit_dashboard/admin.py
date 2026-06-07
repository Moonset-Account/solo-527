from django.contrib import admin
from visit_dashboard.models import (
    Store, Team, ProblemType, WorkOrder, VisitRecord,
    Refund, SecondaryComplaint, MetricConfig, AsyncReport, AnomalyAnnotation,
)


@admin.register(Store)
class StoreAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'region', 'is_active']
    search_fields = ['name', 'code']
    list_filter = ['is_active', 'region']


@admin.register(Team)
class TeamAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'store']
    list_filter = ['store']
    search_fields = ['name', 'code']


@admin.register(ProblemType)
class ProblemTypeAdmin(admin.ModelAdmin):
    list_display = ['name', 'category']
    list_filter = ['category']
    search_fields = ['name']


@admin.register(WorkOrder)
class WorkOrderAdmin(admin.ModelAdmin):
    list_display = ['order_no', 'customer_name', 'store', 'problem_type', 'team', 'handler', 'status', 'created_at']
    list_filter = ['status', 'store', 'problem_type', 'team']
    search_fields = ['order_no', 'customer_name', 'customer_phone']
    date_hierarchy = 'created_at'


@admin.register(VisitRecord)
class VisitRecordAdmin(admin.ModelAdmin):
    list_display = ['__str__', 'work_order', 'visitor', 'visit_status', 'satisfaction_score', 'visited_at']
    list_filter = ['visit_status']
    search_fields = ['work_order__order_no']


@admin.register(Refund)
class RefundAdmin(admin.ModelAdmin):
    list_display = ['__str__', 'work_order', 'amount', 'status', 'refund_time']
    list_filter = ['status']


@admin.register(SecondaryComplaint)
class SecondaryComplaintAdmin(admin.ModelAdmin):
    list_display = ['__str__', 'work_order', 'complaint_type', 'complaint_time', 'is_post_refund']
    list_filter = ['is_post_refund', 'complaint_type']


@admin.register(MetricConfig)
class MetricConfigAdmin(admin.ModelAdmin):
    list_display = ['name', 'dimension', 'low_score_threshold', 'satisfaction_weight', 'is_active']
    list_filter = ['dimension', 'is_active']


@admin.register(AsyncReport)
class AsyncReportAdmin(admin.ModelAdmin):
    list_display = ['name', 'report_type', 'status', 'created_by', 'created_at', 'completed_at']
    list_filter = ['status', 'report_type']


@admin.register(AnomalyAnnotation)
class AnomalyAnnotationAdmin(admin.ModelAdmin):
    list_display = ['__str__', 'anomaly_type', 'annotated_by', 'created_at']
    list_filter = ['anomaly_type']
