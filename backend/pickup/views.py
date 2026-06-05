from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from common.permissions import IsAdminOrTeacher, IsAdminOrTeacherOrReadOnly
from common.audit import log_audit
from common.validators import validate_authorized_pickup
from .models import PickupRecord
from .serializers import PickupRecordSerializer, PickupVerifySerializer


class PickupRecordListView(generics.ListCreateAPIView):
    serializer_class = PickupRecordSerializer
    permission_classes = [IsAuthenticated, IsAdminOrTeacherOrReadOnly]
    filterset_fields = ['child', 'direction', 'status', 'pickup_time']
    search_fields = ['child__name', 'actual_person_name']

    def get_queryset(self):
        qs = PickupRecord.objects.select_related('child', 'authorized_person', 'verified_by').order_by('-pickup_time')
        if self.request.user.role == 'teacher':
            qs = qs.filter(child__class_group__teacher=self.request.user)
        elif self.request.user.role == 'parent':
            qs = qs.filter(child__parent_relations__parent=self.request.user)
        return qs.distinct()

    def perform_create(self, serializer):
        obj = serializer.save()
        log_audit(self.request.user, 'create', 'PickupRecord', obj.pk,
                  detail=f'{obj.get_direction_display()} - {obj.actual_person_name}')


class PickupRecordDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = PickupRecord.objects.select_related('child', 'authorized_person', 'verified_by')
    serializer_class = PickupRecordSerializer
    permission_classes = [IsAuthenticated, IsAdminOrTeacher]


class PickupVerifyView(generics.GenericAPIView):
    serializer_class = PickupVerifySerializer
    permission_classes = [IsAuthenticated, IsAdminOrTeacher]

    def post(self, request, pk):
        try:
            record = PickupRecord.objects.get(pk=pk)
        except PickupRecord.DoesNotExist:
            return Response({'detail': '记录不存在'}, status=status.HTTP_404_NOT_FOUND)

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        action = serializer.validated_data['action']
        if action == 'verified':
            if record.authorized_person:
                pass
            elif record.actual_person_name:
                try:
                    validate_authorized_pickup(
                        record.child_id, record.actual_person_name,
                        request.data.get('actual_person_phone', '')
                    )
                except Exception:
                    if not request.user.role == 'admin':
                        return Response(
                            {'detail': f'{record.actual_person_name} 不是授权接送人，无法核验通过'},
                            status=status.HTTP_400_BAD_REQUEST,
                        )
            record.status = 'verified'
            record.verified_by = request.user
        else:
            record.status = 'rejected'
            record.verified_by = request.user

        record.remark = serializer.validated_data.get('remark', record.remark)
        record.save()
        log_audit(request.user, action, 'PickupRecord', record.pk,
                  detail=f'核验结果: {record.get_status_display()}')
        return Response(PickupRecordSerializer(record).data)


class TodayPickupStatsView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated, IsAdminOrTeacher]

    def get(self, request):
        from django.utils import timezone
        today = timezone.now().date()
        base_qs = PickupRecord.objects.filter(pickup_time__date=today)
        if request.user.role == 'teacher':
            base_qs = base_qs.filter(child__class_group__teacher=request.user)
        stats = {
            'total': base_qs.count(),
            'dropoff': base_qs.filter(direction='dropoff').count(),
            'pickup': base_qs.filter(direction='pickup').count(),
            'verified': base_qs.filter(status='verified').count(),
            'pending': base_qs.filter(status='pending').count(),
            'rejected': base_qs.filter(status='rejected').count(),
        }
        return Response(stats)
