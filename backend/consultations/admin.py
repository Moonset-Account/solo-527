from django.contrib import admin
from .models import ConsultationRecord, ConsultationAttachment, TreatmentItem, ConsultationTreatmentItem


@admin.register(TreatmentItem)
class TreatmentItemAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'price', 'duration_minutes', 'is_active']
    list_filter = ['category', 'is_active']
    search_fields = ['name', 'description']


@admin.register(ConsultationRecord)
class ConsultationRecordAdmin(admin.ModelAdmin):
    list_display = ['customer', 'consultation_type', 'intention_level', 'consultation_doctor', 'estimated_price', 'created_at']
    list_filter = ['consultation_type', 'intention_level']
    search_fields = ['customer__name', 'chief_complaint', 'diagnosis']
    raw_id_fields = ['customer', 'lead', 'consultation_doctor', 'consultant', 'created_by']
    ordering = ['-created_at']


@admin.register(ConsultationAttachment)
class ConsultationAttachmentAdmin(admin.ModelAdmin):
    list_display = ['file_name', 'consultation', 'uploaded_by', 'created_at']
    search_fields = ['file_name', 'description']
    raw_id_fields = ['consultation', 'uploaded_by']


@admin.register(ConsultationTreatmentItem)
class ConsultationTreatmentItemAdmin(admin.ModelAdmin):
    list_display = ['treatment_item', 'consultation', 'quantity', 'unit_price', 'discount', 'subtotal']
    list_filter = ['treatment_item__category']
    raw_id_fields = ['consultation', 'treatment_item']
