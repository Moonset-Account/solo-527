from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ['username', 'first_name', 'last_name', 'role', 'community', 'is_active_resident']
    list_filter = ['role', 'community', 'building', 'is_active_resident']
    search_fields = ['username', 'first_name', 'last_name', 'phone', 'id_card']
    fieldsets = UserAdmin.fieldsets + (
        ('额外信息', {
            'fields': (
                'role', 'phone', 'avatar', 'address', 'community',
                'building', 'unit', 'room_number', 'id_card',
                'is_active_resident', 'qualification_remark',
                'is_test_data'
            )
        }),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('额外信息', {
            'fields': (
                'role', 'phone', 'avatar', 'address', 'community',
                'building', 'unit', 'room_number', 'id_card',
                'is_active_resident', 'is_test_data'
            )
        }),
    )
