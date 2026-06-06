from django.contrib import admin
from django.utils.html import format_html
from django.utils import timezone
from .models import (
    SurgicalTemplate, TemplateSupplyItem, OperationSchedule,
    PreparedItem, UsageRecord, ReturnRecord, HighValueAudit
)


class TemplateSupplyItemInline(admin.TabularInline):
    model = TemplateSupplyItem
    extra = 1


@admin.register(SurgicalTemplate)
class SurgicalTemplateAdmin(admin.ModelAdmin):
    list_display = ('name', 'code', 'department', 'estimated_duration', 'is_active', 'created_by', 'created_at')
    list_filter = ('department', 'is_active')
    search_fields = ('name', 'code', 'department')
    inlines = [TemplateSupplyItemInline]


@admin.register(TemplateSupplyItem)
class TemplateSupplyItemAdmin(admin.ModelAdmin):
    list_display = ('template', 'supply', 'item_type', 'quantity', 'remark')
    list_filter = ('item_type', 'template__department')
    search_fields = ('template__name', 'supply__name')


class PreparedItemInline(admin.TabularInline):
    model = PreparedItem
    extra = 0
    readonly_fields = ('prepared_at', 'verified_at')


@admin.register(OperationSchedule)
class OperationScheduleAdmin(admin.ModelAdmin):
    list_display = (
        'operation_date', 'operation_room', 'patient_name', 'patient_id',
        'template', 'surgeon', 'nurse', 'status', 'schedule_time', 'has_template_changed'
    )
    list_filter = ('status', 'operation_date', 'operation_room', 'template__department')
    search_fields = ('patient_name', 'patient_id', 'surgeon', 'template__name')
    readonly_fields = ('created_at', 'updated_at')
    inlines = [PreparedItemInline]
    date_hierarchy = 'operation_date'

    def has_template_changed(self, obj):
        return obj.original_template is not None
    has_template_changed.short_description = '已换术式'
    has_template_changed.boolean = True

    actions = ['generate_packing_list', 'validate_items']

    def generate_packing_list(self, request, queryset):
        for schedule in queryset:
            if schedule.status == 'SCHEDULED':
                schedule.status = 'PREPARING'
                schedule.save()
                items = schedule.template.supply_items.all()
                for item in items:
                    PreparedItem.objects.get_or_create(
                        schedule=schedule,
                        supply=item.supply,
                        defaults={
                            'quantity': item.quantity,
                            'item_type': item.item_type,
                            'prepared_by': request.user,
                        }
                    )
        self.message_user(request, f'已为 {queryset.count()} 台手术生成备包清单')
    generate_packing_list.short_description = '生成备包清单'

    def validate_items(self, request, queryset):
        for schedule in queryset:
            results = schedule.validate_prepared_items(request.user)
            if results:
                messages = [r['message'] for r in results]
                self.message_user(request, f'{schedule.patient_name} 校验发现问题: {"; ".join(messages)}')
            else:
                schedule.status = 'READY'
                schedule.save()
                self.message_user(request, f'{schedule.patient_name} 备包校验通过，状态已更新为已备妥')
    validate_items.short_description = '校验备包物品'


@admin.register(PreparedItem)
class PreparedItemAdmin(admin.ModelAdmin):
    list_display = (
        'schedule', 'supply', 'batch', 'quantity', 'item_type',
        'status', 'storage_location', 'prepared_by', 'verified_by', 'prepared_at'
    )
    list_filter = ('status', 'item_type', 'supply__supply_type')
    search_fields = ('schedule__patient_name', 'supply__name', 'batch__batch_number')
    readonly_fields = ('prepared_at', 'verified_at')

    actions = ['verify_items']

    def verify_items(self, request, queryset):
        count = 0
        for item in queryset:
            try:
                item.verify(request.user)
                count += 1
            except Exception as e:
                self.message_user(request, f'{item.supply.name} 核对失败: {str(e)}')
        self.message_user(request, f'成功核对 {count} 项物品')
    verify_items.short_description = '核对选中物品'


@admin.register(UsageRecord)
class UsageRecordAdmin(admin.ModelAdmin):
    list_display = (
        'schedule', 'supply', 'batch', 'quantity', 'is_high_value',
        'used_by', 'is_double_confirmed', 'confirmed_by', 'scan_time'
    )
    list_filter = ('is_high_value', 'is_double_confirmed')
    search_fields = ('schedule__patient_name', 'supply__name', 'batch__batch_number')
    readonly_fields = ('scan_time', 'confirm_time')


@admin.register(ReturnRecord)
class ReturnRecordAdmin(admin.ModelAdmin):
    list_display = (
        'schedule', 'supply', 'batch', 'quantity', 'return_status',
        'is_high_value', 'returned_by', 'is_double_confirmed', 'confirmed_by', 'return_time'
    )
    list_filter = ('return_status', 'is_high_value', 'is_double_confirmed')
    search_fields = ('schedule__patient_name', 'supply__name', 'batch__batch_number')
    readonly_fields = ('return_time', 'confirm_time')


@admin.register(HighValueAudit)
class HighValueAuditAdmin(admin.ModelAdmin):
    list_display = (
        'schedule', 'supply', 'batch', 'quantity', 'action_type',
        'operator', 'is_audited', 'auditor', 'action_time'
    )
    list_filter = ('action_type', 'is_audited')
    search_fields = ('schedule__patient_name', 'supply__name', 'batch__batch_number')
    readonly_fields = ('action_time', 'audit_time')

    actions = ['audit_records']

    def audit_records(self, request, queryset):
        updated = queryset.filter(is_audited=False).update(
            is_audited=True,
            auditor=request.user,
            audit_time=timezone.now()
        )
        self.message_user(request, f'已审核 {updated} 条高值耗材记录')
    audit_records.short_description = '审核选中记录'
