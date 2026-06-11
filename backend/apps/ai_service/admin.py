from django.contrib import admin
from .models import AIModel, APIConfig, AILog


@admin.register(AIModel)
class AIModelAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'provider', 'model_id', 'is_active',
                    'max_tokens', 'supports_streaming', 'created_at')
    list_filter = ('provider', 'is_active', 'supports_streaming', 'created_at')
    search_fields = ('name', 'model_id', 'description')
    readonly_fields = ('created_at', 'updated_at')


@admin.register(APIConfig)
class APIConfigAdmin(admin.ModelAdmin):
    list_display = ('id', 'provider', 'is_default', 'rate_limit_per_minute',
                    'rate_limit_per_day', 'created_at')
    list_filter = ('provider', 'is_default', 'created_at')
    search_fields = ('provider',)
    readonly_fields = ('created_at', 'updated_at')


@admin.register(AILog)
class AILogAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'model', 'status', 'total_tokens',
                    'cost', 'latency', 'created_at')
    list_filter = ('status', 'model', 'created_at')
    search_fields = ('prompt', 'response', 'error_message')
    readonly_fields = ('created_at',)
