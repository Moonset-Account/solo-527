from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
from .models import Message, Rehearsal, Member


@shared_task
def send_email_task(subject, message, recipient_list):
    try:
        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            recipient_list,
            fail_silently=False,
        )
        return True
    except Exception as e:
        print(f"发送邮件失败: {e}")
        return False


@shared_task
def send_rehearsal_notification(rehearsal_id, message_type='info'):
    try:
        rehearsal = Rehearsal.objects.get(id=rehearsal_id)
        members = rehearsal.members.all()
        member_emails = [m.email for m in members if m.email]

        title_map = {
            'info': f'排练通知: {rehearsal.play.title}',
            'change': f'排练变动通知: {rehearsal.play.title}',
            'cancel': f'排练取消通知: {rehearsal.play.title}',
        }
        content_map = {
            'info': f'''
剧目: {rehearsal.play.title}
排练室: {rehearsal.room.name}
时间: {rehearsal.date} {rehearsal.start_time} - {rehearsal.end_time}
导演: {rehearsal.director.name}
备注: {rehearsal.notes or '无'}
            ''',
            'change': f'''
剧目: {rehearsal.play.title}
排练信息已变更:
排练室: {rehearsal.room.name}
时间: {rehearsal.date} {rehearsal.start_time} - {rehearsal.end_time}
请留意最新安排。
            ''',
            'cancel': f'''
剧目: {rehearsal.play.title}
原定于 {rehearsal.date} {rehearsal.start_time} 的排练已取消。
排练室: {rehearsal.room.name}
            ''',
        }

        title = title_map.get(message_type, title_map['info'])
        content = content_map.get(message_type, content_map['info'])

        message_obj = Message.objects.create(
            type=message_type,
            title=title,
            content=content,
            rehearsal=rehearsal,
        )
        message_obj.recipients.set(members)

        if member_emails:
            send_email_task.delay(title, content.strip(), member_emails)

        return True
    except Rehearsal.DoesNotExist:
        return False


@shared_task
def send_change_notification(rehearsal_id, old_room_id=None, old_date=None, old_start=None, old_end=None):
    try:
        rehearsal = Rehearsal.objects.get(id=rehearsal_id)
        members = rehearsal.members.all()
        member_emails = [m.email for m in members if m.email]

        old_info = ''
        if old_room_id or old_date or old_start or old_end:
            from .models import Room
            old_room = Room.objects.get(id=old_room_id) if old_room_id else rehearsal.room
            old_info = f'''
原安排:
排练室: {old_room.name if old_room_id else rehearsal.room.name}
时间: {old_date or rehearsal.date} {old_start or rehearsal.start_time} - {old_end or rehearsal.end_time}
            '''

        content = f'''
剧目: {rehearsal.play.title}
排练安排有变动！
{old_info}
新安排:
排练室: {rehearsal.room.name}
时间: {rehearsal.date} {rehearsal.start_time} - {rehearsal.end_time}
请务必留意最新安排，准时参加。
        '''

        message_obj = Message.objects.create(
            type='change',
            title=f'排练变动通知: {rehearsal.play.title}',
            content=content,
            rehearsal=rehearsal,
        )
        message_obj.recipients.set(members)

        if member_emails:
            send_email_task.delay(
                f'排练变动通知: {rehearsal.play.title}',
                content.strip(),
                member_emails
            )

        return True
    except (Rehearsal.DoesNotExist, Exception) as e:
        print(f"发送变动通知失败: {e}")
        return False


@shared_task
def send_room_maintenance_notification(maintenance_id):
    try:
        from .models import RoomMaintenance, Rehearsal
        maintenance = RoomMaintenance.objects.get(id=maintenance_id)

        rehearsals = Rehearsal.objects.filter(
            room=maintenance.room,
            date__range=(maintenance.start_date, maintenance.end_date),
            status__in=['pending', 'approved', 'ongoing']
        )

        for rehearsal in rehearsals:
            members = rehearsal.members.all()
            member_emails = [m.email for m in members if m.email]

            content = f'''
通知: {maintenance.room.name} 将于 {maintenance.start_date} 至 {maintenance.end_date} 进行维修。
您参与的排练 "{rehearsal.play.title}" (原定于 {rehearsal.date} {rehearsal.start_time}) 已被取消。
维修原因: {maintenance.description}
请等待重新安排。
            '''

            message_obj = Message.objects.create(
                type='warning',
                title=f'排练室维修通知: {maintenance.room.name}',
                content=content,
                rehearsal=rehearsal,
            )
            message_obj.recipients.set(members)

            if member_emails:
                send_email_task.delay(
                    f'排练室维修通知: {maintenance.room.name}',
                    content.strip(),
                    member_emails
                )

        return True
    except Exception as e:
        print(f"发送维修通知失败: {e}")
        return False


@shared_task
def check_and_update_rehearsal_status():
    now = timezone.now()
    today = now.date()
    current_time = now.time()

    ongoing_rehearsals = Rehearsal.objects.filter(
        date=today,
        start_time__lte=current_time,
        end_time__gt=current_time,
        status='approved'
    )
    ongoing_rehearsals.update(status='ongoing')

    completed_rehearsals = Rehearsal.objects.filter(
        date__lt=today,
        status__in=['approved', 'ongoing']
    )
    completed_rehearsals |= Rehearsal.objects.filter(
        date=today,
        end_time__lte=current_time,
        status__in=['approved', 'ongoing']
    )
    for rehearsal in completed_rehearsals:
        rehearsal.status = 'completed'
        rehearsal.save()

    return True
