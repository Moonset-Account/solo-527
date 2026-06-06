from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from django.db import transaction
from django.db.models import Sum
from .models import (
    SurgicalTemplate, TemplateSupplyItem, OperationSchedule,
    PreparedItem, UsageRecord, ReturnRecord, HighValueAudit
)
from .serializers import (
    SurgicalTemplateSerializer, TemplateSupplyItemSerializer,
    OperationScheduleSerializer, PreparedItemSerializer,
    UsageRecordSerializer, ReturnRecordSerializer, HighValueAuditSerializer
)
from inventory.models import Batch, Supply


class SurgicalTemplateViewSet(viewsets.ModelViewSet):
    queryset = SurgicalTemplate.objects.all()
    serializer_class = SurgicalTemplateSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['department', 'is_active']
    search_fields = ['name', 'code', 'department']

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['get'])
    def packing_list(self, request, pk=None):
        template = self.get_object()
        items = template.supply_items.select_related('supply').all()
        result = []
        for item in items:
            supply = item.supply
            valid_batches = Batch.objects.filter(
                supply=supply,
                is_expired=False
            ).order_by('expiry_date')
            batch_info = None
            if valid_batches.exists():
                batch = valid_batches.first()
                batch_info = {
                    'batch_number': batch.batch_number,
                    'expiry_date': batch.expiry_date,
                    'quantity': batch.quantity,
                    'storage_location': batch.storage_location,
                    'days_to_expire': batch.days_to_expire,
                    'is_warning': batch.is_warning,
                }
            result.append({
                'supply_id': supply.id,
                'supply_name': supply.name,
                'supply_code': supply.code,
                'supply_type': supply.supply_type,
                'item_type': item.item_type,
                'item_type_display': item.get_item_type_display(),
                'quantity': item.quantity,
                'unit': supply.unit,
                'specification': supply.specification,
                'total_stock': supply.total_stock,
                'batch': batch_info,
                'remark': item.remark,
            })
        return Response(result)


class TemplateSupplyItemViewSet(viewsets.ModelViewSet):
    queryset = TemplateSupplyItem.objects.all()
    serializer_class = TemplateSupplyItemSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['template', 'item_type', 'supply']


