from datetime import timedelta
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.contrib.auth.models import User
from visit_dashboard.models import (
    Store, Team, ProblemType, WorkOrder, VisitRecord,
    Refund, SecondaryComplaint, MetricConfig, AnomalyAnnotation,
)


class Command(BaseCommand):
    help = 'Seed demo data for the visit quality dashboard'

    def handle(self, *args, **options):
        self.stdout.write('Seeding demo data...')

        admin_user = User.objects.filter(is_superuser=True).first()
        if not admin_user:
            admin_user = User.objects.create_superuser('admin', 'admin@example.com', 'admin123')

        handler1, _ = User.objects.get_or_create(username='handler1', defaults={
            'first_name': '张', 'last_name': '伟', 'email': 'zhang@example.com'
        })
        handler2, _ = User.objects.get_or_create(username='handler2', defaults={
            'first_name': '李', 'last_name': '娜', 'email': 'li@example.com'
        })
        handler3, _ = User.objects.get_or_create(username='handler3', defaults={
            'first_name': '王', 'last_name': '强', 'email': 'wang@example.com'
        })

        store1, _ = Store.objects.get_or_create(code='S001', defaults={
            'name': '北京朝阳店', 'region': '华北'
        })
        store2, _ = Store.objects.get_or_create(code='S002', defaults={
            'name': '上海浦东店', 'region': '华东'
        })
        store3, _ = Store.objects.get_or_create(code='S003', defaults={
            'name': '广州天河店', 'region': '华南'
        })

        team1, _ = Team.objects.get_or_create(code='T001', defaults={
            'name': '朝阳A组', 'store': store1
        })
        team2, _ = Team.objects.get_or_create(code='T002', defaults={
            'name': '浦东B组', 'store': store2
        })
        team3, _ = Team.objects.get_or_create(code='T003', defaults={
            'name': '天河C组', 'store': store3
        })

        pt1, _ = ProblemType.objects.get_or_create(name='产品质量问题', defaults={'category': '质量'})
        pt2, _ = ProblemType.objects.get_or_create(name='配送延迟', defaults={'category': '物流'})
        pt3, _ = ProblemType.objects.get_or_create(name='售后服务态度', defaults={'category': '服务'})
        pt4, _ = ProblemType.objects.get_or_create(name='退款纠纷', defaults={'category': '财务'})

        now = timezone.now()
        phones = [
            '13812345678', '13998765432', '13655551234',
            '15800001111', '13722223333', '15988889999',
            '18611112222', '13533334444', '15055556666',
            '17777778888', '13200009999', '18866667777',
        ]

        demo_data = [
            {'store': store1, 'team': team1, 'handler': handler1, 'problem_type': pt1, 'score': 2, 'status': 'completed', 'tags': ['态度差', '推诿'], 'has_secondary': False, 'refund_status': None},
            {'store': store1, 'team': team1, 'handler': handler1, 'problem_type': pt3, 'score': 1, 'status': 'completed', 'tags': ['敷衍', '未解决'], 'has_secondary': True, 'refund_status': 'refunded', 'post_refund_complaint': True},
            {'store': store2, 'team': team2, 'handler': handler2, 'problem_type': pt2, 'score': 4, 'status': 'completed', 'tags': ['沟通好'], 'has_secondary': False, 'refund_status': None},
            {'store': store2, 'team': team2, 'handler': handler2, 'problem_type': pt4, 'score': 2, 'status': 'completed', 'tags': ['退款慢', '推诿'], 'has_secondary': True, 'refund_status': 'refunded', 'post_refund_complaint': True},
            {'store': store3, 'team': team3, 'handler': handler3, 'problem_type': pt1, 'score': 5, 'status': 'completed', 'tags': ['满意'], 'has_secondary': False, 'refund_status': None},
            {'store': store3, 'team': team3, 'handler': handler3, 'problem_type': pt3, 'score': 3, 'status': 'completed', 'tags': ['一般'], 'has_secondary': False, 'refund_status': None},
            {'store': store1, 'team': team1, 'handler': handler2, 'problem_type': pt2, 'score': 1, 'status': 'completed', 'tags': ['延误严重', '不回复'], 'has_secondary': True, 'refund_status': None, 'post_refund_complaint': False},
            {'store': store2, 'team': team2, 'handler': handler3, 'problem_type': pt1, 'score': 4, 'status': 'completed', 'tags': ['处理及时'], 'has_secondary': False, 'refund_status': None},
            {'store': store3, 'team': team3, 'handler': handler1, 'problem_type': pt4, 'score': 2, 'status': 'completed', 'tags': ['退款金额争议', '态度差'], 'has_secondary': True, 'refund_status': 'refunded', 'post_refund_complaint': True},
            {'store': store1, 'team': team1, 'handler': handler1, 'problem_type': pt3, 'score': 5, 'status': 'completed', 'tags': ['非常满意'], 'has_secondary': False, 'refund_status': None},
            {'store': store1, 'team': team1, 'handler': handler2, 'problem_type': pt1, 'score': None, 'status': 'pending', 'tags': [], 'has_secondary': False, 'refund_status': None},
            {'store': store2, 'team': team2, 'handler': handler3, 'problem_type': pt2, 'score': None, 'status': 'unreachable', 'tags': [], 'has_secondary': False, 'refund_status': None},
        ]

        for i, d in enumerate(demo_data):
            wo, created = WorkOrder.objects.get_or_create(
                order_no=f'WO{now.strftime("%Y%m%d")}{i+1:03d}',
                defaults={
                    'customer_name': f'客户{i+1}',
                    'customer_phone': phones[i % len(phones)],
                    'store': d['store'],
                    'problem_type': d['problem_type'],
                    'team': d['team'],
                    'handler': d['handler'],
                    'status': 'completed' if d['status'] == 'completed' else 'processing',
                    'description': f'问题描述{i+1}',
                }
            )

            if not created:
                continue

            visit_time = now - timedelta(days=len(demo_data) - i)
            visit = VisitRecord.objects.create(
                work_order=wo,
                visitor=admin_user,
                visit_status=d['status'],
                satisfaction_score=d['score'],
                recording_tags=d['tags'],
                visited_at=visit_time if d['status'] == 'completed' else None,
            )

            if d.get('refund_status'):
                refund_time = visit_time - timedelta(hours=2) if d['status'] == 'completed' else None
                Refund.objects.create(
                    work_order=wo,
                    amount='199.00',
                    status=d['refund_status'],
                    refund_time=refund_time,
                )

            if d.get('has_secondary'):
                complaint_time = visit_time + timedelta(hours=5)
                is_post = d.get('post_refund_complaint', False)
                SecondaryComplaint.objects.create(
                    work_order=wo,
                    complaint_type='退款后投诉' if is_post else '服务态度投诉',
                    complaint_time=complaint_time,
                    is_post_refund=is_post,
                    description=f'二次投诉描述{i+1}',
                )
                if is_post:
                    AnomalyAnnotation.objects.create(
                        related_work_order=wo,
                        anomaly_type='post_refund_complaint',
                        annotation_text=f'工单{wo.order_no}的二次投诉发生在退款之后，需单独关注',
                        annotated_by=admin_user,
                    )

        MetricConfig.objects.get_or_create(name='门店默认口径', dimension='store', defaults={
            'low_score_threshold': 3,
            'satisfaction_weight': 1.0,
            'is_active': True,
            'created_by': admin_user,
        })
        MetricConfig.objects.get_or_create(name='问题类型口径', dimension='problem_type', defaults={
            'low_score_threshold': 3,
            'satisfaction_weight': 1.0,
            'is_active': True,
            'created_by': admin_user,
        })
        MetricConfig.objects.get_or_create(name='班组口径', dimension='team', defaults={
            'low_score_threshold': 3,
            'satisfaction_weight': 1.0,
            'is_active': True,
            'created_by': admin_user,
        })

        self.stdout.write(self.style.SUCCESS('Demo data seeded successfully!'))
