from django.contrib import admin
from .models import LossAggregation, CaliberConfig

@admin.register(LossAggregation)
class LossAggregationAdmin(admin.ModelAdmin):
    list_display = ['store', 'material', 'period_type', 'period_date', 'loss_rate', 'loss_amount', 'includes_trial']
    list_filter = ['period_type', 'period_date', 'includes_trial', 'store']
    search_fields = ['store__name', 'material__name']
    date_hierarchy = 'period_date'

@admin.register(CaliberConfig)
class CaliberConfigAdmin(admin.ModelAdmin):
    list_display = ['key', 'description', 'updated_at']
    search_fields = ['key']
