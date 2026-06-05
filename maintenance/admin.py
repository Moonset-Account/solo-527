from django.contrib import admin
from .models import FaultTicket, FaultAttachment, FaultComment, MaintenanceSchedule


class FaultAttachmentInline(admin.TabularInline):
    model = FaultAttachment
    extra = 0
    readonly_fields = ('file_name', 'uploaded_by', 'uploaded_at')
    can_delete = False


class FaultCommentInline(admin.TabularInline):
    model = FaultComment
    extra = 0
    readonly_fields = ('user', 'content', 'is_internal', 'created_at')
    can_delete = False


@admin.register(FaultTicket)
class FaultTicketAdmin(admin.ModelAdmin):
    list_display = ('title', 'equipment', 'reporter', 'priority', 'status', 'assignee', 'created_at')
    list_filter = ('status', 'priority', 'equipment', 'created_at')
    search_fields = ('title', 'description', 'reporter__real_name', 'equipment__name')
    date_hierarchy = 'created_at'
    readonly_fields = ('created_at', 'updated_at', 'resolved_at')
    fieldsets = (
        ('基本信息', {'fields': ('title', 'equipment', 'reporter', 'assignee')}),
        ('故障详情', {'fields': ('description', 'fault_type', 'priority', 'status')}),
        ('解决方案', {'fields': ('resolution', 'resolved_at', 'resolved_by')}),
        ('费用', {'fields': ('estimated_cost', 'actual_cost')}),
        ('元数据', {'fields': ('created_at', 'updated_at', 'created_by', 'updated_by')}),
    )
    inlines = [FaultAttachmentInline, FaultCommentInline]


@admin.register(MaintenanceSchedule)
class MaintenanceScheduleAdmin(admin.ModelAdmin):
    list_display = ('equipment', 'title', 'scheduled_date', 'is_completed', 'performed_by')
    list_filter = ('is_completed', 'scheduled_date')
    search_fields = ('title', 'equipment__name', 'notes')
    date_hierarchy = 'scheduled_date'
    readonly_fields = ('created_at', 'updated_at')
    fieldsets = (
        ('基本信息', {'fields': ('equipment', 'title', 'description')}),
        ('时间', {'fields': ('scheduled_date', 'performed_date', 'performed_by')}),
        ('状态', {'fields': ('is_completed', 'notes')}),
        ('元数据', {'fields': ('created_at', 'updated_at', 'created_by', 'updated_by')}),
    )
