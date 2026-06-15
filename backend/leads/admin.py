from django.contrib import admin
from .models import LeadSource, LeadStatus, Customer, Lead, FollowupRecord, TimeoutRecord


@admin.register(LeadSource)
class LeadSourceAdmin(admin.ModelAdmin):
    list_display = ['name', 'is_active', 'sort_order', 'created_at']
    list_filter = ['is_active']
    search_fields = ['name']


@admin.register(LeadStatus)
class LeadStatusAdmin(admin.ModelAdmin):
    list_display = ['name', 'stage', 'sort_order', 'is_active']
    list_filter = ['stage', 'is_active']
    search_fields = ['name']


@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ['name', 'phone', 'email', 'gender', 'created_at']
    list_filter = ['gender']
    search_fields = ['name', 'phone', 'email']
    ordering = ['-created_at']


@admin.register(Lead)
class LeadAdmin(admin.ModelAdmin):
    list_display = ['id', 'customer', 'source', 'status', 'quality', 'assigned_to', 'expected_amount', 'is_public_sea', 'is_timeout', 'created_at']
    list_filter = ['status', 'quality', 'is_public_sea', 'is_timeout', 'source']
    search_fields = ['customer__name', 'customer__phone', 'dental_issues']
    raw_id_fields = ['customer', 'assigned_to', 'consultant', 'created_by']
    ordering = ['-created_at']


@admin.register(FollowupRecord)
class FollowupRecordAdmin(admin.ModelAdmin):
    list_display = ['lead', 'followup_type', 'result', 'created_by', 'created_at']
    list_filter = ['followup_type', 'result']
    search_fields = ['content']
    raw_id_fields = ['lead', 'created_by']
    ordering = ['-created_at']


@admin.register(TimeoutRecord)
class TimeoutRecordAdmin(admin.ModelAdmin):
    list_display = ['lead', 'timeout_type', 'timeout_duration', 'responsible_person', 'is_handled', 'created_at']
    list_filter = ['timeout_type', 'is_handled', 'responsible_person']
    search_fields = ['reason']
    raw_id_fields = ['lead', 'responsible_person', 'handled_by']
    ordering = ['-created_at']
