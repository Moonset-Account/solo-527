from rest_framework import status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Vote, VotingStatistics
from .serializers import (
    VoteSerializer, VotingStatisticsSerializer, VoteCreateSerializer
)
from common.views import BaseViewSet
from common.permissions import IsRepresentative
from common.utils import generate_excel_response


class VoteViewSet(BaseViewSet):
    queryset = Vote.objects.select_related('topic', 'voter').all()
    serializer_class = VoteSerializer
    search_fields = ['topic__title', 'voter__first_name', 'voter__username']
    filterset_fields = [
        'topic', 'voter', 'vote', 'has_qualification_exception',
        'exception_handled'
    ]

    def get_serializer_class(self):
        if self.action == 'create':
            return VoteCreateSerializer
        return VoteSerializer

    def create(self, request, *args, **kwargs):
        serializer = VoteCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        from topics.models import Topic
        topic = Topic.objects.get(id=serializer.validated_data['topic_id'])

        vote = Vote.objects.create(
            topic=topic,
            voter=request.user,
            vote=serializer.validated_data['vote'],
            is_anonymous=serializer.validated_data.get('is_anonymous', False),
            ip_address=request.META.get('REMOTE_ADDR'),
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
            created_by=request.user
        )

        stats, _ = VotingStatistics.objects.get_or_create(topic=topic)
        stats.update_statistics()

        return Response(
            VoteSerializer(vote).data,
            status=status.HTTP_201_CREATED
        )

    @action(detail=False, methods=['get'])
    def my_votes(self, request):
        queryset = self.get_queryset().filter(voter=request.user)
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[IsRepresentative])
    def handle_exception(self, request, pk=None):
        vote = self.get_object()
        if not vote.has_qualification_exception:
            return Response(
                {'error': '该投票不存在资格异常'},
                status=status.HTTP_400_BAD_REQUEST
            )

        vote.exception_handled = True
        vote.exception_remark = request.data.get('remark', '')
        vote.save()

        from assistance.models import AssistanceProgress
        from residents.models import Resident
        try:
            resident = Resident.objects.get(user=vote.voter)
            AssistanceProgress.objects.create(
                assistance=None,
                resident=resident,
                content=f'投票资格异常已处理：{vote.exception_remark}',
                status='completed',
                processed_by=request.user
            )
        except Resident.DoesNotExist:
            pass

        return Response({'message': '异常已处理'})

    @action(detail=False, methods=['get'])
    def export(self, request):
        queryset = self.filter_queryset(self.get_queryset())
        fields = [
            'topic__title', 'voter__first_name', 'voter__last_name',
            'vote', 'voted_at', 'is_anonymous',
            'has_qualification_exception', 'exception_handled'
        ]
        return generate_excel_response(queryset, fields, '投票记录')

    @action(detail=False, methods=['get'])
    def exception_list(self, request):
        queryset = self.get_queryset().filter(has_qualification_exception=True)
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class VotingStatisticsViewSet(BaseViewSet):
    queryset = VotingStatistics.objects.select_related('topic').all()
    serializer_class = VotingStatisticsSerializer
    filterset_fields = ['topic']
    http_method_names = ['get']

    @action(detail=True, methods=['post'])
    def refresh(self, request, pk=None):
        stats = self.get_object()
        stats.update_statistics()
        return Response(VotingStatisticsSerializer(stats).data)
