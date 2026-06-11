from django.contrib import admin
from .models import Prompt, PromptCategory, PromptTemplate


@admin.register(PromptCategory)
class PromptCategoryAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'parent', 'sort_order', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('name', 'description')
    readonly_fields = ('created_at',)


@admin.register(Prompt)
class PromptAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'version', 'category', 'author', 'status', 'is_current_version', 'gray_scale_percent', 'accuracy_rate', 'usage_count', 'created_at')
    list_filter = ('status', 'is_current_version', 'category', 'created_at')
    search_fields = ('title', 'content', 'description', 'version')
    readonly_fields = ('created_at', 'updated_at', 'usage_count', 'accuracy_rate')


@admin.register(PromptTemplate)
class PromptTemplateAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'created_at', 'updated_at')
    search_fields = ('name',)
    readonly_fields = ('created_at', 'updated_at')
