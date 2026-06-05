from django.contrib import admin
from .models import TrainingCourse, TrainingSession, TrainingApplication, TrainingCertification


class TrainingSessionInline(admin.TabularInline):
    model = TrainingSession
    extra = 0
    fields = ('start_time', 'end_time', 'trainer', 'location', 'max_participants', 'current_participants')


@admin.register(TrainingCourse)
class TrainingCourseAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'status', 'duration_hours', 'max_participants', 'created_at')
    list_filter = ('status', 'category')
    search_fields = ('name', 'description')
    inlines = [TrainingSessionInline]
    readonly_fields = ('created_at', 'updated_at')
    fieldsets = (
        ('基本信息', {'fields': ('name', 'category', 'cover_image')}),
        ('详情', {'fields': ('description', 'prerequisites', 'materials')}),
        ('配置', {'fields': ('duration_hours', 'max_participants', 'status')}),
        ('元数据', {'fields': ('created_at', 'updated_at', 'created_by', 'updated_by')}),
    )


@admin.register(TrainingSession)
class TrainingSessionAdmin(admin.ModelAdmin):
    list_display = ('course', 'trainer', 'start_time', 'end_time', 'location', 'current_participants', 'is_full')
    list_filter = ('course', 'trainer', 'start_time')
    search_fields = ('course__name', 'trainer__real_name', 'location')
    date_hierarchy = 'start_time'
    readonly_fields = ('created_at', 'updated_at')


@admin.register(TrainingApplication)
class TrainingApplicationAdmin(admin.ModelAdmin):
    list_display = ('session', 'user', 'status', 'created_at', 'reviewed_at')
    list_filter = ('status', 'created_at')
    search_fields = ('user__real_name', 'session__course__name')
    readonly_fields = ('created_at', 'updated_at', 'reviewed_at')
    fieldsets = (
        ('申请信息', {'fields': ('session', 'user', 'application_notes')}),
        ('审核', {'fields': ('status', 'review_notes', 'reviewed_by', 'reviewed_at')}),
        ('元数据', {'fields': ('created_at', 'updated_at')}),
    )


@admin.register(TrainingCertification)
class TrainingCertificationAdmin(admin.ModelAdmin):
    list_display = ('user', 'course', 'category', 'certificate_number', 'status', 'issued_date', 'expiry_date')
    list_filter = ('status', 'category', 'issued_date')
    search_fields = ('user__real_name', 'course__name', 'certificate_number')
    readonly_fields = ('created_at', 'updated_at')
    fieldsets = (
        ('证书信息', {'fields': ('user', 'course', 'category', 'certificate_number', 'certificate_file')}),
        ('详情', {'fields': ('issued_date', 'expiry_date', 'issued_by', 'score', 'notes', 'status')}),
        ('元数据', {'fields': ('created_at', 'updated_at')}),
    )
