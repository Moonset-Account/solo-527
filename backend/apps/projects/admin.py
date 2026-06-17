from django.contrib import admin
from .models import Project, ProjectPhoto, ProjectAttachment, ProjectNote, ChangeHistory


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ('code', 'name', 'status', 'client_name', 'project_manager', 'created_at')
    list_filter = ('status', 'project_manager')
    search_fields = ('name', 'code', 'client_name', 'address')
    date_hierarchy = 'created_at'


@admin.register(ProjectPhoto)
class ProjectPhotoAdmin(admin.ModelAdmin):
    list_display = ('project', 'title', 'uploaded_by', 'created_at')
    list_filter = ('created_at',)


@admin.register(ProjectAttachment)
class ProjectAttachmentAdmin(admin.ModelAdmin):
    list_display = ('project', 'name', 'uploaded_by', 'created_at')


@admin.register(ProjectNote)
class ProjectNoteAdmin(admin.ModelAdmin):
    list_display = ('project', 'created_by', 'created_at')


@admin.register(ChangeHistory)
class ChangeHistoryAdmin(admin.ModelAdmin):
    list_display = ('content_type', 'object_id', 'field_name', 'changed_by', 'changed_at')
    list_filter = ('content_type', 'changed_at')
