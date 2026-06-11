from django.contrib import admin
from .models import UsageStats, TokenUsage, UserActivity, AccuracyStats, DailyStats


@admin.register(UsageStats)
class UsageStatsAdmin(admin.ModelAdmin):
    list_display = ('date', 'total_conversations', 'total_messages', 'total_tokens',
                    'active_users', 'new_users', 'api_calls', 'avg_response_time')
    list_filter = ('date',)
    search_fields = ('date',)
    readonly_fields = ('created_at',)


@admin.register(TokenUsage)
class TokenUsageAdmin(admin.ModelAdmin):
    list_display = ('user', 'date', 'model', 'prompt_tokens', 'completion_tokens',
                    'total_tokens', 'cost', 'created_at')
    list_filter = ('model', 'date', 'created_at')
    search_fields = ('user__username', 'model')
    readonly_fields = ('created_at',)


@admin.register(UserActivity)
class UserActivityAdmin(admin.ModelAdmin):
    list_display = ('user', 'activity_type', 'ip_address', 'created_at')
    list_filter = ('activity_type', 'created_at')
    search_fields = ('user__username', 'ip_address')
    readonly_fields = ('created_at',)


@admin.register(AccuracyStats)
class AccuracyStatsAdmin(admin.ModelAdmin):
    list_display = ('date', 'sales_operation', 'prompt_version', 'total_calls', 'accurate_calls',
                    'accuracy_rate', 'error_timeout', 'error_rate_limit', 'avg_response_time')
    list_filter = ('date', 'sales_operation', 'prompt_version')
    search_fields = ('sales_operation', 'prompt_version')
    readonly_fields = ('created_at',)


@admin.register(DailyStats)
class DailyStatsAdmin(admin.ModelAdmin):
    list_display = ('date', 'total_conversations', 'total_messages', 'ai_suggestion_count',
                    'ai_adoption_rate', 'total_reviews', 'total_risks', 'avg_response_time')
    list_filter = ('date',)
    search_fields = ('date',)
    readonly_fields = ('created_at',)
