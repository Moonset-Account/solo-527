from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ['username', 'role', 'phone', 'is_active']
    list_filter = ['role', 'is_active']
    search_fields = ['username', 'phone']
    fieldsets = UserAdmin.fieldsets + (
        ('角色信息', {'fields': ('role', 'phone', 'avatar')}),
    )
