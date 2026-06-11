from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Count, Q
from django.utils import timezone
from datetime import datetime, timedelta
from django.contrib.auth.models import User
from .models import Review, ReviewRule
from .serializers import (
    ReviewListSerializer, ReviewDetailSerializer, ReviewCreateSerializer,
    ReviewActionSerializer, ReviewBatchActionSerializer, ReviewRuleSerializer
)


def get_operator(request):
    if request.user and request.user.is_authenticated:
        return request.user
    return User.objects.filter(is_superuser=True).first()


class ReviewViewSet(viewsets.ModelViewSet):
    queryset = Review.objects.all()
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'review_type', 'risk_level', 'flagged_by_ai']
    search_fields = ['comment', 'message__content']
    ordering_fields = ['created_at', 'reviewed_at', 'risk_level']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action == 'list':
            return ReviewListSerializer
        elif self.action == 'retrieve':
            return ReviewDetailSerializer
        elif self.action == 'create':
            return ReviewCreateSerializer
        return ReviewDetailSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        sales_operation = self.request.query_params.get('sales_operation')
        prompt_version = self.request.query_params.get('prompt_version')
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')

        if sales_operation:
            queryset = queryset.filter(sales_operation=sales_operation)
        if prompt_version:
            queryset = queryset.filter(prompt_version=prompt_version)
        if start_date:
            try:
                start = datetime.strptime(start_date, '%Y-%m-%d')
                queryset = queryset.filter(created_at__date__gte=start.date())
            except ValueError:
                pass
        if end_date:
            try:
                end = datetime.strptime(end_date, '%Y-%m-%d')
                queryset = queryset.filter(created_at__date__lte=end.date())
            except ValueError:
                pass

        return queryset

    def perform_create(self, serializer):
        serializer.save()

    @action(detail=True, methods=['post'], url_path='approve')
    def approve(self, request, pk=None):
        review = self.get_object()
        serializer = ReviewActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        review.status = 'approved'
        review.reviewer = get_operator(request)
        review.reviewed_at = timezone.now()
        if serializer.validated_data.get('comment'):
            review.comment = serializer.validated_data['comment']
        if serializer.validated_data.get('risk_level'):
            review.risk_level = serializer.validated_data['risk_level']
        if 'is_accurate' in serializer.validated_data:
            review.is_accurate = serializer.validated_data['is_accurate']
        if serializer.validated_data.get('inaccuracy_reason'):
            review.inaccuracy_reason = serializer.validated_data['inaccuracy_reason']
        review.save()

        return Response(ReviewDetailSerializer(review).data)

    @action(detail=True, methods=['post'], url_path='reject')
    def reject(self, request, pk=None):
        review = self.get_object()
        serializer = ReviewActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        review.status = 'rejected'
        review.reviewer = get_operator(request)
        review.reviewed_at = timezone.now()
        if serializer.validated_data.get('comment'):
            review.comment = serializer.validated_data['comment']
        if serializer.validated_data.get('risk_level'):
            review.risk_level = serializer.validated_data['risk_level']
        if 'is_accurate' in serializer.validated_data:
            review.is_accurate = serializer.validated_data['is_accurate']
        if serializer.validated_data.get('inaccuracy_reason'):
            review.inaccuracy_reason = serializer.validated_data['inaccuracy_reason']
        review.save()

        return Response(ReviewDetailSerializer(review).data)

    @action(detail=True, methods=['post'], url_path='flag')
    def flag(self, request, pk=None):
        review = self.get_object()
        serializer = ReviewActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        review.status = 'flagged'
        review.reviewer = get_operator(request)
        review.reviewed_at = timezone.now()
        if serializer.validated_data.get('comment'):
            review.comment = serializer.validated_data['comment']
        if serializer.validated_data.get('risk_level'):
            review.risk_level = serializer.validated_data['risk_level']
        review.save()

        return Response(ReviewDetailSerializer(review).data)

    @action(detail=False, methods=['post'], url_path='batch-approve')
    def batch_approve(self, request):
        request_data = request.data.copy()
        request_data['action'] = 'approve'
        serializer = ReviewBatchActionSerializer(data=request_data)
        serializer.is_valid(raise_exception=True)

        ids = serializer.validated_data['ids']
        comment = serializer.validated_data.get('comment', '')

        updated_count = Review.objects.filter(id__in=ids).update(
            status='approved',
            reviewer=get_operator(request),
            reviewed_at=timezone.now(),
            comment=comment if comment else ''
        )

        return Response({
            'success': True,
            'updated_count': updated_count,
            'message': f'已通过 {updated_count} 条审核记录'
        })

    @action(detail=False, methods=['post'], url_path='batch-reject')
    def batch_reject(self, request):
        request_data = request.data.copy()
        request_data['action'] = 'reject'
        serializer = ReviewBatchActionSerializer(data=request_data)
        serializer.is_valid(raise_exception=True)

        ids = serializer.validated_data['ids']
        comment = serializer.validated_data.get('comment', '')

        updated_count = Review.objects.filter(id__in=ids).update(
            status='rejected',
            reviewer=get_operator(request),
            reviewed_at=timezone.now(),
            comment=comment if comment else ''
        )

        return Response({
            'success': True,
            'updated_count': updated_count,
            'message': f'已拒绝 {updated_count} 条审核记录'
        })

    @action(detail=False, methods=['get'], url_path='pending-count')
    def pending_count(self, request):
        counts = Review.objects.values('status').annotate(count=Count('id'))
        result = {
            'total': 0,
            'pending': 0,
            'approved': 0,
            'rejected': 0,
            'flagged': 0
        }
        for item in counts:
            result[item['status']] = item['count']
            result['total'] += item['count']

        return Response(result)

    @action(detail=False, methods=['get'], url_path='stats')
    def stats(self, request):
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        sales_operation = request.query_params.get('sales_operation')
        prompt_version = request.query_params.get('prompt_version')

        queryset = Review.objects.all()

        if start_date:
            try:
                start = datetime.strptime(start_date, '%Y-%m-%d')
                queryset = queryset.filter(created_at__date__gte=start.date())
            except ValueError:
                pass
        if end_date:
            try:
                end = datetime.strptime(end_date, '%Y-%m-%d')
                queryset = queryset.filter(created_at__date__lte=end.date())
            except ValueError:
                pass
        if sales_operation:
            queryset = queryset.filter(sales_operation=sales_operation)
        if prompt_version:
            queryset = queryset.filter(prompt_version=prompt_version)

        total = queryset.count()
        pending = queryset.filter(status='pending').count()
        approved = queryset.filter(status='approved').count()
        rejected = queryset.filter(status='rejected').count()
        flagged = queryset.filter(status='flagged').count()

        approval_rate = (approved / total * 100) if total > 0 else 0
        rejection_rate = (rejected / total * 100) if total > 0 else 0
        flagged_rate = (flagged / total * 100) if total > 0 else 0

        accurate_count = queryset.filter(is_accurate=True).count()
        reviewed_with_accuracy = queryset.filter(is_accurate__isnull=False).count()
        accuracy_rate = (accurate_count / reviewed_with_accuracy * 100) if reviewed_with_accuracy > 0 else 0

        return Response({
            'total': total,
            'pending': pending,
            'approved': approved,
            'rejected': rejected,
            'flagged': flagged,
            'approval_rate': round(approval_rate, 2),
            'rejection_rate': round(rejection_rate, 2),
            'flagged_rate': round(flagged_rate, 2),
            'accuracy_rate': round(accuracy_rate, 2),
            'reviewed_with_accuracy': reviewed_with_accuracy
        })


class ReviewRuleViewSet(viewsets.ModelViewSet):
    queryset = ReviewRule.objects.all()
    serializer_class = ReviewRuleSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['rule_type', 'is_active', 'severity']
    search_fields = ['name', 'description', 'pattern']
    ordering_fields = ['created_at', 'updated_at', 'severity']
    ordering = ['-created_at']

    @action(detail=True, methods=['post'], url_path='toggle')
    def toggle(self, request, pk=None):
        rule = self.get_object()
        rule.is_active = not rule.is_active
        rule.save()
        return Response(ReviewRuleSerializer(rule).data)
