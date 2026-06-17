from django.contrib import admin
from .models import KnowledgeItem, KnowledgeQuery


@admin.register(KnowledgeItem)
class KnowledgeItemAdmin(admin.ModelAdmin):
    list_display = ['title', 'category', 'status', 'is_tutorial',
                    'view_count', 'hit_count', 'helpful_count',
                    'published_at', 'created_at']
    list_filter = ['category', 'status', 'is_tutorial', 'created_at', 'published_at']
    search_fields = ['title', 'content', 'keywords', 'tags']
    date_hierarchy = 'created_at'
    readonly_fields = ['created_at', 'updated_at', 'view_count',
                       'hit_count', 'helpful_count', 'not_helpful_count', 'published_at']


@admin.register(KnowledgeQuery)
class KnowledgeQueryAdmin(admin.ModelAdmin):
    list_display = ['query_text', 'user', 'matched_item', 'match_score',
                    'is_helpful', 'has_reminder', 'source', 'created_at']
    list_filter = ['is_helpful', 'has_reminder', 'source', 'created_at']
    search_fields = ['query_text', 'source']
    date_hierarchy = 'created_at'
    readonly_fields = ['created_at', 'updated_at']
