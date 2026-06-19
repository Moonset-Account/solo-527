from django.db import models
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Resident, HouseholdMember, ResidentProcessRecord
from .serializers import (
    ResidentSerializer, ResidentDetailSerializer,
    HouseholdMemberSerializer, ResidentProcessRecordSerializer,
    ResidentProcessCreateSerializer
)
from common.views import BaseViewSet
from common.permissions import IsRepresentative
from common.utils import generate_excel_response


class ResidentViewSet(BaseViewSet):
    queryset = Resident.objects.select_related('user').prefetch_related('household_members', 'process_records').all()
    serializer_class = ResidentSerializer
    search_fields = [
        'user__username', 'user__first_name', 'user__last_name',
        'user__phone', 'user__community', 'user__building',
        'registered_address', 'residence_address'
    ]
    filterset_fields = [
        'household_type', 'is_voter_qualified',
        'user__community', 'user__building', 'user__unit',
        'has_volunteer_experience'
    ]

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return ResidentDetailSerializer
        return ResidentSerializer

    @action(detail=True, methods=['get', 'post'], permission_classes=[IsRepresentative])
    def process_records(self, request, pk=None):
        resident = self.get_object()
        if request.method == 'GET':
            records = ResidentProcessRecord.objects.filter(
                resident=resident
            ).select_related('processed_by').order_by('-processed_at')
            page = self.paginate_queryset(records)
            if page is not None:
                serializer = ResidentProcessRecordSerializer(page, many=True)
                return self.get_paginated_response(serializer.data)
            serializer = ResidentProcessRecordSerializer(records, many=True)
            return Response(serializer.data)
        
        serializer = ResidentProcessCreateSerializer(data=request.data)
        if serializer.is_valid():
            record = ResidentProcessRecord.objects.create(
                resident=resident,
                content=serializer.validated_data['content'],
                remark=serializer.validated_data.get('remark', ''),
                processed_by=request.user
            )
            return Response(
                ResidentProcessRecordSerializer(record).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], permission_classes=[IsRepresentative])
    def toggle_voting_qualification(self, request, pk=None):
        resident = self.get_object()
        resident.is_voter_qualified = not resident.is_voter_qualified
        resident.qualification_exception_reason = request.data.get('reason', '')
        resident.save()

        ResidentProcessRecord.objects.create(
            resident=resident,
            content=f'投票资格变更为：{"有" if resident.is_voter_qualified else "无"}',
            remark=resident.qualification_exception_reason,
            processed_by=request.user
        )

        if not resident.is_voter_qualified:
            from tasks.services import create_qualification_exception_todo
            create_qualification_exception_todo(resident, request.user)

        return Response({
            'message': '投票资格已更新',
            'is_voter_qualified': resident.is_voter_qualified
        })

    @action(detail=False, methods=['get'])
    def export(self, request):
        queryset = self.filter_queryset(self.get_queryset())
        fields = [
            'user__username', 'user__first_name', 'user__last_name',
            'user__phone', 'user__community', 'user__building',
            'user__unit', 'user__room_number', 'household_type',
            'household_member_count', 'is_voter_qualified', 'registered_address',
            'residence_address', 'created_at'
        ]
        return generate_excel_response(queryset, fields, '居民台账')

    @action(detail=False, methods=['get'])
    def statistics(self, request):
        total = self.get_queryset().count()
        qualified = self.get_queryset().filter(is_voter_qualified=True).count()
        disqualified = total - qualified
        by_household = self.get_queryset().values('household_type').annotate(
            count=models.Count('id')
        )
        by_community = self.get_queryset().values('user__community').annotate(
            count=models.Count('id')
        )
        return Response({
            'total': total,
            'qualified_voters': qualified,
            'disqualified_voters': disqualified,
            'by_household_type': list(by_household),
            'by_community': list(by_community)
        })


class HouseholdMemberViewSet(BaseViewSet):
    queryset = HouseholdMember.objects.all()
    serializer_class = HouseholdMemberSerializer
    search_fields = ['name', 'id_card', 'phone']
    filterset_fields = ['resident', 'relation', 'is_voter_qualified']
