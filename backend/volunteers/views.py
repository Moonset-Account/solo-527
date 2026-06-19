from rest_framework import status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from .models import Volunteer, VolunteerRoute, VolunteerAssignment
from .serializers import (
    VolunteerSerializer, VolunteerRouteSerializer,
    VolunteerAssignmentSerializer, VolunteerAssignmentCompleteSerializer
)
from common.views import BaseViewSet
from common.permissions import IsRepresentative
from common.utils import generate_excel_response


class VolunteerViewSet(BaseViewSet):
    queryset = Volunteer.objects.select_related('user').all()
    serializer_class = VolunteerSerializer
    search_fields = ['volunteer_id', 'user__first_name', 'user__last_name', 'skills']
    filterset_fields = ['status', 'user__community']

    @action(detail=False, methods=['get'])
    def available(self, request):
        date = request.query_params.get('date')
        time = request.query_params.get('time')
        queryset = self.get_queryset().filter(status='active')

        if date and time:
            assigned_ids = VolunteerAssignment.objects.filter(
                scheduled_date=date,
                status__in=['scheduled', 'in_progress']
            ).values_list('volunteer_id', flat=True)
            queryset = queryset.exclude(id__in=assigned_ids)

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def export(self, request):
        queryset = self.filter_queryset(self.get_queryset())
        fields = [
            'volunteer_id', 'user__first_name', 'user__last_name',
            'user__phone', 'user__community', 'status',
            'total_service_hours', 'service_count', 'rating', 'join_date'
        ]
        return generate_excel_response(queryset, fields, '志愿者信息')

    @action(detail=False, methods=['get'])
    def ranking(self, request):
        queryset = self.get_queryset().filter(status='active').order_by(
            '-total_service_hours', '-service_count'
        )[:10]
        return Response(VolunteerSerializer(queryset, many=True).data)

    @action(detail=False, methods=['get'])
    def statistics(self, request):
        queryset = self.get_queryset()
        total = queryset.count()
        active = queryset.filter(status='active').count()
        total_hours = queryset.aggregate(total=models.Sum('total_service_hours'))['total'] or 0
        avg_rating = queryset.aggregate(avg=models.Avg('rating'))['avg']
        by_community = queryset.values('user__community').annotate(count=models.Count('id'))
        return Response({
            'total': total,
            'active': active,
            'total_service_hours': float(total_hours),
            'avg_rating': avg_rating,
            'by_community': list(by_community)
        })


class VolunteerRouteViewSet(BaseViewSet):
    queryset = VolunteerRoute.objects.all()
    serializer_class = VolunteerRouteSerializer
    search_fields = ['name', 'description', 'community', 'start_point', 'end_point']
    filterset_fields = ['community', 'is_active']

    @action(detail=False, methods=['get'])
    def export(self, request):
        queryset = self.filter_queryset(self.get_queryset())
        fields = [
            'name', 'description', 'community', 'start_point', 'end_point',
            'estimated_duration', 'distance', 'waypoints_count',
            'estimated_people_count', 'required_volunteers', 'is_active'
        ]
        return generate_excel_response(queryset, fields, '志愿者路线')


class VolunteerAssignmentViewSet(BaseViewSet):
    queryset = VolunteerAssignment.objects.select_related(
        'volunteer', 'volunteer__user', 'route'
    ).all()
    serializer_class = VolunteerAssignmentSerializer
    search_fields = [
        'volunteer__user__first_name', 'volunteer__user__last_name',
        'route__name'
    ]
    filterset_fields = [
        'volunteer', 'route', 'status', 'scheduled_date'
    ]

    @action(detail=True, methods=['post'])
    def start(self, request, pk=None):
        assignment = self.get_object()
        if assignment.status != 'scheduled':
            return Response(
                {'error': '该排班状态不允许开始'},
                status=status.HTTP_400_BAD_REQUEST
            )
        assignment.status = 'in_progress'
        assignment.actual_start_time = timezone.now()
        assignment.save()
        return Response(VolunteerAssignmentSerializer(assignment).data)

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        assignment = self.get_object()
        if assignment.status != 'in_progress':
            return Response(
                {'error': '该排班未在进行中'},
                status=status.HTTP_400_BAD_REQUEST
            )
        serializer = VolunteerAssignmentCompleteSerializer(data=request.data)
        if serializer.is_valid():
            assignment.complete(
                serializer.validated_data['duration'],
                serializer.validated_data.get('issues', ''),
                serializer.validated_data.get('feedback', ''),
                serializer.validated_data.get('rating')
            )
            return Response(VolunteerAssignmentSerializer(assignment).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def my_assignments(self, request):
        try:
            volunteer = Volunteer.objects.get(user=request.user)
            queryset = self.get_queryset().filter(volunteer=volunteer)
        except Volunteer.DoesNotExist:
            queryset = self.get_queryset().none()

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def by_date(self, request):
        date = request.query_params.get('date')
        if not date:
            return Response(
                {'error': '请指定日期'},
                status=status.HTTP_400_BAD_REQUEST
            )
        queryset = self.get_queryset().filter(scheduled_date=date)
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def by_route(self, request):
        route_id = request.query_params.get('route_id')
        if not route_id:
            return Response(
                {'error': '请指定路线ID'},
                status=status.HTTP_400_BAD_REQUEST
            )
        queryset = self.get_queryset().filter(route_id=route_id)
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['post'], permission_classes=[IsRepresentative])
    def batch_assign(self, request):
        route_id = request.data.get('route_id')
        volunteer_ids = request.data.get('volunteer_ids', [])
        scheduled_date = request.data.get('scheduled_date')
        scheduled_start_time = request.data.get('scheduled_start_time')
        scheduled_end_time = request.data.get('scheduled_end_time')

        if not all([route_id, volunteer_ids, scheduled_date, scheduled_start_time, scheduled_end_time]):
            return Response(
                {'error': '请填写完整信息'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            route = VolunteerRoute.objects.get(id=route_id)
        except VolunteerRoute.DoesNotExist:
            return Response(
                {'error': '路线不存在'},
                status=status.HTTP_400_BAD_REQUEST
            )

        created_count = 0
        for volunteer_id in volunteer_ids:
            try:
                volunteer = Volunteer.objects.get(id=volunteer_id, status='active')
            except Volunteer.DoesNotExist:
                continue

            VolunteerAssignment.objects.create(
                volunteer=volunteer,
                route=route,
                scheduled_date=scheduled_date,
                scheduled_start_time=scheduled_start_time,
                scheduled_end_time=scheduled_end_time,
                created_by=request.user
            )
            created_count += 1

        return Response({'message': f'成功创建 {created_count} 条排班'})

    @action(detail=False, methods=['get'])
    def export(self, request):
        queryset = self.filter_queryset(self.get_queryset())
        fields = [
            'volunteer__user__first_name', 'volunteer__user__last_name',
            'route__name', 'scheduled_date', 'scheduled_start_time',
            'scheduled_end_time', 'actual_start_time', 'actual_end_time',
            'actual_duration', 'status', 'rating'
        ]
        return generate_excel_response(queryset, fields, '志愿者排班')
