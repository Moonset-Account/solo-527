from django.contrib import admin
from .models import RiskSample, RiskRule


@admin.register(RiskSample)
class RiskSampleAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'risk_level', 'risk_category', 'source', 'status', 'assignee', 'created_at', 'handled_at')
    list_filter = ('risk_level', 'risk_category', 'source', 'status', 'created_at')
    search_fields = ('title', 'content', 'handle_comment')
    readonly_fields = ('created_at', 'updated_at', 'handled_at')


@admin.register(RiskRule)
class RiskRuleAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'rule_type', 'risk_level', 'is_active', 'created_at')
    list_filter = ('rule_type', 'risk_level', 'is_active', 'created_at')
    search_fields = ('name', 'pattern')
    readonly_fields = ('created_at', 'updated_at')
