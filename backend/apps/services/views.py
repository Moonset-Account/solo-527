from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db.models import Q
from django.conf import settings
from datetime import datetime

from .models import ServiceCategory, ServiceItem, TestDriveSlot, ServiceRecord
from .serializers import (
    ServiceCategorySerializer,
    ServiceItemSerializer,
    TestDriveSlotSerializer,
    ServiceRecordSerializer
)


class DemoFilterMixin:
    def get_queryset(self):
        queryset = super().get_queryset()
        if not getattr(settings, 'SHOW_DEMO_DATA', False):
            queryset = queryset.filter(is_demo=False)
        return queryset


class ServiceCategoryViewSet(DemoFilterMixin, viewsets.ModelViewSet):
    queryset = ServiceCategory.objects.all()
    serializer_class = ServiceCategorySerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['parent', 'is_active', 'is_demo']
    search_fields = ['name', 'description']
    ordering_fields = ['created_at', 'name', 'sort_order']
    ordering = ['sort_order', '-created_at']

    @action(detail=False, methods=['get'])
    def active(self, request):
        queryset = self.filter_queryset(self.get_queryset()).filter(is_active=True)
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def tree(self, request):
        queryset = self.filter_queryset(self.get_queryset()).filter(parent__isnull=True)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class ServiceItemViewSet(DemoFilterMixin, viewsets.ModelViewSet):
    queryset = ServiceItem.objects.all()
    serializer_class = ServiceItemSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['category', 'service_type', 'is_available', 'is_demo']
    search_fields = ['name', 'description', 'short_description']
    ordering_fields = ['created_at', 'name', 'price', 'sort_order']
    ordering = ['sort_order', '-created_at']

    @action(detail=False, methods=['get'])
    def available(self, request):
        queryset = self.filter_queryset(self.get_queryset()).filter(is_available=True)
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def by_type(self, request):
        service_type = request.query_params.get('service_type')
        if not service_type:
            return Response(
                {'detail': 'service_type 参数是必需的'},
                status=status.HTTP_400_BAD_REQUEST
            )
        queryset = self.filter_queryset(
            self.get_queryset().filter(service_type=service_type, is_available=True)
        )
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


