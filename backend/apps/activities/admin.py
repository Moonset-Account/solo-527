from django.contrib import admin
from .models import Activity, ActivityRegistration, ActivityWaitlistNotification


@admin.register(Activity)
class ActivityAdmin(admin.ModelAdmin):
    list_display = ['title', 'activity_type', 'status', 'location', 'start_time', 'end_time', 'max_participants', 'registered_count']
    list_filter = ['activity_type', 'status', 'themes']
    search_fields = ['title', 'description']


@admin.register(ActivityRegistration)
class ActivityRegistrationAdmin(admin.ModelAdmin):
    list_display = ['id', 'activity', 'family', 'child', 'status', 'waitlist_position', 'registered_at']
    list_filter = ['status']
    search_fields = ['activity__title', 'family__name', 'child__name']


@admin.register(ActivityWaitlistNotification)
class ActivityWaitlistNotificationAdmin(admin.ModelAdmin):
    list_display = ['id', 'registration', 'notification_type', 'sent_at', 'read_at']
    list_filter = ['notification_type']
