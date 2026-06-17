from django.contrib import admin
from .models import Inspection, InspectionItem, InspectionPhoto


@admin.register(Inspection)
class InspectionAdmin(admin.ModelAdmin):
    list_display = ('project', 'title', 'type', 'result', 'inspector', 'inspection_date')
    list_filter = ('type', 'result', 'rectification_required', 'inspection_date')
    search_fields = ('title', 'project__name')
    date_hierarchy = 'inspection_date'


@admin.register(InspectionItem)
class InspectionItemAdmin(admin.ModelAdmin):
    list_display = ('inspection', 'name', 'result')
    list_filter = ('result',)


@admin.register(InspectionPhoto)
class InspectionPhotoAdmin(admin.ModelAdmin):
    list_display = ('inspection', 'title', 'is_issue', 'created_at')
