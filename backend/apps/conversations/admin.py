from django.contrib import admin
from .models import Conversation, Message


class MessageInline(admin.TabularInline):
    model = Message
    extra = 0
    readonly_fields = ('created_at',)
    fields = ('role', 'content', 'is_ai_suggestion', 'is_adopted', 'review_status', 'created_at')


@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    list_display = ('id', 'customer_name', 'customer_phone', 'sales_operation', 'channel', 'priority', 'status', 'ai_suggestion_adoption_rate', 'created_at', 'updated_at')
    list_filter = ('status', 'channel', 'priority', 'sales_operation', 'created_at')
    search_fields = ('title', 'customer_name', 'customer_phone', 'user__username')
    inlines = [MessageInline]
    readonly_fields = ('created_at', 'updated_at')


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ('id', 'conversation', 'role', 'content_preview', 'is_ai_suggestion', 'is_adopted', 'review_status', 'error_type', 'tokens_used', 'created_at')
    list_filter = ('role', 'is_ai_suggestion', 'is_adopted', 'review_status', 'error_type', 'created_at')
    search_fields = ('content', 'suggested_reply', 'error_message')
    readonly_fields = ('created_at',)

    def content_preview(self, obj):
        return obj.content[:50] + '...' if len(obj.content) > 50 else obj.content
    content_preview.short_description = '消息预览'
