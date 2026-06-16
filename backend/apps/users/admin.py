from django.contrib import admin
from .models import User, RoleConfig, RoleConfigHistory


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ['username', 'real_name', 'role', 'student_id', 'dorm_building', 'dorm_room', 'is_verified', 'is_active']
    list_filter = ['role', 'is_verified', 'is_active', 'dorm_building']
    search_fields = ['username', 'real_name', 'student_id', 'phone']
    fieldsets = (
        ('基本信息', {'fields': ('username', 'password', 'real_name', 'role', 'phone', 'student_id', 'avatar')}),
        ('宿舍信息', {'fields': ('dorm_building', 'dorm_room')}),
        ('权限', {'fields': ('is_verified', 'is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('时间', {'fields': ('last_login', 'date_joined')}),
    )
    readonly_fields = ['last_login', 'date_joined']


@admin.register(RoleConfig)
class RoleConfigAdmin(admin.ModelAdmin):
    list_display = ['role', 'is_active', 'updated_at']
    list_filter = ['role', 'is_active']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(RoleConfigHistory)
class RoleConfigHistoryAdmin(admin.ModelAdmin):
    list_display = ['role_config', 'changed_by', 'changed_at']
    list_filter = ['changed_at']
    readonly_fields = ['changed_at']
