from django.contrib import admin
from .models import RepairRecord, RepairPhoto, RepairProgressLog


@admin.register(RepairRecord)
class RepairRecordAdmin(admin.ModelAdmin):
    list_display = ['id', 'book_copy', 'damage_type', 'status', 'priority', 'reported_by', 'assigned_to', 'reported_at', 'completed_at']
    list_filter = ['status', 'damage_type', 'priority']
    search_fields = ['book_copy__book__title', 'book_copy__barcode']


@admin.register(RepairPhoto)
class RepairPhotoAdmin(admin.ModelAdmin):
    list_display = ['id', 'repair_record', 'stage', 'uploaded_by', 'uploaded_at']
    list_filter = ['stage']


@admin.register(RepairProgressLog)
class RepairProgressLogAdmin(admin.ModelAdmin):
    list_display = ['id', 'repair_record', 'status', 'created_by', 'created_at']
    list_filter = ['status']
