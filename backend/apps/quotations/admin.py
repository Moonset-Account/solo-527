from django.contrib import admin
from .models import Quotation, QuotationItem, QuotationExtra


@admin.register(Quotation)
class QuotationAdmin(admin.ModelAdmin):
    list_display = ('project', 'title', 'version', 'total_amount', 'status', 'is_current', 'created_at')
    list_filter = ('status', 'is_current', 'created_at')
    search_fields = ('title', 'project__name', 'project__code')


@admin.register(QuotationItem)
class QuotationItemAdmin(admin.ModelAdmin):
    list_display = ('quotation', 'category', 'name', 'quantity', 'amount')
    list_filter = ('category',)


@admin.register(QuotationExtra)
class QuotationExtraAdmin(admin.ModelAdmin):
    list_display = ('quotation', 'name', 'amount', 'is_confirmed', 'created_at')
    list_filter = ('is_confirmed',)
