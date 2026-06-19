from django.contrib import admin
from .models import PatrolRoute, PatrolTask, PatrolCheckIn, PatrolProcessRecord


class PatrolProcessRecordInline(admin.TabularInline):
    model = PatrolProcessRecord
    extra = 0
    fields = ['content', 'status_change', 'processed_by', 'processed_at', 'remark']
    readonly_fields = ['processed_at']


class PatrolCheckInInline(admin.TabularInline):
    model = PatrolCheckIn
    extra = 0
    fields = ['checkpoint_name', 'location', 'volunteer', 'check_in_time', 'has_issue']
    readonly_fields = ['check_in_time']


@admin.register(PatrolRoute)
class PatrolRouteAdmin(admin.ModelAdmin):
    list_display = ['name', 'community', 'start_point', 'end_point', 'estimated_duration', 'is_active']
    list_filter = ['community', 'is_active', 'is_test_data']
    search_fields = ['name', 'description', 'start_point', 'end_point']
    fieldsets = (
        ('基本信息', {
            'fields': ('name', 'description', 'community')
        }),
        ('路线信息', {
            'fields': ('start_point', 'end_point', 'waypoints', 'estimated_duration', 'distance')
        }),
        ('其他', {
            'fields': ('is_active', 'is_test_data')
        })
    )


@admin.register(PatrolTask)
class PatrolTaskAdmin(admin.ModelAdmin):
    list_display = [
        'title', 'status', 'priority', 'route_name',
        'assigned_to_name', 'scheduled_start_time', 'community'
    ]
    list_filter = [
        'status', 'priority', 'community', 'route',
        'assigned_to', 'is_test_data'
    ]
    search_fields = ['title', 'description', 'community']
    inlines = [PatrolProcessRecordInline, PatrolCheckInInline]
    fieldsets = (
        ('基本信息', {
            'fields': ('title', 'description', 'priority', 'status', 'community')
        }),
        ('路线和人员', {
            'fields': ('route', 'assigned_to', 'checkpoints', 'requirements')
        }),
        ('时间', {
            'fields': (
                'scheduled_start_time', 'scheduled_end_time',
                'actual_start_time', 'actual_end_time'
            )
        }),
        ('其他', {
            'fields': ('is_test_data',)
        })
    )

    def route_name(self, obj):
        return obj.route.name if obj.route else '-'

    def assigned_to_name(self, obj):
        return obj.assigned_to.get_full_name() if obj.assigned_to else '-'

    route_name.short_description = '路线'
    assigned_to_name.short_description = '执行人'


@admin.register(PatrolCheckIn)
class PatrolCheckInAdmin(admin.ModelAdmin):
    list_display = [
        'task', 'volunteer_name', 'checkpoint_name',
        'location', 'check_in_time', 'has_issue'
    ]
    list_filter = ['has_issue', 'check_in_time', 'is_test_data']
    search_fields = ['checkpoint_name', 'location', 'volunteer__first_name', 'task__title']
    date_hierarchy = 'check_in_time'

    def volunteer_name(self, obj):
        return obj.volunteer.get_full_name()

    volunteer_name.short_description = '志愿者'


@admin.register(PatrolProcessRecord)
class PatrolProcessRecordAdmin(admin.ModelAdmin):
    list_display = ['task', 'content', 'status_change', 'processed_by', 'processed_at']
    list_filter = ['status_change', 'processed_by', 'processed_at']
    search_fields = ['task__title', 'content', 'remark']
    date_hierarchy = 'processed_at'
