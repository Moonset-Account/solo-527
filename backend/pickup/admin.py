from django.contrib import admin
from .models import PickupRecord


@admin.register(PickupRecord)
class PickupRecordAdmin(admin.ModelAdmin):
    list_display = ['child', 'direction', 'status', 'actual_person_name', 'pickup_time', 'verified_by']
    list_filter = ['direction', 'status', 'pickup_time']
    search_fields = ['child__name', 'actual_person_name']
