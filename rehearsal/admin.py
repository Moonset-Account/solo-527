from django.contrib import admin
from django.contrib import messages
from django import forms
from django.shortcuts import redirect, render
from django.urls import path, reverse
from django.utils.html import format_html
from django.http import HttpResponseRedirect
from import_export import resources, fields
from import_export.admin import ImportExportModelAdmin
from .models import (
    Member, Play, Room, Equipment, Prop, PropUsage,
    Rehearsal, Attendance, Message, RoomMaintenance, CancelRecord
)
from .tasks import send_rehearsal_notification


class CancelRehearsalForm(forms.Form):
    reason = forms.CharField(
        widget=forms.Textarea(attrs={'rows': 4, 'cols': 60}),
        label='取消理由',
        required=True,
        help_text='请详细说明取消原因，该记录将被保存'
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
    extra = 0
    min_num = 0

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == 'prop':
            kwargs['queryset'] = Prop.objects.all().order_by('name')
        return super().formfield_for_foreignkey(db_field, request, **kwargs)


class AttendanceInline(admin.TabularInline):
    model = Attendance
    extra = 0
    readonly_fields = ('check_in_time', 'late_minutes')

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == 'member':
            kwargs['queryset'] = Member.objects.all().order_by('name')
        return super().formfield_for_foreignkey(db_field, request, **kwargs)


class RehearsalAdmin(ImportExportModelAdmin):
    resource_class = RehearsalResource
    list_display = ('play', 'room', 'director', 'date', 'start_time', 'end_time', 'status', 'member_count', 'created_at')
    list_filter = ('status', 'date', 'room')
    search_fields = ('play__title', 'notes')
    filter_horizontal = ('members',)
    inlines = [PropUsageInline, AttendanceInline]
    actions = ['approve_rehearsal', 'cancel_rehearsal_action']
    readonly_fields = ('created_at', 'updated_at')

    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path('<int:rehearsal_id>/cancel/', self.admin_site.admin_view(self.cancel_rehearsal_view), name='rehearsal_cancel_admin'),
        ]
        return custom_urls + urls

    def member_count(self, obj):
        return obj.members.count()
    member_count.short_description = '参与人数'

    def approve_rehearsal(self, request, queryset):
        success_count = 0
        fail_count = 0
        for rehearsal in queryset:
            if rehearsal.status != 'pending':
                messages.warning(request, f'{rehearsal.play.title} 状态不是待审批，已跳过')
                fail_count += 1
                continue

            member_count = rehearsal.members.count()
            if member_count > rehearsal.room.capacity:
                messages.error(
                    request,
                    f'{rehearsal.play.title} 审批失败：参与人数({member_count})超过排练室容量({rehearsal.room.capacity})'
                )
                fail_count += 1
                continue

            if rehearsal.need_lighting and not rehearsal.room.has_lighting:
                messages.error(
                    request,
                    f'{rehearsal.play.title} 审批失败：{rehearsal.room.name} 没有灯光设备'
                )
                fail_count += 1
                continue

            conflicts = rehearsal.get_conflicts()
            if conflicts:
                conflict_info = '; '.join([f'{c.play.title} ({c.start_time}-{c.end_time})' for c in conflicts])
                messages.error(
                    request,
                    f'{rehearsal.play.title} 审批失败：时间冲突 - {conflict_info}'
                )
                fail_count += 1
                continue

            rehearsal.status = 'approved'
            rehearsal.save()

            for member in rehearsal.members.all():
                Attendance.objects.get_or_create(
                    rehearsal=rehearsal,
                    member=member,
                    defaults={'status': 'absent'}
                )

            send_rehearsal_notification.delay(rehearsal.id, 'info')
            success_count += 1

        if success_count > 0:
            messages.success(request, f'成功批准 {success_count} 个排练')
        if fail_count > 0:
            messages.warning(request, f'{fail_count} 个排练审批失败')

    approve_rehearsal.short_description = '✅ 批准选中的排练（检查容量/灯光/冲突）'

    def cancel_rehearsal_action(self, request, queryset):
        selected = queryset.values_list('pk', flat=True)
        if queryset.count() == 1:
            return redirect(f'cancel/{list(selected)[0]}/')
        return HttpResponseRedirect(reverse('admin:rehearsal_rehearsal_changelist'))

    cancel_rehearsal_action.short_description = '❌ 取消选中的排练（需填写理由）'

    def cancel_rehearsal_view(self, request, rehearsal_id):
        rehearsal = Rehearsal.objects.get(pk=rehearsal_id)
        if request.method == 'POST':
            form = CancelRehearsalForm(request.POST)
            if form.is_valid():
                reason = form.cleaned_data['reason']

                CancelRecord.objects.create(
                    rehearsal=rehearsal,
                    cancelled_by=Member.objects.get(user=request.user) if hasattr(request.user, 'member') else None,
                    reason=reason
                )

                rehearsal.status = 'cancelled'
                rehearsal.save()

                PropUsage.objects.filter(rehearsal=rehearsal).update(returned=True)

                send_rehearsal_notification.delay(rehearsal.id, 'cancel')

                messages.success(request, f'已取消排练：{rehearsal.play.title}，理由已记录')
                return redirect(reverse('admin:rehearsal_rehearsal_changelist'))
        else:
            form = CancelRehearsalForm()

        context = {
            'form': form,
            'rehearsal': rehearsal,
            'opts': self.model._meta,
            'site_title': self.admin_site.site_title,
            'site_header': self.admin_site.site_header,
        }
        return render(request, 'admin/cancel_rehearsal.html', context)

    def save_model(self, request, obj, form, change):
        if not change:
            obj.created_by = Member.objects.filter(user=request.user).first()
        super().save_model(request, obj, form, change)

    def save_related(self, request, form, formsets, change):
        super().save_related(request, form, formsets, change)
        rehearsal = form.instance
        for member in rehearsal.members.all():
            Attendance.objects.get_or_create(
                rehearsal=rehearsal,
                member=member,
                defaults={'status': 'absent'}
            )


