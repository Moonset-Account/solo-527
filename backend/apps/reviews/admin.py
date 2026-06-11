from django.contrib import admin
from .models import Review, ReviewRule


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ('id', 'message', 'review_type', 'status', 'is_accurate', 'sales_operation', 'prompt_version', 'reviewer', 'flagged_by_ai', 'created_at', 'reviewed_at')
    list_filter = ('status', 'review_type', 'flagged_by_ai', 'is_accurate', 'risk_level', 'sales_operation', 'prompt_version', 'created_at')
    search_fields = ('comment', 'inaccuracy_reason')
    readonly_fields = ('created_at',)


@admin.register(ReviewRule)
class ReviewRuleAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'rule_type', 'is_active', 'severity', 'created_at')
    list_filter = ('rule_type', 'is_active', 'severity', 'created_at')
    search_fields = ('name', 'description', 'pattern')
    readonly_fields = ('created_at', 'updated_at')
