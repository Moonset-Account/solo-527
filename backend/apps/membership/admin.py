from django.contrib import admin
from django.utils.translation import gettext_lazy as _

from .models import Benefit, MembershipPackage, PackageBenefit, MemberMembership, BenefitUsageRecord


class PackageBenefitInline(admin.TabularInline):
    model = PackageBenefit
    extra = 1
    raw_id_fields = ['benefit']


@admin.register(Benefit)
class BenefitAdmin(admin.ModelAdmin):
    list_display = ['name', 'get_benefit_type_display', 'value', 'unit', 'is_active', 'is_demo', 'created_at']
    list_filter = ['benefit_type', 'is_active', 'is_demo', 'created_at']
    search_fields = ['name', 'description']
    ordering = ['-created_at']
    readonly_fields = ['created_at', 'updated_at']
    fieldsets = (
        (_('基本信息'), {'fields': ('name', 'description', 'benefit_type')}),
        (_('权益配置'), {'fields': ('value', 'unit')}),
        (_('状态信息'), {'fields': ('is_active', 'is_demo')}),
        (_('系统信息'), {'fields': ('created_at', 'updated_at')}),
    )


@admin.register(MembershipPackage)
class MembershipPackageAdmin(admin.ModelAdmin):
    list_display = ['name', 'price', 'original_price', 'duration_value', 'get_duration_unit_display', 'service_count', 'get_status_display', 'sort_order', 'is_popular', 'is_demo', 'created_at']
    list_filter = ['status', 'duration_unit', 'is_popular', 'is_demo', 'created_at']
    search_fields = ['name', 'description', 'short_description']
    ordering = ['sort_order', '-created_at']
    inlines = [PackageBenefitInline]
    readonly_fields = ['created_at', 'updated_at']
    fieldsets = (
        (_('基本信息'), {'fields': ('name', 'description', 'short_description')}),
        (_('价格配置'), {'fields': ('price', 'original_price')}),
        (_('有效期配置'), {'fields': ('duration_value', 'duration_unit')}),
        (_('服务配置'), {'fields': ('service_count',)}),
        (_('状态配置'), {'fields': ('status', 'sort_order', 'is_popular', 'is_demo')}),
        (_('系统信息'), {'fields': ('created_at', 'updated_at')}),
    )


@admin.register(PackageBenefit)
class PackageBenefitAdmin(admin.ModelAdmin):
    list_display = ['package', 'benefit', 'quantity', 'created_at']
    list_filter = ['created_at']
    search_fields = ['package__name', 'benefit__name']
    ordering = ['-created_at']
    raw_id_fields = ['package', 'benefit']


@admin.register(MemberMembership)
class MemberMembershipAdmin(admin.ModelAdmin):
    list_display = ['member', 'package', 'start_date', 'end_date', 'remaining_services', 'total_services', 'get_status_display', 'is_auto_renew', 'is_demo', 'created_at']
    list_filter = ['status', 'is_auto_renew', 'is_demo', 'created_at', 'start_date', 'end_date']
    search_fields = ['member__username', 'member__phone', 'package__name']
    ordering = ['-created_at']
    raw_id_fields = ['member', 'package', 'purchase_order']
    readonly_fields = ['created_at', 'updated_at']
    fieldsets = (
        (_('关联信息'), {'fields': ('member', 'package', 'purchase_order')}),
        (_('有效期'), {'fields': ('start_date', 'end_date')}),
        (_('服务次数'), {'fields': ('remaining_services', 'total_services')}),
        (_('状态信息'), {'fields': ('status', 'is_auto_renew', 'is_demo')}),
        (_('系统信息'), {'fields': ('created_at', 'updated_at')}),
    )


@admin.register(BenefitUsageRecord)
class BenefitUsageRecordAdmin(admin.ModelAdmin):
    list_display = ['membership', 'benefit', 'quantity_used', 'operator', 'used_at']
    list_filter = ['used_at']
    search_fields = ['membership__member__username', 'benefit__name', 'operator__username']
    ordering = ['-used_at']
    raw_id_fields = ['membership', 'benefit', 'service_record', 'operator']
    readonly_fields = ['used_at']
