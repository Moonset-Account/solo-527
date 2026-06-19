from django.contrib import admin
from .models import Task, TaskProcessRecord


class TaskProcessRecordInline(admin.TabularInline):
    model = TaskProcessRecord
    extra = 0
    fields = ['content', 'status_change', 'processed_by', 'processed_at', 'remark']
    readonly_fields = ['processed_at']


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = [
        'title', 'type', 'priority', 'status',
        'assigned_to_name', 'deadline', 'created_at', 'community'
    ]
    list_filter = [
        'type', 'priority', 'status', 'community',
        'source', 'is_test_data'
    ]
    search_fields = ['title', 'description', 'assigned_to__first_name']
    inlines = [TaskProcessRecordInline]
    fieldsets = (
        ('基本信息', {
            'fields': ('title', 'description', 'type', 'priority', 'status', 'community')
        }),
        ('人员和时间', {
            'fields': ('assigned_to', 'deadline', 'completed_at')
        }),
        ('关联信息', {
            'fields': ('source', 'source_id', 'related_resident')
        }),
        ('其他', {
            'fields': ('is_test_data',)
        })
    )

    def assigned_to_name(self, obj):
        return obj.assigned_to.get_full_name() if obj.assigned_to else '-'

    assigned_to_name.short_description = '负责人'


@admin.register(TaskProcessRecord)
class TaskProcessRecordAdmin(admin.ModelAdmin):
    list_display = ['task', 'content', 'status_change', 'processed_by', 'processed_at']
    list_filter = ['status_change', 'processed_by', 'processed_at']
    search_fields = ['task__title', 'content', 'remark']
    date_hierarchy = 'processed_at'
