from django.contrib import admin
from .models import (
    MedicalRecordPermission, MedicalSummary,
    FollowUpRecord, Prescription, PrescriptionItem
)


class PrescriptionItemInline(admin.TabularInline):
    model = PrescriptionItem
    extra = 1
    fields = [
        'medication_name', 'specification', 'quantity',
        'unit', 'dosage', 'frequency', 'duration', 'sort_order'
    ]


@admin.register(MedicalRecordPermission)
class MedicalRecordPermissionAdmin(admin.ModelAdmin):
    list_display = [
        'patient', 'user', 'permission_level',
        'granted_by', 'is_active', 'expires_at'
    ]
    list_filter = ['permission_level', 'is_active']
    search_fields = ['patient__name', 'user__username']
    readonly_fields = ['created_at']
    autocomplete_fields = ['patient', 'user', 'granted_by']


@admin.register(MedicalSummary)
class MedicalSummaryAdmin(admin.ModelAdmin):
    list_display = ['patient', 'created_at', 'updated_at', 'last_updated_by']
    search_fields = ['patient__name', 'diagnosis', 'chief_complaint']
    readonly_fields = ['created_at', 'updated_at', 'created_by', 'last_updated_by']
    autocomplete_fields = ['patient']
    fieldsets = (
        ('患者信息', {
            'fields': ('patient',)
        }),
        ('病历内容', {
            'fields': (
                'chief_complaint', 'present_illness', 'past_illness',
                'family_history', 'personal_history', 'physical_exam',
                'auxiliary_exam', 'diagnosis', 'treatment_plan', 'notes'
            )
        }),
        ('系统信息', {
            'fields': ('created_at', 'updated_at', 'created_by', 'last_updated_by'),
            'classes': ('collapse',)
        }),
    )

    def save_model(self, request, obj, form, change):
        if not change:
            obj.created_by = request.user
        obj.last_updated_by = request.user
        super().save_model(request, obj, form, change)


@admin.register(FollowUpRecord)
class FollowUpRecordAdmin(admin.ModelAdmin):
    list_display = [
        'patient', 'doctor', 'visit_number', 'visit_date',
        'blood_pressure', 'blood_sugar', 'weight'
    ]
    list_filter = ['visit_date', 'doctor__department']
    search_fields = ['patient__name', 'doctor__name', 'symptoms', 'diagnosis']
    date_hierarchy = 'visit_date'
    readonly_fields = ['visit_number', 'created_at', 'updated_at', 'created_by']
    autocomplete_fields = ['followup_plan', 'appointment', 'patient', 'doctor']
    fieldsets = (
        ('基本信息', {
            'fields': ('followup_plan', 'appointment', 'patient', 'doctor', 'visit_date')
        }),
        ('随访记录', {
            'fields': (
                'symptoms', 'physical_exam', 'blood_pressure',
                'heart_rate', 'blood_sugar', 'weight', 'exam_results'
            )
        }),
        ('诊疗方案', {
            'fields': (
                'diagnosis', 'medication_adjustment',
                'lifestyle_advice', 'next_visit_date', 'notes'
            )
        }),
        ('系统信息', {
            'fields': ('visit_number', 'created_at', 'updated_at', 'created_by'),
            'classes': ('collapse',)
        }),
    )

    def save_model(self, request, obj, form, change):
        if not change:
            obj.created_by = request.user
        super().save_model(request, obj, form, change)


@admin.register(Prescription)
class PrescriptionAdmin(admin.ModelAdmin):
    list_display = [
        'prescription_no', 'patient', 'doctor',
        'status', 'created_at'
    ]
    list_filter = ['status', 'created_at', 'doctor__department']
    search_fields = ['prescription_no', 'patient__name', 'doctor__name']
    date_hierarchy = 'created_at'
    readonly_fields = ['prescription_no', 'created_at', 'created_by']
    autocomplete_fields = ['appointment', 'patient', 'doctor']
    inlines = [PrescriptionItemInline]
    fieldsets = (
        ('处方信息', {
            'fields': ('prescription_no', 'appointment', 'patient', 'doctor', 'status')
        }),
        ('医嘱', {
            'fields': ('notes',)
        }),
        ('系统信息', {
            'fields': ('created_at', 'created_by'),
            'classes': ('collapse',)
        }),
    )

    def save_model(self, request, obj, form, change):
        if not change:
            obj.created_by = request.user
        super().save_model(request, obj, form, change)
