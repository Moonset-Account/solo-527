from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from .models import PickupRecord, PickupTask
from .serializers import PickupRecordSerializer, PickupTaskSerializer, PickupVerifySerializer
from core.permissions import IsTeacherOrDirector
from apps.children.models import AuthorizedPickupPerson


class PickupRecordViewSet(viewsets.ModelViewSet):
    queryset = PickupRecord.objects.filter(is_deleted=False)
    serializer_class = PickupRecordSerializer
    permission_classes = [IsTeacherOrDirector]
    filterset_fields = ['child', 'pickup_type', 'status', 'pickup_time']
    search_fields = ['child__name', 'pickup_person_name', 'pickup_person_phone']
    ordering_fields = ['pickup_time', 'created_at']

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if user.role == 'teacher':
            class_ids = user.teacher_profile.classes.values_list('id', flat=True)
            qs = qs.filter(child__child_class_id__in=class_ids)
        return qs

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)

    @action(detail=True, methods=['post'], serializer_class=PickupVerifySerializer)
    def verify(self, request, pk=None):
        record = self.get_object()
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        record.status = data['status']
        record.verified_by = request.user
        record.verified_at = timezone.now()
        if data['status'] == 'rejected':
            record.reject_reason = data.get('reject_reason', '')
        if data.get('temperature'):
            record.temperature = data['temperature']
        if not record.pickup_time:
            record.pickup_time = timezone.now()
        record.updated_by = request.user
        record.save()

        return Response(PickupRecordSerializer(record).data)

    @action(detail=False, methods=['post'])
    def check_authorized(self, request):
        child_id = request.data.get('child_id')
        phone = request.data.get('phone')
        name = request.data.get('name')

        if not child_id or not phone:
            return Response(
                {'error': '缺少必要参数'},
                status=status.HTTP_400_BAD_REQUEST
            )

        authorized = AuthorizedPickupPerson.objects.filter(
            child_id=child_id,
            phone=phone,
            is_active=True,
            is_deleted=False
        )
        if name:
            authorized = authorized.filter(name__icontains=name)

        person = authorized.first()
        if person:
            if person.expires_at and person.expires_at < timezone.now():
                return Response({'authorized': False, 'reason': '授权已过期'})
            return Response({
                'authorized': True,
                'person': {
                    'id': person.id,
                    'name': person.name,
                    'relation': person.relation,
                    'phone': person.phone
                }
            })
        return Response({'authorized': False, 'reason': '未找到授权人'})


class PickupTaskViewSet(viewsets.ModelViewSet):
    queryset = PickupTask.objects.filter(is_deleted=False)
    serializer_class = PickupTaskSerializer
    permission_classes = [IsTeacherOrDirector]
    filterset_fields = ['child', 'pickup_type', 'status', 'assigned_teacher']
    search_fields = ['child__name']
    ordering_fields = ['scheduled_time']

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if user.role == 'teacher':
            qs = qs.filter(assigned_teacher=user)
        return qs

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)
