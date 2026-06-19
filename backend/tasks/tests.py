from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from common.tests import TestUserMixin

User = get_user_model()


class TaskWorkflowTest(TestCase, TestUserMixin):
    def setUp(self):
        self.rep = self.create_representative()
        self.volunteer = self.create_volunteer()
        
        from tasks.models import Task
        self.task = Task.objects.create(
            title='测试任务',
            description='测试任务描述',
            type='patrol',
            priority='high',
            status='pending',
            created_by=self.rep,
            community='测试社区'
        )

    def test_task_status_flow(self):
        self.assertEqual(self.task.status, 'pending')
        
        self.task.start(self.volunteer)
        self.assertEqual(self.task.status, 'in_progress')
        self.assertIsNotNone(self.task.actual_start_time)
        
        self.task.complete(self.volunteer, '任务已完成')
        self.assertEqual(self.task.status, 'completed')
        self.assertIsNotNone(self.task.actual_end_time)
        self.assertIsNotNone(self.task.completed_at)

    def test_process_record_created_on_status_change(self):
        from tasks.models import TaskProcessRecord
        
        initial_count = TaskProcessRecord.objects.filter(task=self.task).count()
        
        self.task.start(self.volunteer)
        
        new_count = TaskProcessRecord.objects.filter(task=self.task).count()
        self.assertEqual(new_count, initial_count + 1)
        
        record = TaskProcessRecord.objects.filter(task=self.task).latest('processed_at')
        self.assertEqual(record.processed_by, self.volunteer)
        self.assertEqual(record.status_change, 'in_progress')

    def test_assign_task(self):
        from tasks.models import Task
        
        self.task.assign(self.volunteer, self.rep)
        
        self.assertEqual(self.task.assigned_to, self.volunteer)
        self.assertEqual(self.task.status, 'in_progress')

    def test_kanban_view(self):
        from tasks.views import TaskViewSet
        from rest_framework.test import APIRequestFactory
        
        factory = APIRequestFactory()
        request = factory.get('/api/v1/tasks/kanban/')
        request.user = self.rep
        
        view = TaskViewSet.as_view({'get': 'kanban'})
        response = view(request)
        
        self.assertEqual(response.status_code, 200)
        self.assertIn('todo', response.data)
        self.assertIn('in_progress', response.data)
        self.assertIn('done', response.data)
        
        self.assertEqual(len(response.data['todo']), 1)
        self.assertEqual(response.data['todo'][0]['title'], '测试任务')

    def test_process_records_api(self):
        from tasks.views import TaskViewSet
        from rest_framework.test import APIRequestFactory
        
        self.task.start(self.volunteer)
        
        factory = APIRequestFactory()
        request = factory.get(f'/api/v1/tasks/{self.task.id}/process-records/')
        request.user = self.rep
        
        view = TaskViewSet.as_view({'get': 'process_records'})
        response = view(request, pk=self.task.id)
        
        self.assertEqual(response.status_code, 200)
        self.assertGreaterEqual(len(response.data), 1)

    def test_add_process_record(self):
        from tasks.views import TaskViewSet
        from rest_framework.test import APIRequestFactory
        
        factory = APIRequestFactory()
        request = factory.post(
            f'/api/v1/tasks/{self.task.id}/process-records/',
            {'content': '添加处理记录', 'remark': '测试备注'},
            format='json'
        )
        request.user = self.rep
        
        view = TaskViewSet.as_view({'post': 'process_records'})
        response = view(request, pk=self.task.id)
        
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data['content'], '添加处理记录')
        self.assertEqual(response.data['remark'], '测试备注')

    def test_exception_tasks_filter(self):
        from tasks.models import Task
        
        Task.objects.create(
            title='资格异常任务',
            description='异常任务描述',
            type='qualification_exception',
            priority='high',
            status='pending',
            created_by=self.rep,
            community='测试社区'
        )
        
        from tasks.views import TaskViewSet
        from rest_framework.test import APIRequestFactory
        
        factory = APIRequestFactory()
        request = factory.get('/api/v1/tasks/exception-tasks/')
        request.user = self.rep
        
        view = TaskViewSet.as_view({'get': 'exception_tasks'})
        response = view(request)
        
        self.assertEqual(response.status_code, 200)
        for task in response.data.get('results', response.data):
            self.assertEqual(task['type'], 'qualification_exception')
