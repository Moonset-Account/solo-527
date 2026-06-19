from django.test import TestCase, override_settings
from django.contrib.auth import get_user_model
from django.utils import timezone
from common.tests import TestUserMixin

User = get_user_model()


class VotingQualificationExceptionTest(TestCase, TestUserMixin):
    def setUp(self):
        self.rep = self.create_representative()
        self.resident_user = self.create_user('resident1', role='resident')
        self.voter_user = self.create_user('voter1', role='resident')
        
        from residents.models import Resident
        self.resident = Resident.objects.create(
            user=self.resident_user,
            household_type='ordinary',
            is_voter_qualified=False,
            qualification_exception_reason='户口未在本社区'
        )
        self.qualified_resident = Resident.objects.create(
            user=self.voter_user,
            household_type='ordinary',
            is_voter_qualified=True
        )

        from topics.models import Topic
        self.topic = Topic.objects.create(
            title='测试议题',
            description='测试议题描述',
            category='infrastructure',
            priority='high',
            status='voting',
            proposed_by=self.rep,
            representative=self.rep,
            community='测试社区',
            voting_start_time=timezone.now()
        )

    def test_vote_qualification_exception_detection(self):
        from voting.models import Vote
        
        vote = Vote.objects.create(
            topic=self.topic,
            voter=self.resident_user,
            vote='yes',
            ip_address='127.0.0.1'
        )
        
        self.assertTrue(vote.has_qualification_exception)
        self.assertFalse(vote.exception_handled)

    def test_qualified_vote_no_exception(self):
        from voting.models import Vote
        
        vote = Vote.objects.create(
            topic=self.topic,
            voter=self.voter_user,
            vote='yes',
            ip_address='127.0.0.1'
        )
        
        self.assertFalse(vote.has_qualification_exception)

    def test_exception_task_created(self):
        from voting.models import Vote
        from tasks.models import Task
        
        initial_task_count = Task.objects.filter(type='qualification_exception').count()
        
        vote = Vote.objects.create(
            topic=self.topic,
            voter=self.resident_user,
            vote='yes',
            ip_address='127.0.0.1'
        )
        
        task_count = Task.objects.filter(type='qualification_exception').count()
        self.assertEqual(task_count, initial_task_count + 1)
        
        task = Task.objects.filter(type='qualification_exception').latest('created_at')
        self.assertIn('投票资格异常', task.title)
        self.assertEqual(task.related_resident, self.resident)

    def test_handle_exception_writes_to_assistance_progress(self):
        from voting.models import Vote
        from assistance.models import AssistanceProgress
        
        vote = Vote.objects.create(
            topic=self.topic,
            voter=self.resident_user,
            vote='yes',
            ip_address='127.0.0.1'
        )
        
        from voting.views import VoteViewSet
        from rest_framework.test import APIRequestFactory
        from rest_framework.parsers import JSONParser
        from io import BytesIO
        
        factory = APIRequestFactory()
        request = factory.post(
            f'/api/v1/voting/{vote.id}/handle-exception/',
            {'remark': '已核实，确认为资格异常，已通知居民'},
            format='json'
        )
        request.user = self.rep
        
        view = VoteViewSet.as_view({'post': 'handle_exception'})
        response = view(request, pk=vote.id)
        
        self.assertEqual(response.status_code, 200)
        
        vote.refresh_from_db()
        self.assertTrue(vote.exception_handled)
        
        progress_exists = AssistanceProgress.objects.filter(
            resident=self.resident,
            content__contains='投票资格异常已处理'
        ).exists()
        self.assertTrue(progress_exists)

    @override_settings(CELERY_TASK_ALWAYS_EAGER=True)
    def test_voting_reminder_sent(self):
        from voting.tasks import send_voting_reminders
        from notifications.models import Notification
        
        initial_notification_count = Notification.objects.count()
        
        send_voting_reminders(self.topic.id)
        
        notification_count = Notification.objects.count()
        self.assertGreater(notification_count, initial_notification_count)