class AttendanceAdmin(ImportExportModelAdmin):
    resource_class = AttendanceResource
    list_display = ('rehearsal', 'member', 'status', 'check_in_time', 'late_minutes')
    list_filter = ('status', 'rehearsal__date')
    search_fields = ('member__name', 'rehearsal__play__title')
    readonly_fields = ('check_in_time', 'late_minutes')


class MessageAdmin(admin.ModelAdmin):
    list_display = ('title', 'type', 'sender', 'rehearsal', 'created_at', 'read_count')
    list_filter = ('type', 'created_at')
    search_fields = ('title', 'content')
    filter_horizontal = ('recipients', 'read_by')

    def read_count(self, obj):
        return f'{obj.read_by.count()}/{obj.recipients.count()}'
    read_count.short_description = '已读/总数'


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
                CancelRecord.objects.get_or_create(
                    rehearsal=rehearsal,
                    defaults={
                        'cancelled_by': Member.objects.filter(user=request.user).first(),
                        'reason': f'排练室维修：{maintenance.title}'
                    }
                )
                rehearsal.prop_usages.update(returned=True)
                rehearsal.status = 'cancelled'
                rehearsal.save()
                send_rehearsal_notification.delay(rehearsal.id, 'cancel')
            maintenance.props_released = True
            maintenance.save()
        messages.success(request, '已释放道具并取消相关排练，取消记录已保存')
    release_props_for_maintenance.short_description = '🔧 释放道具并取消相关排练（记录理由）'


class CancelRecordAdmin(admin.ModelAdmin):
    list_display = ('rehearsal', 'cancelled_by', 'reason_short', 'cancelled_at')
    search_fields = ('rehearsal__play__title', 'reason')
    readonly_fields = ('rehearsal', 'cancelled_by', 'reason', 'cancelled_at')

    def reason_short(self, obj):
        return obj.reason[:50] + '...' if len(obj.reason) > 50 else obj.reason
    reason_short.short_description = '取消理由'

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


admin.site.register(Member, MemberAdmin)
admin.site.register(Play, PlayAdmin)
admin.site.register(Room, RoomAdmin)
admin.site.register(Prop, PropAdmin)
admin.site.register(Rehearsal, RehearsalAdmin)
admin.site.register(Attendance, AttendanceAdmin)
admin.site.register(Message, MessageAdmin)
admin.site.register(RoomMaintenance, RoomMaintenanceAdmin)
admin.site.register(CancelRecord, CancelRecordAdmin)
