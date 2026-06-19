from django.contrib import admin
from .models import Resident, HouseholdMember, ResidentProcessRecord


class HouseholdMemberInline(admin.TabularInline):
    model = HouseholdMember
    extra = 1
    fields = ['name', 'relation', 'id_card', 'phone', 'is_voter_qualified']


class ResidentProcessRecordInline(admin.TabularInline):
    model = ResidentProcessRecord
    extra = 0
    fields = ['content', 'processed_by', 'processed_at', 'remark']
    readonly_fields = ['processed_at']


@admin.register(Resident)
class ResidentAdmin(admin.ModelAdmin):
    list_display = [
        'full_name', 'household_type', 'community', 'building',
        'unit', 'room_number', 'is_voter_qualified', 'created_at'
    ]
    list_filter = [
        'household_type', 'is_voter_qualified', 'has_volunteer_experience',
        'user__community', 'user__building', 'is_test_data'
    ]
    search_fields = [
        'user__username', 'user__first_name', 'user__last_name',
        'user__phone', 'registered_address', 'residence_address'
    ]
    inlines = [HouseholdMemberInline, ResidentProcessRecordInline]
    fieldsets = (
        ('基本信息', {
            'fields': ('user', 'household_type', 'household_member_count', 'is_voter_qualified', 'qualification_exception_reason')
        }),
        ('居住信息', {
            'fields': ('registered_address', 'residence_address', 'household_register_type')
        }),
        ('个人信息', {
            'fields': (
                'ethnicity', 'political_status', 'occupation', 'work_unit',
                'education_level', 'marital_status', 'birthday', 'age', 'gender',
                'contact_person', 'contact_phone', 'health_status'
            )
        }),
        ('其他信息', {
            'fields': ('has_volunteer_experience', 'skills', 'remarks', 'is_test_data')
        }),
    )

    def full_name(self, obj):
        return obj.user.get_full_name() or obj.user.username

    def community(self, obj):
        return obj.user.community

    def building(self, obj):
        return obj.user.building

    def unit(self, obj):
        return obj.user.unit

    def room_number(self, obj):
        return obj.user.room_number

    full_name.short_description = '姓名'
    community.short_description = '社区'
    building.short_description = '楼栋'
    unit.short_description = '单元'
    room_number.short_description = '房号'


@admin.register(HouseholdMember)
class HouseholdMemberAdmin(admin.ModelAdmin):
    list_display = ['name', 'resident', 'relation', 'phone', 'is_voter_qualified']
    list_filter = ['relation', 'is_voter_qualified', 'resident__user__community']
    search_fields = ['name', 'id_card', 'phone']


@admin.register(ResidentProcessRecord)
class ResidentProcessRecordAdmin(admin.ModelAdmin):
    list_display = ['resident', 'content', 'processed_by', 'processed_at']
    list_filter = ['processed_by', 'processed_at']
    search_fields = ['resident__user__first_name', 'content', 'remark']
    date_hierarchy = 'processed_at'
