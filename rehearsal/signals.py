from django.db.models.signals import post_save, pre_save, m2m_changed
from django.dispatch import receiver
from django.utils import timezone
from django.conf import settings
from django.core.exceptions import ValidationError
from datetime import datetime
from .models import (
    Rehearsal, RoomMaintenance, Attendance,
    CancelRecord, PropUsage, Prop
)
from .tasks import (
    send_rehearsal_notification,
    send_change_notification,
    send_room_maintenance_notification,
)


@receiver(post_save, sender=Rehearsal)
def handle_rehearsal_save(sender, instance, created, **kwargs):
    if created:
        for member in instance.members.all():
            Attendance.objects.get_or_create(
                rehearsal=instance,
                member=member,
                defaults={'status': 'absent'}
            )
        if instance.status == 'approved':
            send_rehearsal_notification.delay(instance.id, 'info')


@receiver(m2m_changed, sender=Rehearsal.members.through)
def handle_rehearsal_members_changed(sender, instance, action, pk_set, **kwargs):
    if action == 'post_add':
        for member_id in pk_set:
            Attendance.objects.get_or_create(
                rehearsal=instance,
                member_id=member_id,
                defaults={'status': 'absent'}
            )
    elif action == 'post_remove':
        Attendance.objects.filter(
            rehearsal=instance,
            member_id__in=pk_set
        ).delete()
    elif action == 'post_clear':
        Attendance.objects.filter(rehearsal=instance).delete()


@receiver(m2m_changed, sender=Rehearsal.members.through)
def sync_attendance_on_members_change(sender, instance, action, **kwargs):
    if action in ['post_add', 'post_remove', 'post_clear']:
        existing_member_ids = set(instance.members.values_list('id', flat=True))
        attendance_member_ids = set(Attendance.objects.filter(
            rehearsal=instance
        ).values_list('member_id', flat=True))

        missing_ids = existing_member_ids - attendance_member_ids
        for member_id in missing_ids:
            Attendance.objects.get_or_create(
                rehearsal=instance,
                member_id=member_id,
                defaults={'status': 'absent'}
            )


@receiver(pre_save, sender=Rehearsal)
def handle_rehearsal_update(sender, instance, **kwargs):
    if instance.pk:
        try:
            old_instance = Rehearsal.objects.get(pk=instance.pk)
        except Rehearsal.DoesNotExist:
            return

        room_changed = old_instance.room_id != instance.room_id
        date_changed = old_instance.date != instance.date
        start_changed = old_instance.start_time != instance.start_time
        end_changed = old_instance.end_time != instance.end_time
        status_changed = old_instance.status != instance.status

        if (room_changed or date_changed or start_changed or end_changed) and instance.status in ['approved', 'ongoing']:
            send_change_notification.delay(
                instance.id,
                old_room_id=old_instance.room_id if room_changed else None,
                old_date=old_instance.date if date_changed else None,
                old_start=old_instance.start_time if start_changed else None,
                old_end=old_instance.end_time if end_changed else None,
            )

        if status_changed and instance.status == 'cancelled' and old_instance.status != 'cancelled':
            existing_cancel = CancelRecord.objects.filter(rehearsal=instance).exists()
            if not existing_cancel:
                CancelRecord.objects.create(
                    rehearsal=instance,
                    cancelled_by=None,
                    reason='系统自动取消（后台操作）'
                )
            send_rehearsal_notification.delay(instance.id, 'cancel')
            PropUsage.objects.filter(rehearsal=instance).update(returned=True)

        if status_changed and instance.status == 'approved' and old_instance.status != 'approved':
            for member in instance.members.all():
                Attendance.objects.get_or_create(
                    rehearsal=instance,
                    member=member,
                    defaults={'status': 'absent'}
                )
            send_rehearsal_notification.delay(instance.id, 'info')


@receiver(pre_save, sender=PropUsage)
def validate_prop_usage(sender, instance, **kwargs):
    if not instance.pk:
        available = instance.prop.available_quantity(instance.rehearsal.date)
        if instance.quantity > available:
            raise ValidationError(
                f'道具 {instance.prop.name} 库存不足，可用: {available}，需要: {instance.quantity}'
            )


@receiver(post_save, sender=RoomMaintenance)
def handle_maintenance_save(sender, instance, created, **kwargs):
    if created and instance.status in ['scheduled', 'ongoing']:
        rehearsals = Rehearsal.objects.filter(
            room=instance.room,
            date__range=(instance.start_date, instance.end_date),
            status__in=['pending', 'approved', 'ongoing']
        )
        for rehearsal in rehearsals:
            rehearsal.status = 'cancelled'
            rehearsal.save()
            PropUsage.objects.filter(rehearsal=rehearsal).update(returned=True)
        instance.props_released = True
        instance.save(update_fields=['props_released'])
        send_room_maintenance_notification.delay(instance.id)


@receiver(post_save, sender=Attendance)
def handle_attendance_save(sender, instance, created, **kwargs):
    if instance.check_in_time and instance.status == 'present':
        try:
            rehearsal_start = datetime.combine(instance.rehearsal.date, instance.rehearsal.start_time)
            check_in = instance.check_in_time.replace(tzinfo=None)
            delta = check_in - rehearsal_start
            late_minutes = int(delta.total_seconds() / 60)
            if late_minutes > settings.LATE_THRESHOLD_MINUTES:
                Attendance.objects.filter(pk=instance.pk).update(
                    status='late',
                    late_minutes=late_minutes
                )
        except Exception:
            pass
