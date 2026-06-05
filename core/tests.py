from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.core.exceptions import ValidationError
from datetime import timedelta

from equipment.models import EquipmentCategory, Equipment
from training.models import (
    TrainingCourse, TrainingSession, TrainingApplication, TrainingCertification
)
from bookings.models import Booking
from notifications.models import Notification
from notifications.services import NotificationService
from bookings.services import BookingService
from training.services import TrainingCertificationService

User = get_user_model()


class UserModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123',
            real_name='测试用户',
            role=User.Role.MEMBER
        )

    def test_user_creation(self):
        self.assertEqual(self.user.email, 'test@example.com')
        self.assertEqual(self.user.real_name, '测试用户')
        self.assertEqual(self.user.role, User.Role.MEMBER)
        self.assertTrue(self.user.is_active)

    def test_user_role_permissions(self):
        self.assertFalse(self.user.is_trainer_or_admin)
        self.assertFalse(self.user.is_technician_or_admin)

        self.user.role = User.Role.ADMIN
        self.user.save()
        self.assertTrue(self.user.is_trainer_or_admin)
        self.assertTrue(self.user.is_technician_or_admin)


class BookingBusinessRuleTest(TestCase):
    def setUp(self):
        self.member = User.objects.create_user(
            email='member@example.com',
            password='testpass123',
            real_name='普通会员',
            role=User.Role.MEMBER
        )
        self.admin = User.objects.create_user(
            email='admin@example.com',
            password='testpass123',
            real_name='管理员',
            role=User.Role.ADMIN
        )
        self.trainer = User.objects.create_user(
            email='trainer@example.com',
            password='testpass123',
            real_name='培训师',
            role=User.Role.TRAINER
        )

        self.dangerous_category = EquipmentCategory.objects.create(
            name='激光切割机',
            requires_training=True,
            is_dangerous=True
        )
        self.normal_category = EquipmentCategory.objects.create(
            name='3D打印机',
            requires_training=True,
            is_dangerous=False
        )

        self.dangerous_equipment = Equipment.objects.create(
            name='激光切割机-01',
            category=self.dangerous_category,
            location='创客空间A区',
            status=Equipment.Status.AVAILABLE,
            max_booking_hours=4
        )
        self.normal_equipment = Equipment.objects.create(
            name='3D打印机-01',
            category=self.normal_category,
            location='创客空间B区',
            status=Equipment.Status.AVAILABLE,
            max_booking_hours=8
        )

    def test_cannot_book_dangerous_equipment_without_certification(self):
        service = BookingService(self.member)
        start_time = timezone.now() + timedelta(hours=1)
        end_time = start_time + timedelta(hours=2)

        with self.assertRaises(ValidationError) as cm:
            service.create({
                'equipment': self.dangerous_equipment,
                'start_time': start_time,
                'end_time': end_time,
                'purpose': '测试项目',
            })

        self.assertIn('危险设备必须先通过培训', str(cm.exception))

    def test_cannot_book_equipment_without_training(self):
        service = BookingService(self.member)
        start_time = timezone.now() + timedelta(hours=1)
        end_time = start_time + timedelta(hours=2)

        with self.assertRaises(ValidationError) as cm:
            service.create({
                'equipment': self.normal_equipment,
                'start_time': start_time,
                'end_time': end_time,
                'purpose': '测试项目',
            })

        self.assertIn('尚未通过', str(cm.exception))

    def test_can_book_equipment_with_certification(self):
        course = TrainingCourse.objects.create(
            name='3D打印基础培训',
            category=self.normal_category,
            description='基础操作培训',
            status='published'
        )
        TrainingCertification.objects.create(
            user=self.member,
            course=course,
            category=self.normal_category,
            issued_date=timezone.now().date(),
            issued_by=self.admin,
            certificate_number='CERT-TEST001',
            status='valid'
        )

        service = BookingService(self.member)
        start_time = timezone.now() + timedelta(hours=1)
        end_time = start_time + timedelta(hours=2)

        booking = service.create({
            'equipment': self.normal_equipment,
            'start_time': start_time,
            'end_time': end_time,
            'purpose': '测试项目',
        })

        self.assertEqual(booking.status, Booking.Status.APPROVED)
        self.assertEqual(booking.user, self.member)

    def test_booking_conflict_detection(self):
        course = TrainingCourse.objects.create(
            name='3D打印基础培训',
            category=self.normal_category,
            description='基础操作培训',
            status='published'
        )
        TrainingCertification.objects.create(
            user=self.member,
            course=course,
            category=self.normal_category,
            issued_date=timezone.now().date(),
            issued_by=self.admin,
            certificate_number='CERT-TEST001',
            status='valid'
        )

        service = BookingService(self.member)
        start_time = timezone.now() + timedelta(hours=1)
        end_time = start_time + timedelta(hours=2)

        service.create({
            'equipment': self.normal_equipment,
            'start_time': start_time,
            'end_time': end_time,
            'purpose': '测试项目1',
        })

        with self.assertRaises(ValidationError) as cm:
            service.create({
                'equipment': self.normal_equipment,
                'start_time': start_time + timedelta(minutes=30),
                'end_time': end_time + timedelta(minutes=30),
                'purpose': '测试项目2',
            })

        self.assertIn('该时间段已有预约', str(cm.exception))


class NotificationServiceTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='user@example.com',
            password='testpass123',
            real_name='测试用户',
            role=User.Role.MEMBER
        )
        self.admin = User.objects.create_user(
            email='admin@example.com',
            password='testpass123',
            real_name='管理员',
            role=User.Role.ADMIN
        )
        self.category = EquipmentCategory.objects.create(
            name='测试设备类别',
            requires_training=False,
            is_dangerous=False
        )
        self.equipment = Equipment.objects.create(
            name='测试设备',
            category=self.category,
            location='测试位置',
            status=Equipment.Status.AVAILABLE
        )
        self.course = TrainingCourse.objects.create(
            name='测试培训课程',
            category=self.category,
            description='测试课程描述',
            status='published'
        )

    def test_send_booking_created_notification(self):
        booking = Booking.objects.create(
            equipment=self.equipment,
            user=self.user,
            start_time=timezone.now() + timedelta(hours=1),
            end_time=timezone.now() + timedelta(hours=2),
            purpose='测试预约',
            status=Booking.Status.APPROVED,
            check_in_code='TEST123',
            created_by=self.user,
            updated_by=self.user
        )

        service = NotificationService(self.user)
        service.send_booking_created(booking)

        notification = Notification.objects.filter(recipient=self.user).first()
        self.assertIsNotNone(notification)
        self.assertEqual(notification.type, Notification.Type.BOOKING)
        self.assertIn('预约提交成功', notification.title)
        self.assertFalse(notification.is_read)

    def test_send_certification_issued_notification(self):
        certification = TrainingCertification.objects.create(
            user=self.user,
            course=self.course,
            category=self.category,
            issued_date=timezone.now().date(),
            issued_by=self.admin,
            certificate_number='CERT-TEST002',
            status='valid',
            created_by=self.admin,
            updated_by=self.admin
        )

        service = NotificationService(self.admin)
        service.send_certification_issued(certification)

        notification = Notification.objects.filter(
            recipient=self.user,
            type=Notification.Type.TRAINING
        ).first()
        self.assertIsNotNone(notification)
        self.assertIn('培训证书已颁发', notification.title)
        self.assertIn('CERT-TEST002', notification.content)

    def test_mark_notification_as_read(self):
        notification = Notification.objects.create(
            recipient=self.user,
            type=Notification.Type.SYSTEM,
            priority=Notification.Priority.MEDIUM,
            title='测试通知',
            content='测试通知内容',
            created_by=self.admin,
            updated_by=self.admin
        )

        service = NotificationService(self.user)
        result = service.mark_as_read(str(notification.id), self.user)

        self.assertIsNotNone(result)
        self.assertTrue(result.is_read)
        self.assertIsNotNone(result.read_at)

    def test_get_unread_count(self):
        Notification.objects.create(
            recipient=self.user,
            type=Notification.Type.SYSTEM,
            priority=Notification.Priority.MEDIUM,
            title='未读通知1',
            content='内容1',
            created_by=self.admin,
            updated_by=self.admin
        )
        Notification.objects.create(
            recipient=self.user,
            type=Notification.Type.SYSTEM,
            priority=Notification.Priority.MEDIUM,
            title='已读通知',
            content='内容2',
            is_read=True,
            created_by=self.admin,
            updated_by=self.admin
        )

        service = NotificationService(self.user)
        count = service.get_unread_count(self.user.id)

        self.assertEqual(count, 1)


class AttachmentAndHistoryTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='user@example.com',
            password='testpass123',
            real_name='测试用户',
            role=User.Role.MEMBER
        )
        self.admin = User.objects.create_user(
            email='admin@example.com',
            password='testpass123',
            real_name='管理员',
            role=User.Role.ADMIN
        )
        self.category = EquipmentCategory.objects.create(
            name='测试设备类别',
            requires_training=False,
            is_dangerous=False
        )
        self.equipment = Equipment.objects.create(
            name='测试设备',
            category=self.category,
            location='测试位置',
            status=Equipment.Status.AVAILABLE,
            created_by=self.admin,
            updated_by=self.admin
        )

    def test_equipment_status_history_tracking(self):
        from auditlog.models import LogEntry
        from django.contrib.contenttypes.models import ContentType

        self.equipment.status = Equipment.Status.MAINTENANCE
        self.equipment.updated_by = self.admin
        self.equipment.save()

        content_type = ContentType.objects.get_for_model(self.equipment)
        log_entries = LogEntry.objects.filter(
            content_type=content_type,
            object_pk=str(self.equipment.id)
        ).order_by('-timestamp')

        self.assertGreaterEqual(log_entries.count(), 1)

    def test_booking_status_flow(self):
        booking = Booking.objects.create(
            equipment=self.equipment,
            user=self.user,
            start_time=timezone.now() + timedelta(hours=1),
            end_time=timezone.now() + timedelta(hours=2),
            purpose='测试预约',
            status=Booking.Status.PENDING,
            check_in_code='TEST123',
            created_by=self.user,
            updated_by=self.user
        )

        self.assertEqual(booking.status, Booking.Status.PENDING)

        booking.status = Booking.Status.APPROVED
        booking.approved_by = self.admin
        booking.approved_at = timezone.now()
        booking.updated_by = self.admin
        booking.save()

        booking.status = Booking.Status.IN_PROGRESS
        booking.actual_start_time = timezone.now()
        booking.updated_by = self.user
        booking.save()

        booking.status = Booking.Status.COMPLETED
        booking.actual_end_time = timezone.now()
        booking.updated_by = self.user
        booking.save()

        from auditlog.models import LogEntry
        from django.contrib.contenttypes.models import ContentType
        content_type = ContentType.objects.get_for_model(booking)
        log_entries = LogEntry.objects.filter(
            content_type=content_type,
            object_pk=str(booking.id),
        )

        self.assertGreaterEqual(log_entries.count(), 4)

    def test_training_application_audit_trail(self):
        course = TrainingCourse.objects.create(
            name='测试培训课程',
            category=self.category,
            description='测试课程',
            status='published',
            created_by=self.admin,
            updated_by=self.admin
        )
        session = TrainingSession.objects.create(
            course=course,
            trainer=self.admin,
            start_time=timezone.now() + timedelta(days=1),
            end_time=timezone.now() + timedelta(days=1, hours=2),
            location='培训室',
            max_participants=10,
            created_by=self.admin,
            updated_by=self.admin
        )

        application = TrainingApplication.objects.create(
            session=session,
            user=self.user,
            status=TrainingApplication.Status.PENDING,
            created_by=self.user,
            updated_by=self.user
        )

        application.status = TrainingApplication.Status.APPROVED
        application.reviewed_by = self.admin
        application.reviewed_at = timezone.now()
        application.updated_by = self.admin
        application.save()

        from auditlog.models import LogEntry
        from django.contrib.contenttypes.models import ContentType
        content_type = ContentType.objects.get_for_model(application)
        log_entries = LogEntry.objects.filter(
            content_type=content_type,
            object_pk=str(application.id),
        )

        self.assertGreaterEqual(log_entries.count(), 2)

    def test_fault_ticket_attachments(self):
        from maintenance.models import FaultTicket, FaultAttachment

        ticket = FaultTicket.objects.create(
            equipment=self.equipment,
            reporter=self.user,
            title='测试故障',
            description='设备无法正常启动',
            priority='medium',
            status='open',
            created_by=self.user,
            updated_by=self.user
        )

        attachment = FaultAttachment.objects.create(
            ticket=ticket,
            file='fault_attachments/test.jpg',
            file_name='故障照片.jpg',
            uploaded_by=self.user
        )

        self.assertEqual(ticket.attachments.count(), 1)
        self.assertEqual(attachment.file_name, '故障照片.jpg')
        self.assertEqual(attachment.uploaded_by, self.user)
