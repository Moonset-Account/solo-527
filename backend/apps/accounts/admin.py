from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import Organization, User


@admin.register(Organization)
class OrganizationAdmin(admin.ModelAdmin):
    list_display = ('name', 'code', 'is_active', 'created_at')
    search_fields = ('name', 'code')
    list_filter = ('is_active',)


@admin.register(User)
class UserAdmin(UserAdmin):
    list_display = ('username', 'name', 'organization', 'role', 'is_admin', 'is_active')
    list_filter = ('role', 'is_admin', 'is_active', 'organization')
    search_fields = ('username', 'name', 'email')
    fieldsets = UserAdmin.fieldsets + (
        ('扩展信息', {'fields': ('organization', 'name', 'phone', 'role', 'is_admin')}),
    )
