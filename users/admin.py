from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Role


@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ['name', 'display_name', 'description']
    filter_horizontal = ['groups', 'permissions']


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['username', 'email', 'role', 'department', 'is_staff', 'is_active']
    list_filter = ['role', 'is_staff', 'is_active']
    fieldsets = BaseUserAdmin.fieldsets + (
        ('扩展信息', {'fields': ('role', 'phone', 'department')}),
    )
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('扩展信息', {'fields': ('role', 'phone', 'department')}),
    )
    search_fields = ['username', 'email', 'first_name', 'last_name']
