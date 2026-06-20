from django.contrib import admin
from .models import DictionaryCategory, DictionaryItem


@admin.register(DictionaryCategory)
class DictionaryCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'code', 'organization', 'created_at')
    list_filter = ('organization',)
    search_fields = ('name', 'code')


@admin.register(DictionaryItem)
class DictionaryItemAdmin(admin.ModelAdmin):
    list_display = ('category', 'name', 'code', 'value', 'is_active', 'sort_order')
    list_filter = ('category', 'organization', 'is_active')
    search_fields = ('name', 'code', 'value')
