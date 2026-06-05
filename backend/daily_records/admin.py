from django.contrib import admin
from .models import DailyRecord, GrowthPhoto


@admin.register(DailyRecord)
class DailyRecordAdmin(admin.ModelAdmin):
    list_display = ['child', 'date', 'mood', 'appetite', 'recorded_by']
    list_filter = ['date', 'mood', 'appetite']
    search_fields = ['child__name']


@admin.register(GrowthPhoto)
class GrowthPhotoAdmin(admin.ModelAdmin):
    list_display = ['record', 'caption', 'uploaded_by', 'created_at']
