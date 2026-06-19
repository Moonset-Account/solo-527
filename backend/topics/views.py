from django.db import models
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Topic, TopicProcessRecord, TopicComment
from .serializers import (
    TopicSerializer, TopicDetailSerializer,
    TopicProcessRecordSerializer, TopicCommentSerializer,
    TopicStatusUpdateSerializer, TopicCommentCreateSerializer
)
from common.views import BaseViewSet
from common.permissions import IsRepresentative
from common.utils import generate_excel_response
from voting.tasks import send_voting_reminders


class TopicViewSet(BaseViewSet):
    queryset = Topic.objects.select_related(
        'proposed_by', 'representative'
    ).prefetch_related(
        'process_records', 'comments', 'votes'
    ).all()
    serializer_class = TopicSerializer
    search_fields = ['title', 'description', 'community', 'proposed_by__first_name']
    filterset_fields = [
        'category', 'priority', 'status', 'representative',
        'community', 'proposed_by'
    ]

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return TopicDetailSerializer
        return TopicSerializer

    def perform_create(self, serializer):
        serializer.save(proposed_by=self.request.user, created_by=self.request.user)

    @action(detail=True, methods=['post'], permission_classes=[IsRepresentative])
    def update_status(self, request, pk=None):
        topic = self.get_object()
        serializer = TopicStatusUpdateSerializer(data=request.data)
        if serializer.is_valid():
            old_status = topic.status
            new_status = serializer.validated_data['status']
            topic.status = new_status
            topic.save()

            if new_status == 'voting' and not topic.voting_start_time:
                from django.utils import timezone
                topic.voting_start_time = timezone.now()
                topic.save()
                send_voting_reminders.delay(topic.id)

            TopicProcessRecord.objects.create(
                topic=topic,
                content=f'状态从 {topic.get_status_display()} 变更为 {topic.get_status_display()}',
                remark=serializer.validated_data.get('remark', ''),
                processed_by=request.user,
                status_change=new_status
            )

            return Response(TopicSerializer(topic).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get', 'post'], permission_classes=[IsRepresentative])
    def process_records(self, request, pk=None):
        topic = self.get_object()
        if request.method == 'GET':
            records = TopicProcessRecord.objects.filter(
                topic=topic
            ).select_related('processed_by').order_by('-processed_at')
            page = self.paginate_queryset(records)
            if page is not None:
                serializer = TopicProcessRecordSerializer(page, many=True)
                return self.get_paginated_response(serializer.data)
            serializer = TopicProcessRecordSerializer(records, many=True)
            return Response(serializer.data)
        
        from .serializers import TopicProcessCreateSerializer
        serializer = TopicProcessCreateSerializer(data=request.data)
        if serializer.is_valid():
            record = TopicProcessRecord.objects.create(
                topic=topic,
                content=serializer.validated_data['content'],
                remark=serializer.validated_data.get('remark', ''),
                processed_by=request.user
            )
            return Response(
                TopicProcessRecordSerializer(record).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def add_comment(self, request, pk=None):
        topic = self.get_object()
        serializer = TopicCommentCreateSerializer(data=request.data)
        if serializer.is_valid():
            comment = TopicComment.objects.create(
                topic=topic,
                content=serializer.validated_data['content'],
                is_anonymous=serializer.validated_data.get('is_anonymous', False),
                author=request.user,
                created_by=request.user
            )
            return Response(
                TopicCommentSerializer(comment).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], permission_classes=[IsRepresentative])
    def assign_representative(self, request, pk=None):
        topic = self.get_object()
        representative_id = request.data.get('representative_id')
        if not representative_id:
            return Response(
                {'error': '请指定居民代表'},
                status=status.HTTP_400_BAD_REQUEST
            )
        from users.models import User
        try:
            representative = User.objects.get(id=representative_id, role='representative')
        except User.DoesNotExist:
            return Response(
                {'error': '指定的居民代表不存在'},
                status=status.HTTP_400_BAD_REQUEST
            )
        topic.representative = representative
        topic.save()

        TopicProcessRecord.objects.create(
            topic=topic,
            content=f'已分配给居民代表 {representative.get_full_name()}',
            processed_by=request.user
        )

        return Response({'message': '分配成功'})

    @action(detail=False, methods=['get'])
    def export(self, request):
        queryset = self.filter_queryset(self.get_queryset())
        fields = [
            'title', 'category', 'priority', 'status',
            'proposed_by__first_name', 'representative__first_name',
            'community', 'deadline', 'created_at', 'updated_at'
        ]
        return generate_excel_response(queryset, fields, '居民议题')

    @action(detail=False, methods=['get'])
    def statistics(self, request):
        queryset = self.get_queryset()
        total = queryset.count()
        by_status = queryset.values('status').annotate(count=models.Count('id'))
        by_category = queryset.values('category').annotate(count=models.Count('id'))
        by_priority = queryset.values('priority').annotate(count=models.Count('id'))
        voting_active = queryset.filter(status='voting').count()
        return Response({
            'total': total,
            'voting_active': voting_active,
            'by_status': list(by_status),
            'by_category': list(by_category),
            'by_priority': list(by_priority)
        })

    @action(detail=False, methods=['get'])
    def my_topics(self, request):
        queryset = self.get_queryset().filter(proposed_by=request.user)
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class TopicCommentViewSet(BaseViewSet):
    queryset = TopicComment.objects.select_related('author', 'topic').all()
    serializer_class = TopicCommentSerializer
    search_fields = ['content', 'author__first_name', 'topic__title']
    filterset_fields = ['topic', 'author', 'is_anonymous']

    def perform_create(self, serializer):
        serializer.save(author=self.request.user, created_by=self.request.user)
