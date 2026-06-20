from django.contrib import admin
from .models import Difference, Reconciliation


class DifferenceInline(admin.TabularInline):
    model = Difference
    extra = 0


@admin.register(Reconciliation)
class ReconciliationAdmin(admin.ModelAdmin):
    list_display = ('project_name', 'client_name', 'uploaded_by', 'status', 'uploaded_at')
    list_filter = ('status',)
    search_fields = ('project_name', 'client_name')
    inlines = [DifferenceInline]


@admin.register(Difference)
class DifferenceAdmin(admin.ModelAdmin):
    list_display = ('reconciliation', 'item_type', 'system_value', 'uploaded_value', 'is_confirmed')
    list_filter = ('item_type', 'is_confirmed')
