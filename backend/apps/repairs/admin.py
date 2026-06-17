from django.contrib import admin
from .models import Repair, RepairPhoto, RepairNote


@admin.register(Repair)
class RepairAdmin(admin.ModelAdmin):
    list_display = ('code', 'title', 'project', 'priority', 'status', 'reporter_name', 'created_at')
    list_filter = ('category', 'priority', 'status', 'created_at')
    search_fields = ('code', 'title', 'reporter_name', 'reporter_phone')
    date_hierarchy = 'created_at'


@admin.register(RepairPhoto)
class RepairPhotoAdmin(admin.ModelAdmin):
    list_display = ('repair', 'title', 'created_at')


@admin.register(RepairNote)
class RepairNoteAdmin(admin.ModelAdmin):
    list_display = ('repair', 'created_by', 'created_at')
