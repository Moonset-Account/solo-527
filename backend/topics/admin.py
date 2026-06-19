from django.contrib import admin
from .models import Topic, TopicProcessRecord, TopicComment


class TopicProcessRecordInline(admin.TabularInline):
    model = TopicProcessRecord
    extra = 0
    fields = ['content', 'status_change', 'processed_by', 'processed_at', 'remark']
    readonly_fields = ['processed_at']


class TopicCommentInline(admin.TabularInline):
    model = TopicComment
    extra = 0
    fields = ['content', 'author', 'is_anonymous', 'created_at']
    readonly_fields = ['created_at']


@admin.register(Topic)
class TopicAdmin(admin.ModelAdmin):
    list_display = [
        'title', 'category', 'priority', 'status',
        'proposed_by_name', 'representative_name', 'community', 'created_at'
    ]
    list_filter = [
        'category', 'priority', 'status', 'community',
        'proposed_by', 'representative', 'is_test_data'
    ]
    search_fields = ['title', 'description', 'community']
    inlines = [TopicProcessRecordInline, TopicCommentInline]
    fieldsets = (
        ('基本信息', {
            'fields': ('title', 'category', 'priority', 'status', 'community')
        }),
        ('内容', {
            'fields': ('description', 'background', 'proposed_solution', 'expected_outcome')
        }),
        ('时间', {
            'fields': ('deadline', 'voting_start_time', 'voting_end_time')
        }),
        ('人员', {
            'fields': ('proposed_by', 'representative', 'estimated_budget', 'attachments')
        }),
        ('其他', {
            'fields': ('is_test_data',)
        })
    )

    def proposed_by_name(self, obj):
        return obj.proposed_by.get_full_name() if obj.proposed_by else '-'

    def representative_name(self, obj):
        return obj.representative.get_full_name() if obj.representative else '-'

    proposed_by_name.short_description = '提案人'
    representative_name.short_description = '负责代表'


@admin.register(TopicProcessRecord)
class TopicProcessRecordAdmin(admin.ModelAdmin):
    list_display = ['topic', 'status_change', 'content', 'processed_by', 'processed_at']
    list_filter = ['status_change', 'processed_by', 'processed_at']
    search_fields = ['topic__title', 'content', 'remark']
    date_hierarchy = 'processed_at'


@admin.register(TopicComment)
class TopicCommentAdmin(admin.ModelAdmin):
    list_display = ['topic', 'content', 'author', 'is_anonymous', 'created_at']
    list_filter = ['is_anonymous', 'created_at']
    search_fields = ['topic__title', 'content', 'author__first_name']
