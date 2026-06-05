from django.contrib import admin
from import_export import resources, fields
from import_export.admin import ImportExportModelAdmin
from .models import (
    Member, Play, Room, Equipment, Prop, PropUsage,
    Rehearsal, Attendance, Message, RoomMaintenance, CancelRecord
)


class MemberResource(resources.ModelResource):
    class Meta:
        model = Member
        fields = ('id', 'name', 'role', 'phone', 'email', 'created_at')


class PlayResource(resources.ModelResource):
    class Meta:
        model = Play
        fields = ('id', 'title', 'director', 'status', 'performance_date', 'created_at')


class RoomResource(resources.ModelResource):
    class Meta:
        model = Room
        fields = ('id', 'name', 'capacity', 'has_lighting', 'has_sound', 'has_stage', 'is_available')


class PropResource(resources.ModelResource):
    class Meta:
        model = Prop
        fields = ('id', 'name', 'category', 'quantity', 'description')


class RehearsalResource(resources.ModelResource):
    class Meta:
        model = Rehearsal
        fields = ('id', 'play', 'room', 'director', 'date', 'start_time', 'end_time', 'status', 'created_at')


class AttendanceResource(resources.ModelResource):
    class Meta:
        model = Attendance
        fields = ('id', 'rehearsal', 'member', 'status', 'check_in_time', 'late_minutes')


class MemberAdmin(ImportExportModelAdmin):
    resource_class = MemberResource
    list_display = ('name', 'role', 'phone', 'email', 'created_at')
    list_filter = ('role',)
    search_fields = ('name', 'phone', 'email')


class PlayAdmin(ImportExportModelAdmin):
    resource_class = PlayResource
    list_display = ('title', 'director', 'status', 'performance_date', 'created_at')
    list_filter = ('status',)
    search_fields = ('title', 'description')
    filter_horizontal = ('cast',)


class EquipmentInline(admin.TabularInline):
    model = Equipment
    extra = 1


class RoomAdmin(ImportExportModelAdmin):
    resource_class = RoomResource
    list_display = ('name', 'capacity', 'has_lighting', 'has_sound', 'has_stage', 'is_available')
    list_filter = ('has_lighting', 'has_sound', 'has_stage', 'is_available')
    search_fields = ('name', 'description')
    inlines = [EquipmentInline]


class PropAdmin(ImportExportModelAdmin):
    resource_class = PropResource
    list_display = ('name', 'category', 'quantity', 'description')
    list_filter = ('category',)
    search_fields = ('name', 'description')


class PropUsageInline(admin.TabularInline):
    model = PropUsage
    extra = 1


class RehearsalAdmin(ImportExportModelAdmin):
    resource_class = RehearsalResource
    list_display = ('play', 'room', 'director', 'date', 'start_time', 'end_time', 'status', 'created_at')
    list_filter = ('status', 'date', 'room')
    search_fields = ('play__title', 'notes')
    filter_horizontal = ('members',)
    inlines = [PropUsageInline]
    actions = ['approve_rehearsal', 'cancel_rehearsal']

    def approve_rehearsal(self, request, queryset):
        queryset.update(status='approved')
    approve_rehearsal.short_description = '批准选中的排练'

    def cancel_rehearsal(self, request, queryset):
        queryset.update(status='cancelled')
    cancel_rehearsal.short_description = '取消选中的排练'


class AttendanceAdmin(ImportExportModelAdmin):
    resource_class = AttendanceResource
    list_display = ('rehearsal', 'member', 'status', 'check_in_time', 'late_minutes')
    list_filter = ('status', 'rehearsal__date')
    search_fields = ('member__name', 'rehearsal__play__title')


class MessageAdmin(admin.ModelAdmin):
    list_display = ('title', 'type', 'sender', 'rehearsal', 'created_at')
    list_filter = ('type', 'created_at')
    search_fields = ('title', 'content')
    filter_horizontal = ('recipients', 'read_by')


class RoomMaintenanceAdmin(admin.ModelAdmin):
    list_display = ('room', 'title', 'start_date', 'end_date', 'status', 'props_released')
    list_filter = ('status', 'room')
    search_fields = ('title', 'description')
    actions = ['release_props_for_maintenance']

    def release_props_for_maintenance(self, request, queryset):
        for maintenance in queryset:
            rehearsals = Rehearsal.objects.filter(
                room=maintenance.room,
                date__range=(maintenance.start_date, maintenance.end_date),
                status__in=['pending', 'approved', 'ongoing']
            )
            for rehearsal in rehearsals:
                rehearsal.prop_usages.update(returned=True)
                rehearsal.status = 'cancelled'
                rehearsal.save()
            maintenance.props_released = True
            maintenance.save()
    release_props_for_maintenance.short_description = '释放道具并取消相关排练'


class CancelRecordAdmin(admin.ModelAdmin):
    list_display = ('rehearsal', 'cancelled_by', 'reason', 'cancelled_at')
    search_fields = ('rehearsal__play__title', 'reason')


admin.site.register(Member, MemberAdmin)
admin.site.register(Play, PlayAdmin)
admin.site.register(Room, RoomAdmin)
admin.site.register(Prop, PropAdmin)
admin.site.register(Rehearsal, RehearsalAdmin)
admin.site.register(Attendance, AttendanceAdmin)
admin.site.register(Message, MessageAdmin)
admin.site.register(RoomMaintenance, RoomMaintenanceAdmin)
admin.site.register(CancelRecord, CancelRecordAdmin)
