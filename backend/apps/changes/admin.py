from django.contrib import admin
from .models import ChangeWindow, ChangeLog


@admin.register(ChangeWindow)
class ChangeWindowAdmin(admin.ModelAdmin):
    list_display = ('code', 'name', 'change_type', 'status', 'start_time', 'end_time', 'organization')
    list_filter = ('status', 'change_type', 'organization')
    search_fields = ('code', 'name', 'description')


@admin.register(ChangeLog)
class ChangeLogAdmin(admin.ModelAdmin):
    list_display = ('change_window', 'action', 'is_failure', 'operator', 'operated_at')
    list_filter = ('action', 'is_failure')
    search_fields = ('change_window__code', 'detail', 'failure_reason')
