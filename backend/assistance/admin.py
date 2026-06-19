from django.contrib import admin
from .models import AssistanceDemand, AssistanceProgress, AssistanceProcessRecord


class AssistanceProcessRecordInline(admin.TabularInline):
    model = AssistanceProcessRecord
    extra = 0
    fields = ['content', 'status_change', 'processed_by', 'processed_at', 'remark']
    readonly_fields = ['processed_at']


class AssistanceProgressInline(admin.TabularInline):
    model = AssistanceProgress
    extra = 0
    fields = ['content', 'status', 'processed_by', 'processed_at', 'satisfaction', 'remark']
    readonly_fields = ['processed_at']


@admin.register(AssistanceDemand)
class AssistanceDemandAdmin(admin.ModelAdmin):
    list_display = [
        'title', 'type', 'priority', 'status',
        'resident_name', 'assigned_to_name', 'created_at', 'community'
    ]
    list_filter = [
        'type', 'priority', 'status', 'community',
        'household_type', 'is_test_data'
    ]
    search_fields = ['title', 'description', 'contact_phone', 'resident__user__first_name']
    inlines = [AssistanceProcessRecordInline, AssistanceProgressInline]
    fieldsets = (
        ('基本信息', {
            'fields': ('title', 'description', 'type', 'priority', 'status', 'community')
        }),
        ('人员', {
            'fields': ('resident', 'assigned_to', 'contact_phone', 'contact_address')
        }),
        ('时间', {
            'fields': (
                'preferred_time', 'estimated_duration',
                'start_time', 'end_time',
                'actual_start_time', 'actual_end_time'
            )
        }),
        ('其他', {
            'fields': ('household_type', 'special_requirements', 'is_test_data')
        })
    )

    def resident_name(self, obj):
        return obj.resident.user.get_full_name()

    def assigned_to_name(self, obj):
        return obj.assigned_to.get_full_name() if obj.assigned_to else '-'

    resident_name.short_description = '申请人'
    assigned_to_name.short_description = '帮扶人'


@admin.register(AssistanceProgress)
class AssistanceProgressAdmin(admin.ModelAdmin):
    list_display = [
        'assistance', 'resident_name', 'content', 'status',
        'processed_by', 'processed_at', 'satisfaction'
    ]
    list_filter = ['status', 'processed_by', 'processed_at', 'satisfaction']
    search_fields = ['assistance__title', 'resident__user__first_name', 'content']
    date_hierarchy = 'processed_at'

    def resident_name(self, obj):
        return obj.resident.user.get_full_name()

    resident_name.short_description = '居民'


@admin.register(AssistanceProcessRecord)
class AssistanceProcessRecordAdmin(admin.ModelAdmin):
    list_display = ['assistance', 'content', 'status_change', 'processed_by', 'processed_at']
    list_filter = ['status_change', 'processed_by', 'processed_at']
    search_fields = ['assistance__title', 'content', 'remark']
    date_hierarchy = 'processed_at'
