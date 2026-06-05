from django.contrib import admin
from .models import SafetyIncident, SafetyAttachment, SafetyInspection, SafetyTrainingRecord


class SafetyAttachmentInline(admin.TabularInline):
    model = SafetyAttachment
    extra = 0
    readonly_fields = ('file_name', 'uploaded_by', 'uploaded_at')
    can_delete = False


@admin.register(SafetyIncident)
class SafetyIncidentAdmin(admin.ModelAdmin):
    list_display = ('title', 'reporter', 'equipment', 'severity', 'status', 'incident_time', 'location')
    list_filter = ('severity', 'status', 'incident_time')
    search_fields = ('title', 'description', 'reporter__real_name', 'equipment__name')
    date_hierarchy = 'incident_time'
    readonly_fields = ('created_at', 'updated_at', 'resolved_at', 'closed_at')
    fieldsets = (
        ('基本信息', {'fields': ('title', 'reporter', 'equipment')}),
        ('事件详情', {'fields': ('description', 'incident_time', 'location', 'severity', 'status')}),
        ('人员', {'fields': ('involved_people', 'injuries')}),
        ('处理', {'fields': (
            'immediate_actions', 'root_cause', 'corrective_actions',
            'preventive_measures', 'investigated_by', 'resolved_at', 'closed_at'
        )}),
        ('元数据', {'fields': ('created_at', 'updated_at', 'created_by', 'updated_by')}),
    )
    inlines = [SafetyAttachmentInline]


@admin.register(SafetyInspection)
class SafetyInspectionAdmin(admin.ModelAdmin):
    list_display = ('title', 'scheduled_date', 'status', 'performed_by', 'performed_date')
    list_filter = ('status', 'scheduled_date')
    search_fields = ('title', 'description', 'findings', 'recommendations')
    date_hierarchy = 'scheduled_date'
    readonly_fields = ('created_at', 'updated_at')
    fieldsets = (
        ('基本信息', {'fields': ('title', 'description')}),
        ('时间', {'fields': ('scheduled_date', 'performed_date', 'performed_by')}),
        ('结果', {'fields': ('status', 'findings', 'recommendations', 'follow_up_date')}),
        ('元数据', {'fields': ('created_at', 'updated_at', 'created_by', 'updated_by')}),
    )


@admin.register(SafetyTrainingRecord)
class SafetyTrainingRecordAdmin(admin.ModelAdmin):
    list_display = ('user', 'title', 'training_date', 'trainer', 'passed', 'expiry_date')
    list_filter = ('passed', 'training_date')
    search_fields = ('user__real_name', 'title', 'trainer', 'certificate_number')
    date_hierarchy = 'training_date'
    readonly_fields = ('created_at', 'updated_at')
    fieldsets = (
        ('基本信息', {'fields': ('user', 'title', 'description')}),
        ('培训详情', {'fields': ('training_date', 'trainer', 'duration_hours', 'passed')}),
        ('证书', {'fields': ('certificate_number', 'expiry_date', 'notes')}),
        ('元数据', {'fields': ('created_at', 'updated_at', 'created_by', 'updated_by')}),
    )
