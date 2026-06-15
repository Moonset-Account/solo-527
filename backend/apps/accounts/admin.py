from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.translation import gettext_lazy as _

from .models import User, StaffProfile, MemberProfile, Vehicle


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['username', 'get_role_display', 'phone', 'is_staff', 'is_active', 'is_demo', 'created_at']
    list_filter = ['role', 'is_staff', 'is_active', 'is_demo', 'created_at']
    search_fields = ['username', 'phone', 'email']
    ordering = ['-created_at']
    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        (_('个人信息'), {'fields': ('first_name', 'last_name', 'email', 'phone', 'avatar')}),
        (_('权限信息'), {'fields': ('role', 'is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        (_('系统信息'), {'fields': ('is_demo', 'created_at', 'updated_at')}),
    )
    readonly_fields = ['created_at', 'updated_at']
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'password1', 'password2', 'role', 'phone'),
        }),
    )


@admin.register(StaffProfile)
class StaffProfileAdmin(admin.ModelAdmin):
    list_display = ['employee_id', 'user', 'department', 'position', 'hire_date']
    list_filter = ['department', 'position', 'hire_date']
    search_fields = ['employee_id', 'user__username', 'user__phone']
    ordering = ['employee_id']
    raw_id_fields = ['user']


@admin.register(MemberProfile)
class MemberProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'gender', 'birthday', 'level', 'total_consumption', 'current_points', 'referrer']
    list_filter = ['gender', 'level', 'birthday']
    search_fields = ['user__username', 'user__phone']
    ordering = ['-total_consumption']
    raw_id_fields = ['user', 'referrer']
    readonly_fields = ['total_consumption', 'total_points', 'current_points']


@admin.register(Vehicle)
class VehicleAdmin(admin.ModelAdmin):
    list_display = ['plate_number', 'member', 'brand', 'model', 'color', 'is_default', 'created_at']
    list_filter = ['brand', 'color', 'is_default', 'created_at']
    search_fields = ['plate_number', 'brand', 'model', 'member__username', 'member__phone']
    ordering = ['-is_default', '-created_at']
    raw_id_fields = ['member']
