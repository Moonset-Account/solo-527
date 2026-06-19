from django.contrib import admin
from .models import Volunteer, VolunteerRoute, VolunteerAssignment


@admin.register(Volunteer)
class VolunteerAdmin(admin.ModelAdmin):
    list_display = [
        'volunteer_id', 'full_name', 'phone', 'community',
        'status', 'total_service_hours', 'service_count', 'rating'
    ]
    list_filter = ['status', 'user__community', 'is_test_data']
    search_fields = ['volunteer_id', 'user__first_name', 'user__last_name', 'user__phone', 'skills']
    fieldsets = (
        ('基本信息', {
            'fields': ('user', 'volunteer_id', 'status', 'join_date')
        }),
        ('能力和时间', {
            'fields': ('skills', 'available_time', 'service_areas')
        }),
        ('统计', {
            'fields': ('total_service_hours', 'service_count', 'rating')
        }),
        ('联系人', {
            'fields': ('emergency_contact', 'emergency_phone', 'remark')
        }),
        ('其他', {
            'fields': ('is_test_data',)
        })
    )
    readonly_fields = ('total_service_hours', 'service_count', 'rating')

    def full_name(self, obj):
        return obj.user.get_full_name()

    def phone(self, obj):
        return obj.user.phone

    def community(self, obj):
        return obj.user.community

    full_name.short_description = '姓名'
    phone.short_description = '电话'
    community.short_description = '社区'


@admin.register(VolunteerRoute)
class VolunteerRouteAdmin(admin.ModelAdmin):
    list_display = [
        'name', 'community', 'start_point', 'end_point',
        'estimated_duration', 'required_volunteers', 'is_active'
    ]
    list_filter = ['community', 'is_active', 'is_test_data']
    search_fields = ['name', 'description', 'start_point', 'end_point']
    fieldsets = (
        ('基本信息', {
            'fields': ('name', 'description', 'community', 'is_active')
        }),
        ('路线信息', {
            'fields': (
                'start_point', 'end_point', 'waypoints',
                'estimated_duration', 'distance', 'waypoints_count'
            )
        }),
        ('配置', {
            'fields': ('estimated_people_count', 'required_volunteers')
        }),
        ('其他', {
            'fields': ('is_test_data',)
        })
    )


@admin.register(VolunteerAssignment)
class VolunteerAssignmentAdmin(admin.ModelAdmin):
    list_display = [
        'volunteer_name', 'route_name', 'scheduled_date',
        'scheduled_start_time', 'status', 'actual_duration', 'rating'
    ]
    list_filter = ['status', 'scheduled_date', 'is_test_data']
    search_fields = [
        'volunteer__user__first_name', 'volunteer__user__last_name',
        'route__name'
    ]
    date_hierarchy = 'scheduled_date'
    fieldsets = (
        ('基本信息', {
            'fields': ('volunteer', 'route', 'status')
        }),
        ('计划时间', {
            'fields': ('scheduled_date', 'scheduled_start_time', 'scheduled_end_time')
        }),
        ('实际时间', {
            'fields': ('actual_start_time', 'actual_end_time', 'actual_duration')
        }),
        ('反馈', {
            'fields': ('check_ins', 'issues_found', 'feedback', 'rating')
        }),
        ('其他', {
            'fields': ('is_test_data',)
        })
    )
    readonly_fields = ('actual_start_time', 'actual_end_time', 'actual_duration')

    def volunteer_name(self, obj):
        return obj.volunteer.user.get_full_name()

    def route_name(self, obj):
        return obj.route.name

    volunteer_name.short_description = '志愿者'
    route_name.short_description = '路线'
