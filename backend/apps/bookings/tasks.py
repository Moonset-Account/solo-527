from __future__ import absolute_import, unicode_literals
from celery import shared_task
from django.utils import timezone
from datetime import timedelta
from django.conf import settings
from .models import Booking, BookingReminder
from apps.dashboard.models import Alert


@shared_task
def send_booking_reminder(reminder_id):
    try:
        reminder = BookingReminder.objects.get(id=reminder_id)
        if reminder.status != 'pending':
            return f'Reminder {reminder_id} already processed'
        
        message = reminder.content
        success = True
        
        if reminder.reminder_type == 'sms':
            success = send_sms(reminder.booking.contact_phone, message)
        elif reminder.reminder_type == 'wechat':
            success = send_wechat_message(reminder.booking.member, message)
        elif reminder.reminder_type == 'app':
            success = send_app_push(reminder.booking.member, message)
        elif reminder.reminder_type == 'phone':
            success = True
        
        if success:
            reminder.status = 'sent'
            reminder.sent_time = timezone.now()
            reminder.booking.reminder_sent = True
            reminder.booking.save()
        else:
            reminder.status = 'failed'
            reminder.error_message = '发送失败'
        
        reminder.save()
        return f'Reminder {reminder_id} {reminder.status}'
    except BookingReminder.DoesNotExist:
        return f'Reminder {reminder_id} not found'
    except Exception as e:
        return f'Error sending reminder {reminder_id}: {str(e)}'


def send_sms(phone, message):
    return True


def send_wechat_message(user, message):
    return True


def send_app_push(user, message):
    return True


@shared_task
def batch_send_due_reminders():
    now = timezone.now()
    pending_reminders = BookingReminder.objects.filter(
        status='pending',
        scheduled_time__lte=now
    )
    
    count = 0
    for reminder in pending_reminders:
        send_booking_reminder.delay(reminder.id)
        count += 1
    
    return f'Scheduled {count} reminders to send'


@shared_task
def create_automatic_reminders():
    now = timezone.now()
    tomorrow = now + timedelta(days=1)
    
    bookings = Booking.objects.filter(
        status__in=['pending', 'confirmed'],
        booking_date=tomorrow.date(),
        reminder_sent=False
    )
    
    count = 0
    for booking in bookings:
        reminder_content = f'【提醒】您预约的{booking.get_booking_type_display()}将于明天{booking.booking_time}开始，请准时到店。'
        
        BookingReminder.objects.create(
            booking=booking,
            reminder_type='sms',
            scheduled_time=tomorrow.replace(hour=9, minute=0, second=0),
            content=reminder_content,
            is_demo=booking.is_demo
        )
        
        BookingReminder.objects.create(
            booking=booking,
            reminder_type='wechat',
            scheduled_time=tomorrow.replace(hour=9, minute=0, second=0),
            content=reminder_content,
            is_demo=booking.is_demo
        )
        
        count += 1
    
    return f'Created reminders for {count} bookings'


@shared_task
def check_no_show_bookings():
    now = timezone.now()
    today = now.date()
    current_time = now.time()
    
    no_show_bookings = Booking.objects.filter(
        status='confirmed',
        booking_date=today,
        booking_time__lt=current_time,
        arrival_time__isnull=True
    )
    
    count = 0
    for booking in no_show_bookings:
        time_diff = (now - timezone.make_aware(timezone.datetime.combine(today, booking.booking_time))).total_seconds()
        if time_diff > 1800:
            booking.status = 'no_show'
            booking.save()
            
            Alert.objects.create(
                alert_type='warning',
                source='booking',
                title='客户未到店',
                message=f'预约{booking.order_no}客户未按时到店，已标记为未到店。联系电话：{booking.contact_phone}',
                related_id=booking.id,
                related_model='bookings.Booking',
                assigned_to=booking.assigned_staff,
                is_action_required=True,
                is_demo=booking.is_demo
            )
            
            funnel = getattr(booking, 'conversion_funnel', None)
            if funnel:
                from apps.conversion.models import ConversionReminder
                ConversionReminder.objects.create(
                    funnel=funnel,
                    reminder_type='no_show',
                    assigned_to=booking.assigned_staff,
                    scheduled_time=now + timedelta(hours=1),
                    notes='客户未到店，需要跟进',
                    is_demo=booking.is_demo
                )
            
            count += 1
    
    return f'Marked {count} bookings as no_show'


@shared_task
def auto_confirm_bookings():
    now = timezone.now()
    
    pending_bookings = Booking.objects.filter(
        status='pending',
        created_at__lte=now - timedelta(minutes=30)
    )
    
    count = 0
    for booking in pending_bookings:
        booking.status = 'confirmed'
        booking.save()
        count += 1
    
    return f'Auto-confirmed {count} bookings'
