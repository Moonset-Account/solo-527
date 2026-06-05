from django.contrib import admin
from .models import (
    Project, MaterialType, Material, MaterialVersion,
    ReviewClause, ReviewComment, ReviewAssignment,
    Resubmission, ExportLog
)


class MaterialInline(admin.TabularInline):
    model = Material
    extra = 0
    readonly_fields = ['material_type', 'current_version']
    can_delete = False
    max_num = 0


class MaterialVersionInline(admin.TabularInline):
    model = MaterialVersion
    extra = 0
    readonly_fields = ['version_number', 'title', 'uploader', 'created_at', 'is_archived']
    fields = ['version_number', 'title', 'file', 'description', 'uploader', 'created_at', 'is_archived']


class ReviewCommentInline(admin.TabularInline):
    model = ReviewComment
    extra = 0
    readonly_fields = ['reviewer', 'material_version', 'created_at']
    fields = ['clause', 'content', 'status', 'reviewer', 'material_version', 'created_at']


class ReviewAssignmentInline(admin.TabularInline):
    model = ReviewAssignment
    extra = 0
    readonly_fields = ['assigned_at']
    filter_horizontal = ['material_types']


class ResubmissionInline(admin.TabularInline):
    model = Resubmission
    extra = 0
    readonly_fields = ['submitter', 'material_version', 'submitted_at']
    filter_horizontal = ['addressed_comments']


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ['project_code', 'title', 'principal_investigator', 'status', 'created_at', 'archived_at']
    list_filter = ['status', 'department', 'created_at']
    search_fields = ['title', 'project_code', 'principal_investigator__first_name', 'principal_investigator__last_name']
    readonly_fields = ['created_at', 'updated_at', 'submitted_at', 'archived_at']
    filter_horizontal = ['researchers']
    inlines = [MaterialInline, ReviewAssignmentInline, ReviewCommentInline, ResubmissionInline]
    fieldsets = (
        ('基本信息', {
            'fields': ('project_code', 'title', 'principal_investigator', 'researchers', 'department')
        }),
        ('课题详情', {
            'fields': ('description', 'status')
        }),
        ('时间信息', {
            'fields': ('created_at', 'updated_at', 'submitted_at', 'archived_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(MaterialType)
class MaterialTypeAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'is_required', 'sort_order']
    list_editable = ['is_required', 'sort_order']
    search_fields = ['name', 'code']


@admin.register(Material)
class MaterialAdmin(admin.ModelAdmin):
    list_display = ['project', 'material_type', 'current_version', 'updated_at']
    list_filter = ['material_type']
    search_fields = ['project__title', 'project__project_code']
    inlines = [MaterialVersionInline]
    readonly_fields = ['created_at', 'updated_at']


@admin.register(MaterialVersion)
class MaterialVersionAdmin(admin.ModelAdmin):
    list_display = ['material', 'version_number', 'title', 'uploader', 'is_archived', 'created_at']
    list_filter = ['is_archived', 'created_at']
    search_fields = ['material__project__title', 'material__project__project_code', 'title']
    readonly_fields = ['version_number', 'created_at']


@admin.register(ReviewClause)
class ReviewClauseAdmin(admin.ModelAdmin):
    list_display = ['clause_number', 'title', 'category', 'sort_order']
    list_filter = ['category']
    search_fields = ['clause_number', 'title', 'content']
    list_editable = ['sort_order']


@admin.register(ReviewComment)
class ReviewCommentAdmin(admin.ModelAdmin):
    list_display = ['project', 'clause', 'reviewer', 'status', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['project__title', 'project__project_code', 'content']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(ReviewAssignment)
class ReviewAssignmentAdmin(admin.ModelAdmin):
    list_display = ['project', 'committee_member', 'assigned_at', 'completed_at']
    list_filter = ['assigned_at', 'completed_at']
    search_fields = ['project__title', 'committee_member__first_name', 'committee_member__last_name']
    filter_horizontal = ['material_types']
    readonly_fields = ['assigned_at']


@admin.register(Resubmission)
class ResubmissionAdmin(admin.ModelAdmin):
    list_display = ['project', 'submitter', 'material_version', 'submitted_at']
    list_filter = ['submitted_at']
    search_fields = ['project__title', 'response_note']
    filter_horizontal = ['addressed_comments']
    readonly_fields = ['submitted_at']


@admin.register(ExportLog)
class ExportLogAdmin(admin.ModelAdmin):
    list_display = ['export_type', 'user', 'file_name', 'exported_at']
    list_filter = ['export_type', 'exported_at']
    search_fields = ['file_name', 'user__first_name', 'user__last_name']
    readonly_fields = ['exported_at']
