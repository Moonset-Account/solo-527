from django.contrib import admin
from django.utils.html import format_html
from .models import ChronicDisease, PatientProfile


@admin.register(ChronicDisease)
class ChronicDiseaseAdmin(admin.ModelAdmin):
    list_display = ['name', 'icd_code', 'is_active', 'created_at']
    list_filter = ['is_active']
    search_fields = ['name', 'icd_code', 'description']
    ordering = ['name']


@admin.register(PatientProfile)
class PatientProfileAdmin(admin.ModelAdmin):
    list_display = [
        'patient_no', 'name', 'gender', 'age_display', 'phone',
        'no_show_count', 'needs_confirmation_tag', 'is_active', 'created_at'
    ]
    list_filter = [
        'gender', 'marital_status', 'is_active', 'needs_confirmation',
        'chronic_diseases'
    ]
    search_fields = [
        'patient_no', 'name', 'id_card', 'phone', 'emergency_contact'
    ]
    filter_horizontal = ['chronic_diseases']
    readonly_fields = ['created_at', 'updated_at', 'created_by']
    fieldsets = (
        ('基本信息', {
            'fields': (
                'user', 'patient_no', 'name', 'gender', 'birth_date',
                'id_card', 'phone', 'marital_status'
            )
        }),
        ('联系信息', {
            'fields': ('emergency_contact', 'emergency_phone', 'address')
        }),
        ('健康信息', {
            'fields': (
                'chronic_diseases', 'allergies', 'medical_history',
                'height', 'weight', 'blood_type'
            )
        }),
        ('状态信息', {
            'fields': ('is_active', 'no_show_count', 'needs_confirmation')
        }),
        ('系统信息', {
            'fields': ('created_at', 'updated_at', 'created_by'),
            'classes': ('collapse',)
        }),
    )

    def age_display(self, obj):
        return f'{obj.age}岁'
    age_display.short_description = '年龄'

    def needs_confirmation_tag(self, obj):
        if obj.needs_confirmation:
            return format_html(
                '<span style="color: red; font-weight: bold;">需要确认</span>'
            )
        return '-'
    needs_confirmation_tag.short_description = '电话确认'

    def save_model(self, request, obj, form, change):
        if not change:
            obj.created_by = request.user
        super().save_model(request, obj, form, change)

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.role == 'DOCTOR':
            return qs.filter(
                appointments__doctor__user=request.user
            ).distinct()
        return qs
