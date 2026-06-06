from django.contrib import admin
from .models import Role, UserProfile, Staff, StaffShift

@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ['name', 'description']

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'role', 'store', 'region', 'phone']
    list_filter = ['role', 'region']
    search_fields = ['user__username', 'user__email']

@admin.register(Staff)
class StaffAdmin(admin.ModelAdmin):
    list_display = ['name', 'store', 'position', 'is_active']
    list_filter = ['store', 'is_active', 'position']
    search_fields = ['name', 'phone']

@admin.register(StaffShift)
class StaffShiftAdmin(admin.ModelAdmin):
    list_display = ['staff', 'store', 'shift_type', 'shift_date', 'start_time', 'end_time']
    list_filter = ['shift_type', 'shift_date', 'store']
    search_fields = ['staff__name']