class TestDriveSlotViewSet(DemoFilterMixin, viewsets.ModelViewSet):
    queryset = TestDriveSlot.objects.all()
    serializer_class = TestDriveSlotSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['service_item', 'status', 'is_demo']
    search_fields = ['vehicle_model', 'location']
    ordering_fields = ['date', 'start_time', 'created_at']
    ordering = ['date', 'start_time']

    def get_queryset(self):
        queryset = super().get_queryset()
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        vehicle_model = self.request.query_params.get('vehicle_model')

        if start_date:
            try:
                start_date_obj = datetime.strptime(start_date, '%Y-%m-%d').date()
                queryset = queryset.filter(date__gte=start_date_obj)
            except ValueError:
                pass

        if end_date:
            try:
                end_date_obj = datetime.strptime(end_date, '%Y-%m-%d').date()
                queryset = queryset.filter(date__lte=end_date_obj)
            except ValueError:
                pass

        if vehicle_model:
            queryset = queryset.filter(vehicle_model__icontains=vehicle_model)

        return queryset

    @action(detail=False, methods=['get'])
    def by_date_range(self, request):
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        vehicle_model = request.query_params.get('vehicle_model')

        if not start_date or not end_date:
            return Response(
                {'detail': 'start_date 和 end_date 参数是必需的'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            start_date_obj = datetime.strptime(start_date, '%Y-%m-%d').date()
            end_date_obj = datetime.strptime(end_date, '%Y-%m-%d').date()
        except ValueError:
            return Response(
                {'detail': '日期格式错误，请使用 YYYY-MM-DD 格式'},
                status=status.HTTP_400_BAD_REQUEST
            )

        queryset = self.filter_queryset(
            self.get_queryset().filter(date__range=[start_date_obj, end_date_obj])
        )

        if vehicle_model:
            queryset = queryset.filter(vehicle_model__icontains=vehicle_model)

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def available(self, request):
        queryset = self.filter_queryset(
            self.get_queryset().filter(status='available')
        )
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

    @action(detail=False, methods=['post'])
    def batch_create(self, request):
        slots_data = request.data.get('slots', [])
        if not slots_data:
            return Response(
                {'detail': 'slots 参数是必需的'},
                status=status.HTTP_400_BAD_REQUEST
            )

        created_slots = []
        errors = []

        for idx, slot_data in enumerate(slots_data):
            serializer = self.get_serializer(data=slot_data)
            if serializer.is_valid():
                serializer.save()
                created_slots.append(serializer.data)
            else:
                errors.append({'index': idx, 'errors': serializer.errors})

        if errors:
            return Response(
                {'created': created_slots, 'errors': errors},
                status=status.HTTP_207_MULTI_STATUS
            )

        return Response(
            {'created': created_slots, 'count': len(created_slots)},
            status=status.HTTP_201_CREATED
        )

    @action(detail=False, methods=['post'])
    def batch_update_status(self, request):
        ids = request.data.get('ids', [])
        new_status = request.data.get('status')

        if not ids or not new_status:
            return Response(
                {'detail': 'ids 和 status 参数是必需的'},
                status=status.HTTP_400_BAD_REQUEST
            )

        valid_statuses = [choice[0] for choice in TestDriveSlot.STATUS_CHOICES]
        if new_status not in valid_statuses:
            return Response(
                {'detail': f'无效的状态值，有效值为: {valid_statuses}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        queryset = self.filter_queryset(self.get_queryset().filter(id__in=ids))
        updated_count = queryset.update(status=new_status)

        return Response({
            'updated_count': updated_count,
            'status': new_status
        })

    @action(detail=False, methods=['post'])
    def batch_delete(self, request):
        ids = request.data.get('ids', [])
        if not ids:
            return Response(
                {'detail': 'ids 参数是必需的'},
                status=status.HTTP_400_BAD_REQUEST
            )

        queryset = self.filter_queryset(self.get_queryset().filter(id__in=ids))
        deleted_count, _ = queryset.delete()

        return Response({'deleted_count': deleted_count})


class ServiceRecordViewSet(DemoFilterMixin, viewsets.ModelViewSet):
    queryset = ServiceRecord.objects.all()
    serializer_class = ServiceRecordSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['member', 'vehicle', 'service_item', 'status', 'staff', 'is_demo']
    search_fields = ['member__username', 'vehicle__plate_number', 'service_item__name', 'remarks']
    ordering_fields = ['created_at', 'start_time', 'end_time', 'amount']
    ordering = ['-created_at']

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        if user.role == 'member':
            queryset = queryset.filter(member=user)
        elif user.role in ['staff', 'manager']:
            pass
        return queryset

    @action(detail=False, methods=['get'])
    def my_records(self, request):
        queryset = self.filter_queryset(
            self.get_queryset().filter(member=request.user)
        )
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def start_service(self, request, pk=None):
        record = self.get_object()
        if record.status not in ['pending']:
            return Response(
                {'detail': '只有待服务状态的记录可以开始服务'},
                status=status.HTTP_400_BAD_REQUEST
            )

        record.status = 'in_progress'
        record.start_time = datetime.now()
        record.staff = request.user
        record.save()

        serializer = self.get_serializer(record)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def complete_service(self, request, pk=None):
        record = self.get_object()
        if record.status not in ['in_progress']:
            return Response(
                {'detail': '只有服务中状态的记录可以完成'},
                status=status.HTTP_400_BAD_REQUEST
            )

        record.status = 'completed'
        record.end_time = datetime.now()
        if record.start_time:
            duration = (record.end_time - record.start_time).total_seconds() / 60
            record.actual_duration = int(duration)
        record.save()

        serializer = self.get_serializer(record)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def cancel_service(self, request, pk=None):
        record = self.get_object()
        if record.status not in ['pending', 'in_progress']:
            return Response(
                {'detail': '只有待服务或服务中状态的记录可以取消'},
                status=status.HTTP_400_BAD_REQUEST
            )

        record.status = 'cancelled'
        record.save()

        serializer = self.get_serializer(record)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def refund_service(self, request, pk=None):
        record = self.get_object()
        if record.status not in ['completed']:
            return Response(
                {'detail': '只有已完成状态的记录可以退款'},
                status=status.HTTP_400_BAD_REQUEST
            )

        record.status = 'refunded'
        record.save()

        serializer = self.get_serializer(record)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        record = self.get_object()
        new_status = request.data.get('status')

        if not new_status:
            return Response(
                {'detail': 'status 参数是必需的'},
                status=status.HTTP_400_BAD_REQUEST
            )

        valid_statuses = [choice[0] for choice in ServiceRecord.STATUS_CHOICES]
        if new_status not in valid_statuses:
            return Response(
                {'detail': f'无效的状态值，有效值为: {valid_statuses}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        valid_transitions = {
            'pending': ['in_progress', 'cancelled'],
            'in_progress': ['completed', 'cancelled'],
            'completed': ['refunded'],
            'cancelled': [],
            'refunded': []
        }

        if new_status not in valid_transitions.get(record.status, []):
            return Response(
                {'detail': f'无法从 {record.status} 状态转换到 {new_status} 状态'},
                status=status.HTTP_400_BAD_REQUEST
            )

        record.status = new_status
        if new_status == 'in_progress':
            record.start_time = datetime.now()
            record.staff = request.user
        elif new_status == 'completed':
            record.end_time = datetime.now()
            if record.start_time:
                duration = (record.end_time - record.start_time).total_seconds() / 60
                record.actual_duration = int(duration)
        record.save()

        serializer = self.get_serializer(record)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def by_status(self, request):
        status_param = request.query_params.get('status')
        if not status_param:
            return Response(
                {'detail': 'status 参数是必需的'},
                status=status.HTTP_400_BAD_REQUEST
            )

        queryset = self.filter_queryset(
            self.get_queryset().filter(status=status_param)
        )
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
