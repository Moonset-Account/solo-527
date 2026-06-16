from rest_framework import viewsets, status, generics, views
from rest_framework.decorators import action, api_view
from rest_framework.response import Response
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Count, Avg, F, ExpressionWrapper, DurationField, Q
from django.utils import timezone
from django.contrib.auth.models import User

from .models import (
    Contract, ReviewWorkflow, ReviewStep, ContractReview,
    ReviewOpinion, StampNode, EvidenceChecklist, EvidenceMaterial,
    ProgressRecord, RejectionNotification,
)
from .serializers import (
    ContractSerializer, ContractListSerializer,
    ReviewWorkflowSerializer, ReviewWorkflowCreateSerializer,
    ReviewStepSerializer, ReviewOpinionSerializer,
    ContractReviewDetailSerializer, ContractReviewListSerializer,
    ContractReviewCreateSerializer, StampNodeSerializer,
    EvidenceChecklistSerializer, EvidenceMaterialSerializer,
    ProgressRecordSerializer, RejectionNotificationSerializer,
    ReviewEfficiencySerializer,
)
from .tasks import send_rejection_notification, sync_progress_to_board


class ContractViewSet(viewsets.ModelViewSet):
    queryset = Contract.objects.all()
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'contract_type', 'uploader']
    search_fields = ['title', 'contract_number', 'counterparty']
    ordering_fields = ['created_at', 'title']

    def get_serializer_class(self):
        if self.action == 'list':
            return ContractListSerializer
        return ContractSerializer

    def perform_create(self, serializer):
        serializer.save(uploader=self.request.user)

    @action(detail=True, methods=['post'])
    def submit(self, request, pk=None):
        contract = self.get_object()
        if contract.status != 'draft':
            return Response({'detail': '仅草稿状态可提交'}, status=status.HTTP_400_BAD_REQUEST)
        contract.status = 'submitted'
        contract.save()
        return Response(ContractSerializer(contract).data)


class ReviewWorkflowViewSet(viewsets.ModelViewSet):
    queryset = ReviewWorkflow.objects.all()
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['is_active', 'contract_type']
    search_fields = ['name']

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return ReviewWorkflowCreateSerializer
        return ReviewWorkflowSerializer


class ReviewStepViewSet(viewsets.ModelViewSet):
    queryset = ReviewStep.objects.all()
    serializer_class = ReviewStepSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['workflow']


