from typing import Dict, Any, Optional, List
from django.db import transaction
from django.contrib.contenttypes.models import ContentType
from core.services import BaseService
from core.validators import BaseValidator
from core.models import User
from .models import Notification, NotificationTemplate, NotificationPreference


class NotificationService(BaseService[Notification]):
    model = Notification

    def __init__(self, user: Optional[User] = None):
        super().__init__(user)

    def get_user_notifications(self, user_id: str, unread_only: bool = False) -> List[Notification]:
        queryset = self.get_queryset().filter(recipient_id=user_id)
        if unread_only:
            queryset = queryset.filter(is_read=False)
        return list(queryset.order_by('-created_at'))

    def get_unread_count(self, user_id: str) -> int:
        return self.get_queryset().filter(recipient_id=user_id, is_read=False).count()

    @transaction.atomic
    def mark_as_read(self, notification_id: str, user: User) -> Optional[Notification]:
        notification = self.get_by_id(notification_id)
        if notification and notification.recipient_id == user.id:
            from django.utils import timezone
            notification.is_read = True
            notification.read_at = timezone.now()
            notification.save()
            return notification
        return None

    @transaction.atomic
    def mark_all_as_read(self, user: User) -> int:
        return self.get_queryset().filter(
            recipient_id=user.id,
            is_read=False
        ).update(is_read=True)

    def _create_notification(
        self,
        recipient: User,
        type: str,
        title: str,
        content: str,
        priority: str = Notification.Priority.MEDIUM,
        related_object=None,
        action_url: str = '',
    ) -> Notification:
        content_type = None
        object_id = None
        if related_object:
            content_type = ContentType.objects.get_for_model(related_object)
            object_id = related_object.id

        return Notification.objects.create(
            recipient=recipient,
            type=type,
            priority=priority,
            title=title,
            content=content,
            content_type=content_type,
            object_id=object_id,
            action_url=action_url,
            created_by=self.user,
            updated_by=self.user,
        )

    def send_booking_created(self, booking):
        self._create_notification(
            recipient=booking.user,
            type=Notification.Type.BOOKING,
            priority=Notification.Priority.MEDIUM,
            title='预约提交成功',
            content=f'您已成功预约 {booking.equipment.name}，时间：{booking.start_time.strftime("%Y-%m-%d %H:%M")} 至 {booking.end_time.strftime("%H:%M")}',
            related_object=booking,
            action_url=f'/bookings/{booking.id}/',
        )

    def send_booking_approved(self, booking):
        self._create_notification(
            recipient=booking.user,
            type=Notification.Type.BOOKING,
            priority=Notification.Priority.HIGH,
            title='预约已确认',
            content=f'您的 {booking.equipment.name} 预约已确认，请按时到场使用。签到码：{booking.check_in_code}',
            related_object=booking,
            action_url=f'/bookings/{booking.id}/',
        )

    def send_booking_rejected(self, booking):
        self._create_notification(
            recipient=booking.user,
            type=Notification.Type.BOOKING,
            priority=Notification.Priority.HIGH,
            title='预约未通过',
            content=f'您的 {booking.equipment.name} 预约未通过审核。原因：{booking.approval_notes or "未说明"}',
            related_object=booking,
            action_url=f'/bookings/{booking.id}/',
        )

    def send_training_approved(self, application):
        self._create_notification(
            recipient=application.user,
            type=Notification.Type.TRAINING,
            priority=Notification.Priority.HIGH,
            title='培训申请已通过',
            content=f'您的 {application.session.course.name} 培训申请已通过，请按时参加培训。',
            related_object=application,
            action_url=f'/training/applications/{application.id}/',
        )

    def send_training_rejected(self, application):
        self._create_notification(
            recipient=application.user,
            type=Notification.Type.TRAINING,
            priority=Notification.Priority.HIGH,
            title='培训申请未通过',
            content=f'您的 {application.session.course.name} 培训申请未通过。原因：{application.review_notes or "未说明"}',
            related_object=application,
            action_url=f'/training/applications/{application.id}/',
        )

    def send_certification_issued(self, certification):
        self._create_notification(
            recipient=certification.user,
            type=Notification.Type.TRAINING,
            priority=Notification.Priority.HIGH,
            title='培训证书已颁发',
            content=f'恭喜！您已获得 {certification.course.name} 培训证书，证书编号：{certification.certificate_number}',
            related_object=certification,
            action_url=f'/training/certifications/{certification.id}/',
        )

    def send_fault_updated(self, ticket):
        self._create_notification(
            recipient=ticket.reporter,
            type=Notification.Type.MAINTENANCE,
            priority=Notification.Priority.MEDIUM,
            title='故障单状态更新',
            content=f'您上报的 {ticket.equipment.name} 故障单状态已更新为：{ticket.get_status_display()}',
            related_object=ticket,
            action_url=f'/maintenance/tickets/{ticket.id}/',
        )

    def send_consumable_low_stock(self, consumable, admin_users: List[User]):
        for admin in admin_users:
            self._create_notification(
                recipient=admin,
                type=Notification.Type.CONSUMABLE,
                priority=Notification.Priority.HIGH,
                title='耗材库存预警',
                content=f'耗材 {consumable.name} 当前库存：{consumable.current_stock} {consumable.unit}，已低于最低库存阈值。',
                related_object=consumable,
                action_url=f'/consumables/{consumable.id}/',
            )

    def send_safety_incident_updated(self, incident):
        if incident.reporter:
            self._create_notification(
                recipient=incident.reporter,
                type=Notification.Type.SAFETY,
                priority=Notification.Priority.HIGH,
                title='安全事件状态更新',
                content=f'您上报的安全事件 "{incident.title}" 状态已更新为：{incident.get_status_display()}',
                related_object=incident,
                action_url=f'/safety/incidents/{incident.id}/',
            )

    def send_system_notification(self, recipient: User, title: str, content: str,
                                 priority: str = Notification.Priority.MEDIUM):
        self._create_notification(
            recipient=recipient,
            type=Notification.Type.SYSTEM,
            priority=priority,
            title=title,
            content=content,
        )
