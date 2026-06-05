from datetime import datetime
from extensions import db
from models import Notification, Member, User

def create_notification(type, recipient_type, recipient_id, subject, content, related_type=None, related_id=None):
    notification = Notification(
        type=type,
        recipient_type=recipient_type,
        recipient_id=recipient_id,
        subject=subject,
        content=content,
        related_type=related_type,
        related_id=related_id,
        status='pending'
    )
    
    if recipient_type == 'member':
        member = Member.query.get(recipient_id)
        if member:
            notification.recipient_email = member.email
            notification.recipient_phone = member.phone
    elif recipient_type == 'user':
        user = User.query.get(recipient_id)
        if user:
            notification.recipient_email = user.email
    
    db.session.add(notification)
    db.session.commit()
    
    return notification

def send_booking_confirmation(booking):
    member = booking.member
    screening = booking.screening
    film = screening.film
    
    subject = f'报名确认：{film.title}'
    content = f'''
尊敬的{member.name}会员：

您已成功报名参加以下放映活动：

影片：{film.title}
时间：{screening.start_time.strftime('%Y年%m月%d日 %H:%M')}
场地：{screening.hall.name}
报名编号：{booking.booking_no}

请提前15分钟到场，凭会员卡号或报名编号签到入场。

此致
独立影院会员服务中心
'''
    
    create_notification(
        type='booking_confirmed',
        recipient_type='member',
        recipient_id=member.id,
        subject=subject,
        content=content,
        related_type='booking',
        related_id=booking.id
    )

def send_waitlist_promoted(booking):
    member = booking.member
    screening = booking.screening
    film = screening.film
    
    subject = f'候补转正通知：{film.title}'
    content = f'''
尊敬的{member.name}会员：

恭喜您！您候补的以下放映活动已有空位，您已自动转正：

影片：{film.title}
时间：{screening.start_time.strftime('%Y年%m月%d日 %H:%M')}
场地：{screening.hall.name}
报名编号：{booking.booking_no}

请在24小时内确认是否参加，逾期名额将自动释放给下一位候补会员。

此致
独立影院会员服务中心
'''
    
    create_notification(
        type='waitlist_promoted',
        recipient_type='member',
        recipient_id=member.id,
        subject=subject,
        content=content,
        related_type='booking',
        related_id=booking.id
    )

def send_booking_cancellation(booking, reason=''):
    member = booking.member
    screening = booking.screening
    film = screening.film
    
    subject = f'报名取消通知：{film.title}'
    content = f'''
尊敬的{member.name}会员：

您的以下放映活动报名已取消：

影片：{film.title}
时间：{screening.start_time.strftime('%Y年%m月%d日 %H:%M')}
报名编号：{booking.booking_no}
{reason}

如有疑问，请联系我们的客服。

此致
独立影院会员服务中心
'''
    
    create_notification(
        type='booking_cancelled',
        recipient_type='member',
        recipient_id=member.id,
        subject=subject,
        content=content,
        related_type='booking',
        related_id=booking.id
    )

def send_guest_invitation(guest):
    screening = guest.screening
    film = screening.film
    
    subject = f'邀请函：{film.title} 特别放映'
    content = f'''
尊敬的{guest.name}先生/女士：

诚邀您参加我们的特别放映活动：

影片：{film.title}
时间：{screening.start_time.strftime('%Y年%m月%d日 %H:%M')}
场地：{screening.hall.name}
{guest.notes or ''}

期待您的光临！

此致
独立影院策展团队
'''
    
    notification = Notification(
        type='guest_invitation',
        recipient_type='guest',
        recipient_id=guest.id,
        recipient_email=guest.email,
        recipient_phone=guest.phone,
        subject=subject,
        content=content,
        related_type='guest',
        related_id=guest.id,
        status='pending'
    )
    db.session.add(notification)
    db.session.commit()
    
    return notification

def send_screening_reminder(screening):
    film = screening.film
    bookings = [b for b in screening.bookings if b.status == 'confirmed']
    
    for booking in bookings:
        member = booking.member
        subject = f'观影提醒：{film.title} 将于明天放映'
        content = f'''
尊敬的{member.name}会员：

温馨提醒，您报名的放映活动将于明天举行：

影片：{film.title}
时间：{screening.start_time.strftime('%Y年%m月%d日 %H:%M')}
场地：{screening.hall.name}
报名编号：{booking.booking_no}

请提前15分钟到场签到。

此致
独立影院会员服务中心
'''
        
        create_notification(
            type='screening_reminder',
            recipient_type='member',
            recipient_id=member.id,
            subject=subject,
            content=content,
            related_type='screening',
            related_id=screening.id
        )
