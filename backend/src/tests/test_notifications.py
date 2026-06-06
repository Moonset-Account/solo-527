from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from apps.notifications.models import Notification, NotificationAttachment, Message, NotificationRead
from apps.children.models import Child, ChildClass, AuthorizedPickupPerson
from apps.pickup.models import PickupRecord
from apps.payments.models import PaymentItem, Invoice
import tempfile
from django.core.files.uploadedfile import SimpleUploadedFile

User = get_user_model()


class NotificationTestCase(APITestCase):
    def setUp(self):
        self.director = User.objects.create_user(
            phone='13800000001',
            password='testpass123',
            name='园长',
            role='director'
        )
        self.teacher = User.objects.create_user(
            phone='13800000002',
            password='testpass123',
            name='老师',
            role='teacher'
        )
        self.parent = User.objects.create_user(
            phone='13800000003',
            password='testpass123',
            name='家长',
            role='parent'
        )
        self.child_class = ChildClass.objects.create(
            name='小班一班',
            capacity=20,
            created_by=self.director
        )
        self.child = Child.objects.create(
            name='小明',
            gender='male',
            birth_date='2020-01-15',
            child_class=self.child_class,
            enrollment_date='2023-09-01',
            emergency_contact='家长',
            emergency_phone='13800000003',
            created_by=self.director
        )
        self.client = APIClient()

    def test_create_notification(self):
        self.client.force_authenticate(user=self.director)
        data = {
            'title': '放假通知',
            'content': '国庆节放假通知：10月1日至7日放假',
            'type': 'system',
            'target_type': 'all'
        }
        response = self.client.post('/api/notifications/notifications/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Notification.objects.count(), 1)
        notification = Notification.objects.first()
        self.assertEqual(notification.title, '放假通知')
        self.assertEqual(notification.status, 'draft')
        self.assertEqual(notification.created_by, self.director)

    def test_publish_notification(self):
        self.client.force_authenticate(user=self.director)
        notification = Notification.objects.create(
            title='测试通知',
            content='测试内容',
            type='daily',
            target_type='all',
            created_by=self.director
        )
        response = self.client.post(f'/api/notifications/notifications/{notification.id}/publish/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        notification.refresh_from_db()
        self.assertEqual(notification.status, 'published')
        self.assertIsNotNone(notification.published_at)
        self.assertEqual(notification.published_by, self.director)

    def test_mark_notification_read(self):
        self.client.force_authenticate(user=self.parent)
        notification = Notification.objects.create(
            title='测试通知',
            content='测试内容',
            type='daily',
            target_type='all',
            status='published',
            published_at=timezone.now(),
            published_by=self.director,
            created_by=self.director
        )
        response = self.client.post(f'/api/notifications/notifications/{notification.id}/mark_read/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(NotificationRead.objects.filter(
            notification=notification,
            user=self.parent
        ).exists())

    def test_notification_history_tracking(self):
        notification = Notification.objects.create(
            title='历史追踪测试',
            content='测试内容',
            type='daily',
            target_type='all',
            created_by=self.director
        )
        notification.title = '修改后的标题'
        notification.updated_by = self.teacher
        notification.save()

        notification.status = 'published'
        notification.published_at = timezone.now()
        notification.published_by = self.director
        notification.updated_by = self.director
        notification.save()

        self.assertEqual(notification.created_by, self.director)
        self.assertEqual(notification.updated_by, self.director)
        self.assertIsNotNone(notification.created_at)
        self.assertIsNotNone(notification.updated_at)

    def test_notification_attachment(self):
        self.client.force_authenticate(user=self.director)
        notification = Notification.objects.create(
            title='带附件的通知',
            content='请查看附件',
            type='daily',
            target_type='all',
            created_by=self.director
        )
        test_file = SimpleUploadedFile("test.txt", b"file_content", content_type="text/plain")
        attachment = NotificationAttachment.objects.create(
            notification=notification,
            file=test_file,
            file_name='test.txt',
            file_size=len(b"file_content")
        )
        self.assertEqual(notification.attachments.count(), 1)
        self.assertEqual(attachment.file_name, 'test.txt')

    def test_acknowledge_notification(self):
        self.client.force_authenticate(user=self.parent)
        notification = Notification.objects.create(
            title='需要确认的通知',
            content='请确认收到',
            type='urgent',
            target_type='all',
            status='published',
            need_ack=True,
            published_at=timezone.now(),
            published_by=self.director,
            created_by=self.director
        )
        response = self.client.post(f'/api/notifications/notifications/{notification.id}/mark_ack/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        read_obj = NotificationRead.objects.get(notification=notification, user=self.parent)
        self.assertIsNotNone(read_obj.ack_at)

    def test_unread_count(self):
        self.client.force_authenticate(user=self.parent)
        for i in range(3):
            Notification.objects.create(
                title=f'通知{i}',
                content=f'内容{i}',
                type='daily',
                target_type='all',
                status='published',
                published_at=timezone.now(),
                published_by=self.director,
                created_by=self.director
            )
        response = self.client.get('/api/notifications/notifications/unread_count/')
        self.assertEqual(response.data['unread_count'], 3)


class MessageTestCase(APITestCase):
    def setUp(self):
        self.teacher = User.objects.create_user(
            phone='13800000002',
            password='testpass123',
            name='老师',
            role='teacher'
        )
        self.parent = User.objects.create_user(
            phone='13800000003',
            password='testpass123',
            name='家长',
            role='parent'
        )
        self.client = APIClient()

    def test_send_message(self):
        self.client.force_authenticate(user=self.teacher)
        data = {
            'receiver': self.parent.id,
            'content': '您好，孩子今天表现很好',
            'type': 'text'
        }
        response = self.client.post('/api/notifications/messages/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        message = Message.objects.first()
        self.assertEqual(message.sender, self.teacher)
        self.assertEqual(message.receiver, self.parent)
        self.assertFalse(message.is_read)

    def test_mark_message_read(self):
        message = Message.objects.create(
            sender=self.teacher,
            receiver=self.parent,
            content='测试消息',
            type='text',
            created_by=self.teacher
        )
        self.client.force_authenticate(user=self.parent)
        response = self.client.post(f'/api/notifications/messages/{message.id}/mark_read/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        message.refresh_from_db()
        self.assertTrue(message.is_read)
        self.assertIsNotNone(message.read_at)

    def test_conversation_list(self):
        for i in range(5):
            Message.objects.create(
                sender=self.teacher,
                receiver=self.parent,
                content=f'消息{i}',
                type='text',
                created_by=self.teacher
            )
        self.client.force_authenticate(user=self.parent)
        response = self.client.get('/api/notifications/messages/conversations/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['unread_count'], 5)


class HistoryTrackingTestCase(APITestCase):
    def setUp(self):
        self.director = User.objects.create_user(
            phone='13800000001',
            password='testpass123',
            name='园长',
            role='director'
        )
        self.teacher = User.objects.create_user(
            phone='13800000002',
            password='testpass123',
            name='老师',
            role='teacher'
        )
        self.child_class = ChildClass.objects.create(
            name='小班一班',
            capacity=20,
            created_by=self.director
        )
        self.child = Child.objects.create(
            name='小明',
            gender='male',
            birth_date='2020-01-15',
            child_class=self.child_class,
            enrollment_date='2023-09-01',
            emergency_contact='家长',
            emergency_phone='13800000003',
            created_by=self.director
        )
        self.client = APIClient()

    def test_pickup_record_audit_trail(self):
        self.client.force_authenticate(user=self.teacher)
        record = PickupRecord.objects.create(
            child=self.child,
            pickup_type='pickup',
            pickup_person_name='爸爸',
            pickup_person_phone='13800000003',
            pickup_person_relation='父亲',
            created_by=self.teacher
        )
        self.assertEqual(record.created_by, self.teacher)

        record.status = 'verified'
        record.verified_by = self.teacher
        record.verified_at = timezone.now()
        record.updated_by = self.teacher
        record.save()

        self.assertEqual(record.verified_by, self.teacher)
        self.assertIsNotNone(record.verified_at)
        self.assertIsNotNone(record.created_at)
        self.assertIsNotNone(record.updated_at)

    def test_authorized_person_tracking(self):
        person = AuthorizedPickupPerson.objects.create(
            child=self.child,
            name='爷爷',
            phone='13900000001',
            relation='祖父',
            is_active=True,
            created_by=self.director
        )
        person.name = '爷爷（更新）'
        person.updated_by = self.teacher
        person.save()

        self.assertEqual(person.created_by, self.director)
        self.assertEqual(person.updated_by, self.teacher)
        self.assertIsNotNone(person.created_at)
        self.assertIsNotNone(person.updated_at)

    def test_invoice_payment_tracking(self):
        item = PaymentItem.objects.create(
            name='9月托费',
            default_amount=3000,
            created_by=self.director
        )
        invoice = Invoice.objects.create(
            child=self.child,
            item=item,
            amount=3000,
            bill_date='2024-09-01',
            due_date='2024-09-10',
            created_by=self.director
        )
        invoice.status = 'paid'
        invoice.paid_amount = 3000
        invoice.paid_at = timezone.now()
        invoice.paid_by = self.teacher
        invoice.updated_by = self.teacher
        invoice.save()

        self.assertEqual(invoice.created_by, self.director)
        self.assertEqual(invoice.paid_by, self.teacher)
        self.assertIsNotNone(invoice.paid_at)
        self.assertIsNotNone(invoice.updated_at)
