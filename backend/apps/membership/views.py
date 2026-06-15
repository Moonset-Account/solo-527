from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db.models import Q
from django.conf import settings

from .models import Benefit, MembershipPackage, PackageBenefit, MemberMembership, BenefitUsageRecord
from .serializers import (
    BenefitSerializer,
    MembershipPackageSerializer,
    PackageBenefitSerializer,
    MemberMembershipSerializer,
    BenefitUsageRecordSerializer
)


class DemoFilterMixin:
    def get_queryset(self):
        queryset = super().get_queryset()
        if not getattr(settings, 'SHOW_DEMO_DATA', False):
            queryset = queryset.filter(is_demo=False)
        return queryset


class BenefitViewSet(DemoFilterMixin, viewsets.ModelViewSet):
    queryset = Benefit.objects.all()
    serializer_class = BenefitSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['benefit_type', 'is_active', 'is_demo']
    search_fields = ['name', 'description']
    ordering_fields = ['created_at', 'name', 'is_active']
    ordering = ['-created_at']


class MembershipPackageViewSet(DemoFilterMixin, viewsets.ModelViewSet):
    queryset = MembershipPackage.objects.all()
    serializer_class = MembershipPackageSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'duration_unit', 'is_popular', 'is_demo']
    search_fields = ['name', 'description', 'short_description']
    ordering_fields = ['created_at', 'price', 'sort_order', 'name']
    ordering = ['sort_order', '-created_at']

    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        package = self.get_object()
        package.status = 'active'
        package.save()
        serializer = self.get_serializer(package)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def deactivate(self, request, pk=None):
        package = self.get_object()
        package.status = 'inactive'
        package.save()
        serializer = self.get_serializer(package)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def active(self, request):
        queryset = self.filter_queryset(self.get_queryset()).filter(status='active')
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def batch_list(self, request):
        ids = request.data.get('ids', [])
        if not ids:
            return Response({'detail': 'ids 参数是必需的'}, status=status.HTTP_400_BAD_REQUEST)
        queryset = self.filter_queryset(self.get_queryset()).filter(id__in=ids)
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class PackageBenefitViewSet(viewsets.ModelViewSet):
    queryset = PackageBenefit.objects.all()
    serializer_class = PackageBenefitSerializer
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['package', 'benefit']
    ordering_fields = ['created_at', 'quantity']
    ordering = ['-created_at']


class MemberMembershipViewSet(DemoFilterMixin, viewsets.ModelViewSet):
    queryset = MemberMembership.objects.all()
    serializer_class = MemberMembershipSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['member', 'package', 'status', 'is_auto_renew', 'is_demo']
    search_fields = ['member__username', 'package__name']
    ordering_fields = ['created_at', 'start_date', 'end_date', 'remaining_services']
    ordering = ['-created_at']

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        if user.role == 'member':
            queryset = queryset.filter(member=user)
        return queryset

    @action(detail=False, methods=['get'])
    def my_memberships(self, request):
        queryset = self.filter_queryset(self.get_queryset()).filter(member=request.user)
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class BenefitUsageRecordViewSet(viewsets.ModelViewSet):
    queryset = BenefitUsageRecord.objects.all()
    serializer_class = BenefitUsageRecordSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['membership', 'benefit', 'operator']
    search_fields = ['membership__member__username', 'benefit__name', 'remark']
    ordering_fields = ['used_at', 'quantity_used']
    ordering = ['-used_at']

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        if user.role == 'member':
            queryset = queryset.filter(membership__member=user)
        return queryset

    @action(detail=False, methods=['get'])
    def my_records(self, request):
        queryset = self.filter_queryset(
            self.get_queryset().filter(membership__member=request.user)
        )
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def by_membership(self, request):
        membership_id = request.query_params.get('membership_id')
        if not membership_id:
            return Response(
                {'detail': 'membership_id 参数是必需的'},
                status=status.HTTP_400_BAD_REQUEST
            )
        queryset = self.filter_queryset(
            self.get_queryset().filter(membership_id=membership_id)
        )
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
