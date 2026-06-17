from django.contrib import admin
from .models import Budget, BudgetItem, BudgetChange, BudgetWarning, BudgetDashboard


@admin.register(Budget)
class BudgetAdmin(admin.ModelAdmin):
    list_display = ('project', 'name', 'version', 'total_amount', 'status', 'is_current', 'created_at')
    list_filter = ('status', 'is_current', 'created_at')
    search_fields = ('name', 'version', 'project__name', 'project__code')


@admin.register(BudgetItem)
class BudgetItemAdmin(admin.ModelAdmin):
    list_display = ('budget', 'category', 'name', 'quantity', 'unit_price', 'amount')
    list_filter = ('category',)


@admin.register(BudgetChange)
class BudgetChangeAdmin(admin.ModelAdmin):
    list_display = ('budget', 'type', 'name', 'amount', 'status', 'created_at')
    list_filter = ('type', 'status')


@admin.register(BudgetWarning)
class BudgetWarningAdmin(admin.ModelAdmin):
    list_display = ('budget', 'level', 'title', 'is_read', 'is_resolved', 'created_at')
    list_filter = ('level', 'is_read', 'is_resolved')


@admin.register(BudgetDashboard)
class BudgetDashboardAdmin(admin.ModelAdmin):
    list_display = ('project', 'snapshot_date', 'budget_amount', 'actual_amount', 'warning_count')
    list_filter = ('snapshot_date',)