class OperationScheduleViewSet(viewsets.ModelViewSet):
    queryset = OperationSchedule.objects.all()
    serializer_class = OperationScheduleSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['operation_date', 'operation_room', 'status', 'template']
    search_fields = ['patient_name', 'patient_id', 'surgeon']
    ordering_fields = ['operation_date', 'schedule_time']
    ordering = ['-operation_date', 'schedule_time']

    @action(detail=True, methods=['post'])
    def generate_packing_list(self, request, pk=None):
        schedule = self.get_object()
        if schedule.status != 'SCHEDULED':
            return Response(
                {'status': 'error', 'message': '只能为已排班的手术生成备包清单'},
                status=status.HTTP_400_BAD_REQUEST
            )
        try:
            with transaction.atomic():
                schedule.status = 'PREPARING'
                schedule.save()
                items = schedule.template.supply_items.all()
                created_items = []
                for item in items:
                    prepared_item, created = PreparedItem.objects.get_or_create(
                        schedule=schedule,
                        supply=item.supply,
                        defaults={
                            'quantity': item.quantity,
                            'item_type': item.item_type,
                            'prepared_by': request.user,
                        }
                    )
                    if created:
                        created_items.append(PreparedItemSerializer(prepared_item).data)
                return Response({
                    'status': 'success',
                    'message': '备包清单生成成功',
                    'created_items': created_items
                })
        except Exception as e:
            return Response(
                {'status': 'error', 'message': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['post'])
    def validate_items(self, request, pk=None):
        schedule = self.get_object()
        results = schedule.validate_prepared_items(request.user)
        if results:
            return Response({
                'status': 'warning',
                'message': '校验发现问题',
                'issues': results
            })
        else:
            schedule.status = 'READY'
            schedule.save()
            return Response({
                'status': 'success',
                'message': '备包校验通过，状态已更新为已备妥'
            })

    @action(detail=True, methods=['post'])
    def change_template(self, request, pk=None):
        schedule = self.get_object()
        new_template_id = request.data.get('new_template_id')
        if not new_template_id:
            return Response(
                {'status': 'error', 'message': '请提供新的术式模板ID'},
                status=status.HTTP_400_BAD_REQUEST
            )
        try:
            new_template = SurgicalTemplate.objects.get(id=new_template_id)
            schedule.change_template(new_template, request.user)
            validation_results = schedule.validate_prepared_items(request.user)
            return Response({
                'status': 'success',
                'message': '术式已更换',
                'old_template': schedule.original_template.name,
                'new_template': new_template.name,
                'validation_results': validation_results
            })
        except SurgicalTemplate.DoesNotExist:
            return Response(
                {'status': 'error', 'message': '术式模板不存在'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'status': 'error', 'message': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=['get'])
    def today_schedule(self, request):
        today = timezone.now().date()
        schedules = self.queryset.filter(operation_date=today)
        serializer = self.get_serializer(schedules, many=True)
        return Response(serializer.data)


class PreparedItemViewSet(viewsets.ModelViewSet):
    queryset = PreparedItem.objects.all()
    serializer_class = PreparedItemSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['schedule', 'item_type', 'status', 'supply']
    search_fields = ['supply__name', 'batch__batch_number']

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        batch = serializer.validated_data.get('batch')
        supply = serializer.validated_data.get('supply')

        if batch:
            if batch.check_expired() or batch.is_expired:
                return Response({
                    'status': 'error',
                    'error_code': 'BATCH_EXPIRED',
                    'message': f'批号 {batch.batch_number} 已过期，不能进入手术间',
                    'batch_info': {
                        'id': batch.id,
                        'batch_number': batch.batch_number,
                        'expiry_date': str(batch.expiry_date),
                        'supply_name': supply.name if supply else batch.supply.name,
                    }
                }, status=status.HTTP_400_BAD_REQUEST)

            if supply and batch.supply_id != supply.id:
                return Response({
                    'status': 'error',
                    'error_code': 'BATCH_SUPPLY_MISMATCH',
                    'message': '批号与耗材不匹配',
                }, status=status.HTTP_400_BAD_REQUEST)

        prepared_item = serializer.save(prepared_by=self.request.user)

        if batch:
            prepared_item.storage_location = batch.storage_location
            prepared_item.save()

        headers = self.get_success_headers(serializer.data)
        return Response({
            'status': 'success',
            'message': '备包物品添加成功',
            'prepared_item': {
                'id': prepared_item.id,
                'supply_name': prepared_item.supply.name,
                'supply_code': prepared_item.supply.code,
                'supply_type': prepared_item.supply.supply_type,
                'quantity': prepared_item.quantity,
                'item_type': prepared_item.item_type,
                'item_type_display': prepared_item.get_item_type_display(),
                'batch': {
                    'id': prepared_item.batch.id,
                    'batch_number': prepared_item.batch.batch_number,
                    'production_date': str(prepared_item.batch.production_date),
                    'expiry_date': str(prepared_item.batch.expiry_date),
                    'days_to_expire': prepared_item.batch.days_to_expire,
                    'is_warning': prepared_item.batch.is_warning,
                    'is_expired': prepared_item.batch.is_expired,
                } if prepared_item.batch else None,
                'storage_location': prepared_item.storage_location,
                'can_enter_or': not (prepared_item.batch and (prepared_item.batch.is_expired or prepared_item.batch.is_warning)),
                'warning': '即将过期，请谨慎使用' if (prepared_item.batch and prepared_item.batch.is_warning) else None,
                'prepared_by': prepared_item.prepared_by.username,
                'prepared_at': str(prepared_item.prepared_at),
            }
        }, status=status.HTTP_201_CREATED, headers=headers)

    @action(detail=True, methods=['post'])
    def verify(self, request, pk=None):
        item = self.get_object()
        try:
            item.verify(request.user)
            return Response({'status': 'success', 'message': '核对成功'})
        except Exception as e:
            return Response(
                {'status': 'error', 'message': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['post'])
    def assign_batch(self, request, pk=None):
        item = self.get_object()
        batch_id = request.data.get('batch_id')
        if not batch_id:
            return Response(
                {'status': 'error', 'message': '请提供批号ID'},
                status=status.HTTP_400_BAD_REQUEST
            )
        try:
            batch = Batch.objects.get(id=batch_id)
            if batch.check_expired() or batch.is_expired:
                return Response(
                    {
                        'status': 'error',
                        'error_code': 'BATCH_EXPIRED',
                        'message': f'批号 {batch.batch_number} 已过期，不能进入手术间',
                        'batch': {
                            'id': batch.id,
                            'batch_number': batch.batch_number,
                            'expiry_date': str(batch.expiry_date),
                            'days_to_expire': batch.days_to_expire,
                        }
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
            if batch.supply_id != item.supply_id:
                return Response(
                    {'status': 'error', 'error_code': 'BATCH_MISMATCH', 'message': '批号与耗材不匹配'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            item.batch = batch
            item.storage_location = batch.storage_location
            item.save()
            return Response({
                'status': 'success',
                'message': '批号分配成功',
                'prepared_item': {
                    'id': item.id,
                    'supply_name': item.supply.name,
                    'supply_code': item.supply.code,
                    'quantity': item.quantity,
                    'batch': {
                        'id': batch.id,
                        'batch_number': batch.batch_number,
                        'production_date': str(batch.production_date),
                        'expiry_date': str(batch.expiry_date),
                        'storage_location': batch.storage_location,
                        'days_to_expire': batch.days_to_expire,
                        'is_warning': batch.is_warning,
                        'is_expired': batch.is_expired,
                    },
                    'storage_location': item.storage_location,
                    'can_enter_or': not batch.is_expired and not batch.is_warning,
                    'warning': '即将过期，请谨慎使用' if batch.is_warning else None,
                }
            })
        except Batch.DoesNotExist:
            return Response(
                {'status': 'error', 'error_code': 'BATCH_NOT_FOUND', 'message': '批号不存在'},
                status=status.HTTP_404_NOT_FOUND
            )


class UsageRecordViewSet(viewsets.ModelViewSet):
    queryset = UsageRecord.objects.all()
    serializer_class = UsageRecordSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['schedule', 'is_high_value', 'is_double_confirmed']
    search_fields = ['supply__name', 'batch__batch_number']

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        batch = serializer.validated_data.get('batch')
        schedule = serializer.validated_data.get('schedule')
        supply = serializer.validated_data.get('supply')
        prepared_item = serializer.validated_data.get('prepared_item')
        quantity = serializer.validated_data.get('quantity', 1)

        is_high_value = supply.supply_type == 'HIGH_VALUE'

        if is_high_value:
            return Response({
                'status': 'error',
                'error_code': 'SCAN_REQUIRED',
                'message': '高值耗材必须通过扫码绑定到具体手术，请使用 /scan_by_batch 或 /scan 接口',
                'help': {
                    'recommended_endpoint': '/api/surgery/usage-records/scan_by_batch/',
                    'required_params': ['batch_number', 'schedule_id'],
                    'reason': '高值耗材全流程可追溯，强制扫码绑定确保审计完整'
                }
            }, status=status.HTTP_403_FORBIDDEN)

        if batch.check_expired() or batch.is_expired:
            return Response({
                'status': 'error',
                'error_code': 'BATCH_EXPIRED',
                'message': f'批号 {batch.batch_number} 已过期，禁止领用',
                'batch_info': {
                    'id': batch.id,
                    'batch_number': batch.batch_number,
                    'expiry_date': str(batch.expiry_date),
                    'supply_name': supply.name,
                }
            }, status=status.HTTP_400_BAD_REQUEST)

        if batch.supply_id != supply.id:
            return Response({
                'status': 'error',
                'error_code': 'BATCH_SUPPLY_MISMATCH',
                'message': '批号与耗材不匹配',
            }, status=status.HTTP_400_BAD_REQUEST)

        if prepared_item:
            if prepared_item.schedule_id != schedule.id:
                return Response({
                    'status': 'error',
                    'error_code': 'PREPARED_ITEM_SCHEDULE_MISMATCH',
                    'message': '备包物品不属于该手术排班',
                    'details': {
                        'prepared_item_schedule_id': prepared_item.schedule_id,
                        'provided_schedule_id': schedule.id,
                    }
                }, status=status.HTTP_400_BAD_REQUEST)
            if prepared_item.supply_id != supply.id:
                return Response({
                    'status': 'error',
                    'error_code': 'PREPARED_ITEM_SUPPLY_MISMATCH',
                    'message': '备包物品与耗材不匹配',
                    'details': {
                        'prepared_item_supply_id': prepared_item.supply_id,
                        'provided_supply_id': supply.id,
                    }
                }, status=status.HTTP_400_BAD_REQUEST)
            if prepared_item.batch_id and prepared_item.batch_id != batch.id:
                return Response({
                    'status': 'error',
                    'error_code': 'PREPARED_ITEM_BATCH_MISMATCH',
                    'message': '备包物品批号与提供批号不匹配',
                    'details': {
                        'prepared_item_batch_id': prepared_item.batch_id,
                        'provided_batch_id': batch.id,
                    }
                }, status=status.HTTP_400_BAD_REQUEST)
        else:
            prepared_item = PreparedItem.objects.filter(
                schedule=schedule, supply=supply
            ).first()
            if not prepared_item:
                return Response({
                    'status': 'error',
                    'error_code': 'NO_PREPARED_ITEM',
                    'message': '该手术未备此耗材，请先添加备包物品',
                    'details': {
                        'schedule_id': schedule.id,
                        'supply_id': supply.id,
                        'supply_name': supply.name,
                    }
                }, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            usage_record = UsageRecord.objects.create(
                schedule=schedule,
                prepared_item=prepared_item,
                supply=supply,
                batch=batch,
                quantity=quantity,
                is_high_value=is_high_value,
                is_scan_created=False,
                used_by=request.user,
            )

            prepared_item.status = 'USED'
            prepared_item.save()

        headers = self.get_success_headers(serializer.data)
        return Response({
            'status': 'success',
            'message': '普通耗材领用成功',
            'usage_record_id': usage_record.id,
            'is_high_value': False,
            'is_scan_created': False,
            'bound_to_surgery': {
                'schedule_id': schedule.id,
                'patient_name': schedule.patient_name,
                'patient_id': schedule.patient_id,
                'operation_room': schedule.operation_room,
            },
            'supply': {
                'id': supply.id,
                'name': supply.name,
                'code': supply.code,
                'type': supply.supply_type,
            },
            'batch': {
                'id': batch.id,
                'batch_number': batch.batch_number,
                'production_date': str(batch.production_date),
                'expiry_date': str(batch.expiry_date),
                'days_to_expire': batch.days_to_expire,
                'storage_location': batch.storage_location,
            },
            'quantity': quantity,
            'need_double_confirm': False,
        }, status=status.HTTP_201_CREATED, headers=headers)

    @action(detail=True, methods=['post'])
    def confirm(self, request, pk=None):
        record = self.get_object()
        try:
            record.confirm(request.user)
            return Response({
                'status': 'success',
                'message': '双人确认成功',
                'usage_record': {
                    'id': record.id,
                    'supply_name': record.supply.name,
                    'batch_number': record.batch.batch_number,
                    'quantity': record.quantity,
                    'is_high_value': record.is_high_value,
                    'used_by': record.used_by.username,
                    'confirmed_by': record.confirmed_by.username if record.confirmed_by else None,
                    'confirm_time': str(record.confirm_time) if record.confirm_time else None,
                }
            })
        except Exception as e:
            return Response(
                {'status': 'error', 'message': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['post'])
    def scan(self, request, pk=None):
        record = self.get_object()
        if record.batch.check_expired() or record.batch.is_expired:
            return Response({
                'status': 'error',
                'error_code': 'BATCH_EXPIRED',
                'message': f'批号 {record.batch.batch_number} 已过期，禁止使用',
                'batch': {
                    'id': record.batch.id,
                    'batch_number': record.batch.batch_number,
                    'expiry_date': str(record.batch.expiry_date),
                }
            }, status=status.HTTP_400_BAD_REQUEST)

        if record.prepared_item:
            if record.prepared_item.schedule_id != record.schedule_id:
                return Response({
                    'status': 'error',
                    'error_code': 'PREPARED_ITEM_SCHEDULE_MISMATCH',
                    'message': '备包物品与手术排班不匹配，无法扫码',
                }, status=status.HTTP_400_BAD_REQUEST)
            if record.prepared_item.supply_id != record.supply_id:
                return Response({
                    'status': 'error',
                    'error_code': 'PREPARED_ITEM_SUPPLY_MISMATCH',
                    'message': '备包物品与耗材不匹配，无法扫码',
                }, status=status.HTTP_400_BAD_REQUEST)
            if record.prepared_item.batch_id and record.prepared_item.batch_id != record.batch_id:
                return Response({
                    'status': 'error',
                    'error_code': 'PREPARED_ITEM_BATCH_MISMATCH',
                    'message': '备包物品已有批号与领用批号不匹配，无法扫码',
                    'details': {
                        'prepared_item_batch_id': record.prepared_item.batch_id,
                        'prepared_item_batch_number': record.prepared_item.batch.batch_number if record.prepared_item.batch else None,
                        'usage_batch_id': record.batch_id,
                        'usage_batch_number': record.batch.batch_number,
                    }
                }, status=status.HTTP_400_BAD_REQUEST)

        if record.batch.supply_id != record.supply_id:
            return Response({
                'status': 'error',
                'error_code': 'BATCH_SUPPLY_MISMATCH',
                'message': '批号与耗材不匹配，无法扫码',
            }, status=status.HTTP_400_BAD_REQUEST)

        is_high_value = record.supply.supply_type == 'HIGH_VALUE'
        record.is_high_value = is_high_value
        record.is_scan_created = True
        record.save()
        audit_record = None
        if is_high_value:
            audit_record = HighValueAudit.objects.create(
                schedule=record.schedule,
                supply=record.supply,
                batch=record.batch,
                quantity=record.quantity,
                action_type='USED',
                operator=request.user,
            )
        return Response({
            'status': 'success',
            'message': '扫码领用成功',
            'usage_record_id': record.id,
            'is_high_value': is_high_value,
            'is_scan_created': True,
            'bound_to_surgery': {
                'schedule_id': record.schedule.id,
                'patient_name': record.schedule.patient_name,
                'patient_id': record.schedule.patient_id,
                'operation_room': record.schedule.operation_room,
                'template_name': record.schedule.template.name,
            },
            'supply_info': {
                'id': record.supply.id,
                'name': record.supply.name,
                'code': record.supply.code,
                'type': record.supply.supply_type,
            },
            'batch_info': {
                'id': record.batch.id,
                'batch_number': record.batch.batch_number,
                'expiry_date': str(record.batch.expiry_date),
                'days_to_expire': record.batch.days_to_expire,
                'storage_location': record.batch.storage_location,
            },
            'quantity': record.quantity,
            'audit_record_id': audit_record.id if audit_record else None,
            'need_double_confirm': is_high_value,
        })

    @action(detail=False, methods=['post'])
    def scan_by_batch(self, request):
        batch_number = request.data.get('batch_number')
        schedule_id = request.data.get('schedule_id')
        quantity = int(request.data.get('quantity', 1))
        prepared_item_id = request.data.get('prepared_item_id')

        if not batch_number or not schedule_id:
            return Response(
                {'status': 'error', 'message': '请提供批号和手术排班ID'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            batch = Batch.objects.get(batch_number=batch_number)
            if batch.check_expired() or batch.is_expired:
                return Response({
                    'status': 'error',
                    'error_code': 'BATCH_EXPIRED',
                    'message': f'批号 {batch_number} 已过期，禁止扫码领用',
                    'batch_info': {
                        'batch_number': batch.batch_number,
                        'expiry_date': str(batch.expiry_date),
                    }
                }, status=status.HTTP_400_BAD_REQUEST)

            schedule = OperationSchedule.objects.get(id=schedule_id)
            prepared_item = None
            if prepared_item_id:
                prepared_item = PreparedItem.objects.get(id=prepared_item_id)
                if prepared_item.schedule_id != schedule.id:
                    return Response({
                        'status': 'error',
                        'error_code': 'PREPARED_ITEM_SCHEDULE_MISMATCH',
                        'message': '备包物品不属于该手术排班',
                        'details': {
                            'prepared_item_schedule_id': prepared_item.schedule_id,
                            'provided_schedule_id': schedule.id,
                        }
                    }, status=status.HTTP_400_BAD_REQUEST)
                if prepared_item.supply_id != batch.supply_id:
                    return Response({
                        'status': 'error',
                        'error_code': 'PREPARED_ITEM_SUPPLY_MISMATCH',
                        'message': '备包物品与批号耗材不匹配',
                        'details': {
                            'prepared_item_supply_id': prepared_item.supply_id,
                            'batch_supply_id': batch.supply_id,
                            'prepared_item_supply_name': prepared_item.supply.name,
                            'batch_supply_name': batch.supply.name,
                        }
                    }, status=status.HTTP_400_BAD_REQUEST)
                if prepared_item.batch_id and prepared_item.batch_id != batch.id:
                    return Response({
                        'status': 'error',
                        'error_code': 'PREPARED_ITEM_BATCH_MISMATCH',
                        'message': '备包物品已有批号与扫码批号不一致',
                        'details': {
                            'prepared_item_batch_id': prepared_item.batch_id,
                            'prepared_item_batch_number': prepared_item.batch.batch_number if prepared_item.batch else None,
                            'scanned_batch_id': batch.id,
                            'scanned_batch_number': batch.batch_number,
                        }
                    }, status=status.HTTP_400_BAD_REQUEST)
            else:
                prepared_item = PreparedItem.objects.filter(
                    schedule=schedule, supply=batch.supply
                ).first()

            if not prepared_item:
                return Response({
                    'status': 'error',
                    'error_code': 'NO_PREPARED_ITEM',
                    'message': '该手术未备此耗材，请先添加备包物品',
                    'details': {
                        'schedule_id': schedule.id,
                        'supply_id': batch.supply.id,
                        'supply_name': batch.supply.name,
                    }
                }, status=status.HTTP_400_BAD_REQUEST)

            if prepared_item.batch_id is None:
                prepared_item.batch = batch
                prepared_item.storage_location = batch.storage_location
                prepared_item.save()

            usage_record = UsageRecord.objects.create(
                schedule=schedule,
                prepared_item=prepared_item,
                supply=batch.supply,
                batch=batch,
                quantity=quantity,
                is_high_value=batch.supply.supply_type == 'HIGH_VALUE',
                is_scan_created=True,
                used_by=request.user,
            )

            audit_record = None
            if usage_record.is_high_value:
                audit_record = HighValueAudit.objects.create(
                    schedule=schedule,
                    supply=batch.supply,
                    batch=batch,
                    quantity=quantity,
                    action_type='USED',
                    operator=request.user,
                )

            prepared_item.status = 'USED'
            prepared_item.save()

            return Response({
                'status': 'success',
                'message': '扫码绑定成功',
                'usage_record_id': usage_record.id,
                'is_high_value': usage_record.is_high_value,
                'is_scan_created': True,
                'bound_to_surgery': {
                    'schedule_id': schedule.id,
                    'patient_name': schedule.patient_name,
                    'patient_id': schedule.patient_id,
                    'operation_room': schedule.operation_room,
                },
                'supply': {
                    'id': batch.supply.id,
                    'name': batch.supply.name,
                    'code': batch.supply.code,
                    'type': batch.supply.supply_type,
                },
                'batch': {
                    'id': batch.id,
                    'batch_number': batch.batch_number,
                    'production_date': str(batch.production_date),
                    'expiry_date': str(batch.expiry_date),
                    'days_to_expire': batch.days_to_expire,
                    'storage_location': batch.storage_location,
                },
                'quantity': quantity,
                'audit_record_id': audit_record.id if audit_record else None,
                'need_double_confirm': usage_record.is_high_value,
            })

        except Batch.DoesNotExist:
            return Response(
                {'status': 'error', 'message': '批号不存在'},
                status=status.HTTP_404_NOT_FOUND
            )
        except OperationSchedule.DoesNotExist:
            return Response(
                {'status': 'error', 'message': '手术排班不存在'},
                status=status.HTTP_404_NOT_FOUND
            )


class ReturnRecordViewSet(viewsets.ModelViewSet):
    queryset = ReturnRecord.objects.all()
    serializer_class = ReturnRecordSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['schedule', 'return_status', 'is_high_value', 'is_double_confirmed']
    search_fields = ['supply__name', 'batch__batch_number']

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        batch = serializer.validated_data.get('batch')
        supply = serializer.validated_data.get('supply')
        schedule = serializer.validated_data.get('schedule')
        return_status = serializer.validated_data.get('return_status')
        quantity = serializer.validated_data.get('quantity')

        if batch.check_expired() or batch.is_expired:
            return Response({
                'status': 'error',
                'error_code': 'BATCH_EXPIRED',
                'message': f'批号 {batch.batch_number} 已过期，不能退包（建议直接报损）',
                'batch_info': {
                    'id': batch.id,
                    'batch_number': batch.batch_number,
                    'expiry_date': str(batch.expiry_date),
                    'supply_name': supply.name,
                }
            }, status=status.HTTP_400_BAD_REQUEST)

        if batch.supply_id != supply.id:
            return Response({
                'status': 'error',
                'error_code': 'BATCH_SUPPLY_MISMATCH',
                'message': '批号与耗材不匹配',
            }, status=status.HTTP_400_BAD_REQUEST)

        is_high_value = supply.supply_type == 'HIGH_VALUE'

        with transaction.atomic():
            return_record = ReturnRecord.objects.create(
                schedule=schedule,
                supply=supply,
                batch=batch,
                quantity=quantity,
                return_status=return_status,
                is_high_value=is_high_value,
                returned_by=request.user,
            )

            audit_record = None
            if is_high_value:
                action_type = 'RETURNED' if return_status in ['UNOPENED', 'OPENED'] else 'DAMAGED'
                audit_record = HighValueAudit.objects.create(
                    schedule=schedule,
                    supply=supply,
                    batch=batch,
                    quantity=quantity,
                    action_type=action_type,
                    operator=request.user,
                )

        headers = self.get_success_headers(serializer.data)
        return Response({
            'status': 'success',
            'message': '退包登记成功',
            'return_record': {
                'id': return_record.id,
                'supply_name': return_record.supply.name,
                'supply_code': return_record.supply.code,
                'supply_type': return_record.supply.supply_type,
                'batch_number': return_record.batch.batch_number,
                'batch_id': return_record.batch.id,
                'quantity': return_record.quantity,
                'return_status': return_record.return_status,
                'return_status_display': return_record.get_return_status_display(),
                'is_high_value': return_record.is_high_value,
                'returned_by': return_record.returned_by.username,
                'return_time': str(return_record.return_time),
                'is_double_confirmed': return_record.is_double_confirmed,
            },
            'audit_record_id': audit_record.id if audit_record else None,
            'need_double_confirm': is_high_value,
        }, status=status.HTTP_201_CREATED, headers=headers)

    @action(detail=True, methods=['post'])
    def confirm(self, request, pk=None):
        record = self.get_object()
        try:
            record.confirm(request.user)
            return Response({
                'status': 'success',
                'message': '退包确认成功',
                'return_record': {
                    'id': record.id,
                    'supply_name': record.supply.name,
                    'batch_number': record.batch.batch_number,
                    'quantity': record.quantity,
                    'return_status': record.return_status,
                    'is_double_confirmed': record.is_double_confirmed,
                    'confirmed_by': record.confirmed_by.username if record.confirmed_by else None,
                    'confirm_time': str(record.confirm_time) if record.confirm_time else None,
                }
            })
        except Exception as e:
            return Response(
                {'status': 'error', 'message': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=['post'])
    def inventory_count(self, request):
        schedule_id = request.data.get('schedule_id')
        if not schedule_id:
            return Response(
                {'status': 'error', 'message': '请提供手术排班ID'},
                status=status.HTTP_400_BAD_REQUEST
            )
        try:
            schedule = OperationSchedule.objects.get(id=schedule_id)
            prepared_items = PreparedItem.objects.filter(schedule=schedule)
            return_records = ReturnRecord.objects.filter(schedule=schedule)
            usage_records = UsageRecord.objects.filter(schedule=schedule)

            prepared_total = prepared_items.aggregate(
                total=Sum('quantity')
            )['total'] or 0
            used_total = usage_records.aggregate(
                total=Sum('quantity')
            )['total'] or 0
            returned_total = return_records.aggregate(
                total=Sum('quantity')
            )['total'] or 0

            unopened_qs = return_records.filter(return_status='UNOPENED')
            opened_qs = return_records.filter(return_status='OPENED')
            damaged_qs = return_records.filter(return_status='DAMAGED')

            unopened = unopened_qs.aggregate(total=Sum('quantity'))['total'] or 0
            opened = opened_qs.aggregate(total=Sum('quantity'))['total'] or 0
            damaged = damaged_qs.aggregate(total=Sum('quantity'))['total'] or 0

            unconfirmed = return_records.filter(is_double_confirmed=False).count()
            high_value_pending = return_records.filter(
                is_high_value=True, is_double_confirmed=False
            ).count()

            def build_return_item_list(qs):
                return [
                    {
                        'id': r.id,
                        'supply_name': r.supply.name,
                        'supply_code': r.supply.code,
                        'supply_type': r.supply.supply_type,
                        'batch_id': r.batch.id,
                        'batch_number': r.batch.batch_number,
                        'expiry_date': str(r.batch.expiry_date),
                        'quantity': r.quantity,
                        'unit': r.supply.unit,
                        'return_status': r.return_status,
                        'return_status_display': r.get_return_status_display(),
                        'is_high_value': r.is_high_value,
                        'is_double_confirmed': r.is_double_confirmed,
                        'returned_by': r.returned_by.username,
                        'return_time': str(r.return_time),
                        'remark': r.remark,
                    }
                    for r in qs
                ]

            return Response({
                'status': 'success',
                'schedule': {
                    'id': schedule.id,
                    'patient_name': schedule.patient_name,
                    'patient_id': schedule.patient_id,
                    'operation_room': schedule.operation_room,
                    'template_name': schedule.template.name,
                    'operation_date': str(schedule.operation_date),
                },
                'inventory_summary': {
                    'prepared_count': prepared_items.count(),
                    'prepared_quantity': prepared_total,
                    'used_count': usage_records.count(),
                    'used_quantity': used_total,
                    'returned_count': return_records.count(),
                    'returned_quantity': returned_total,
                },
                'return_breakdown': {
                    'unopened': {
                        'count': unopened_qs.count(),
                        'quantity': unopened,
                        'items': build_return_item_list(unopened_qs),
                    },
                    'opened': {
                        'count': opened_qs.count(),
                        'quantity': opened,
                        'items': build_return_item_list(opened_qs),
                    },
                    'damaged': {
                        'count': damaged_qs.count(),
                        'quantity': damaged,
                        'items': build_return_item_list(damaged_qs),
                    },
                },
                'pending_confirmation': {
                    'unconfirmed_count': unconfirmed,
                    'high_value_pending_count': high_value_pending,
                    'items': build_return_item_list(
                        return_records.filter(is_double_confirmed=False)
                    ),
                },
                'all_returned_items': build_return_item_list(return_records),
            })
        except OperationSchedule.DoesNotExist:
            return Response(
                {'status': 'error', 'message': '手术排班不存在'},
                status=status.HTTP_404_NOT_FOUND
            )


class HighValueAuditViewSet(viewsets.ModelViewSet):
    queryset = HighValueAudit.objects.all()
    serializer_class = HighValueAuditSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['schedule', 'action_type', 'is_audited']
    search_fields = ['supply__name', 'batch__batch_number']
    http_method_names = ['get', 'put', 'patch', 'head', 'options']

    @action(detail=True, methods=['post'])
    def audit(self, request, pk=None):
        audit = self.get_object()
        if audit.is_audited:
            return Response(
                {'status': 'error', 'message': '该记录已审核'},
                status=status.HTTP_400_BAD_REQUEST
            )
        audit.is_audited = True
        audit.auditor = request.user
        audit.audit_time = timezone.now()
        audit.save()
        return Response({'status': 'success', 'message': '审核成功'})

    @action(detail=False, methods=['get'])
    def report(self, request):
        from django.db.models import Sum, Count
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        queryset = self.queryset
        if start_date:
            queryset = queryset.filter(action_time__date__gte=start_date)
        if end_date:
            queryset = queryset.filter(action_time__date__lte=end_date)
        report_data = {
            'total_records': queryset.count(),
            'unaudited_count': queryset.filter(is_audited=False).count(),
            'by_action_type': list(queryset.values('action_type').annotate(
                count=Count('id'),
                total_quantity=Sum('quantity')
            )),
            'by_supply': list(queryset.values('supply__name', 'supply__code').annotate(
                count=Count('id'),
                total_quantity=Sum('quantity')
            )),
        }
        return Response(report_data)