class ContractReviewViewSet(viewsets.ModelViewSet):
    queryset = ContractReview.objects.all()
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'workflow', 'contract']
    search_fields = ['contract__title', 'contract__contract_number']
    ordering_fields = ['created_at', 'started_at', 'completed_at']

    def get_serializer_class(self):
        if self.action == 'list':
            return ContractReviewListSerializer
        if self.action == 'retrieve':
            return ContractReviewDetailSerializer
        if self.action in ['create']:
            return ContractReviewCreateSerializer
        return ContractReviewDetailSerializer

    def perform_create(self, serializer):
        review = serializer.save()
        steps = review.workflow.steps.order_by('order')
        if steps.exists():
            review.current_step = steps.first()
            review.save()
        ProgressRecord.objects.create(
            business_form=review,
            stage='review',
            handler=self.request.user,
            action='启动审查流程',
        )

    @action(detail=True, methods=['post'])
    def review(self, request, pk=None):
        review = self.get_object()
        step_id = request.data.get('step')
        opinion_text = request.data.get('opinion', '')
        result = request.data.get('result')

        if result not in ['pass', 'reject']:
            return Response({'detail': '审查结果必须为 pass 或 reject'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            step = ReviewStep.objects.get(id=step_id)
        except ReviewStep.DoesNotExist:
            return Response({'detail': '步骤不存在'}, status=status.HTTP_400_BAD_REQUEST)

        opinion = ReviewOpinion.objects.create(
            contract_review=review,
            step=step,
            reviewer=request.user,
            opinion=opinion_text,
            result=result,
        )

        if result == 'reject':
            review.status = 'rejected'
            review.save()
            review.contract.status = 'rejected'
            review.contract.save()

            ProgressRecord.objects.create(
                business_form=review,
                stage='review',
                handler=request.user,
                action=f'退回审查 - {step.name}',
                remark=opinion_text,
            )

            compliance_managers = User.objects.filter(is_staff=True)
            for manager in compliance_managers:
                RejectionNotification.objects.create(
                    contract_review=review,
                    rejected_by=request.user,
                    compliance_manager=manager,
                    reason=opinion_text,
                )
                send_rejection_notification.delay(
                    str(review.id), str(request.user.id), str(manager.id), opinion_text
                )
        else:
            next_step = review.workflow.steps.filter(order__gt=step.order).first()
            if next_step:
                review.current_step = next_step
                review.save()
                ProgressRecord.objects.create(
                    business_form=review,
                    stage='review',
                    handler=request.user,
                    action=f'通过审查 - {step.name}，流转至 {next_step.name}',
                )
            else:
                review.status = 'completed'
                review.completed_at = timezone.now()
                review.save()
                review.contract.status = 'approved'
                review.contract.save()
                ProgressRecord.objects.create(
                    business_form=review,
                    stage='approve',
                    handler=request.user,
                    action='审查完成',
                )
                sync_progress_to_board.delay(str(review.id))

        return Response(ReviewOpinionSerializer(opinion).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get'])
    def opinions(self, request, pk=None):
        review = self.get_object()
        opinions = review.opinions.all()
        serializer = ReviewOpinionSerializer(opinions, many=True)
        return Response(serializer.data)


class StampNodeViewSet(viewsets.ModelViewSet):
    queryset = StampNode.objects.all()
    serializer_class = StampNodeSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['business_form', 'status']

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        node = self.get_object()
        if node.status != 'pending':
            return Response({'detail': '仅待盖章状态可操作'}, status=status.HTTP_400_BAD_REQUEST)
        node.status = 'completed'
        node.handler = request.user
        node.handled_at = timezone.now()
        node.save()

        ProgressRecord.objects.create(
            business_form=node.business_form,
            stage='stamp',
            handler=request.user,
            action=f'完成盖章 - {node.stamp_type}',
        )
        return Response(StampNodeSerializer(node).data)


class EvidenceChecklistViewSet(viewsets.ModelViewSet):
    queryset = EvidenceChecklist.objects.all()
    serializer_class = EvidenceChecklistSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['business_form', 'is_collected', 'is_required']

    @action(detail=True, methods=['post'])
    def collect(self, request, pk=None):
        checklist = self.get_object()
        checklist.is_collected = True
        checklist.collector = request.user
        checklist.collected_at = timezone.now()
        checklist.save()

        ProgressRecord.objects.create(
            business_form=checklist.business_form,
            stage='review',
            handler=request.user,
            action=f'收集证据 - {checklist.item_name}',
        )
        return Response(EvidenceChecklistSerializer(checklist).data)


class EvidenceMaterialViewSet(viewsets.ModelViewSet):
    queryset = EvidenceMaterial.objects.all()
    serializer_class = EvidenceMaterialSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['checklist', 'business_form']

    def perform_create(self, serializer):
        serializer.save(uploaded_by=self.request.user)


class ProgressRecordViewSet(viewsets.ModelViewSet):
    queryset = ProgressRecord.objects.all()
    serializer_class = ProgressRecordSerializer
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['business_form', 'stage', 'handler']
    ordering_fields = ['created_at']
    http_method_names = ['get', 'post']


class RejectionNotificationViewSet(viewsets.ModelViewSet):
    queryset = RejectionNotification.objects.all()
    serializer_class = RejectionNotificationSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['compliance_manager', 'is_read', 'synced_to_board']

    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        notification = self.get_object()
        notification.is_read = True
        notification.save()
        return Response(RejectionNotificationSerializer(notification).data)


class ReviewEfficiencyView(views.APIView):

    def get(self, request):
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')

        opinions = ReviewOpinion.objects.all()
        if start_date:
            opinions = opinions.filter(reviewed_at__gte=start_date)
        if end_date:
            opinions = opinions.filter(reviewed_at__lte=end_date)

        stats = opinions.values('reviewer').annotate(
            total_reviews=Count('id'),
            passed_reviews=Count('id', filter=Q(result='pass')),
            rejected_reviews=Count('id', filter=Q(result='reject')),
        )

        result = []
        for stat in stats:
            user = User.objects.get(id=stat['reviewer'])
            completed_reviews = ContractReview.objects.filter(
                opinions__reviewer=user,
                status='completed',
            )
            if completed_reviews.exists():
                durations = []
                for cr in completed_reviews:
                    if cr.completed_at and cr.started_at:
                        delta = (cr.completed_at - cr.started_at).total_seconds() / 3600
                        durations.append(delta)
                avg_hours = sum(durations) / len(durations) if durations else 0
            else:
                avg_hours = 0

            total = stat['total_reviews']
            completion_rate = (stat['passed_reviews'] / total * 100) if total > 0 else 0

            result.append({
                'reviewer_id': user.id,
                'reviewer_name': user.get_full_name() or user.username,
                'total_reviews': total,
                'passed_reviews': stat['passed_reviews'],
                'rejected_reviews': stat['rejected_reviews'],
                'avg_review_hours': round(avg_hours, 2),
                'completion_rate': round(completion_rate, 2),
            })

        serializer = ReviewEfficiencySerializer(result, many=True)
        return Response(serializer.data)


class ProgressBoardView(views.APIView):

    def get(self, request):
        reviews = ContractReview.objects.select_related(
            'contract', 'workflow', 'current_step',
        ).prefetch_related('progress_records').all()

        board = []
        for review in reviews:
            latest_progress = review.progress_records.first()
            stamp_status = 'none'
            if review.stamp_nodes.filter(status='completed').exists():
                stamp_status = 'completed'
            elif review.stamp_nodes.filter(status='pending').exists():
                stamp_status = 'pending'

            evidence_status = 'none'
            total_items = review.evidence_checklists.count()
            collected_items = review.evidence_checklists.filter(is_collected=True).count()
            if total_items > 0:
                if collected_items == total_items:
                    evidence_status = 'complete'
                else:
                    evidence_status = f'{collected_items}/{total_items}'

            board.append({
                'review_id': str(review.id),
                'contract_number': review.contract.contract_number,
                'contract_title': review.contract.title,
                'workflow_name': review.workflow.name,
                'status': review.status,
                'status_display': review.get_status_display(),
                'current_step': review.current_step.name if review.current_step else '',
                'latest_action': latest_progress.action if latest_progress else '',
                'latest_handler': latest_progress.handler.get_full_name() if latest_progress and latest_progress.handler else '',
                'latest_time': latest_progress.created_at if latest_progress else None,
                'stamp_status': stamp_status,
                'evidence_status': evidence_status,
                'started_at': review.started_at,
                'completed_at': review.completed_at,
            })

        return Response(board)
