from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from .models import LeaveRequest
from .serializers import LeaveRequestSerializer
from core.permissions import IsTeacherOrDirector, IsParent, permissions


class LeaveRequestViewSet(viewsets.ModelViewSet):
    queryset = LeaveRequest.objects.filter(is_deleted=False)
    serializer_class = LeaveRequestSerializer
    permission_classes = [IsTeacherOrDirector | IsParent]
    filterset_fields = ['child', 'leave_type', 'status', 'start_date', 'end_date']
    search_fields = ['child__name', 'reason']
    ordering_fields = ['created_at', 'start_date']

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if user.role == 'parent':
            qs = qs.filter(child__parents=user)
        elif user.role == 'teacher':
            class_ids = user.teacher_profile.classes.values_list('id', flat=True)
            qs = qs.filter(child__child_class_id__in=class_ids)
        return qs

    def perform_create(self, serializer):
        serializer.save(
            submitted_by=self.request.user,
            status='pending',
            created_by=self.request.user
        )

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)

    def get_permissions(self):
        if self.action in ['approve', 'reject']:
            return [IsTeacherOrDirector()]
        return super().get_permissions()

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        leave = self.get_object()
        if leave.status != 'pending':
            return Response({'error': '只能审批待审批的请假'}, status=status.HTTP_400_BAD_REQUEST)
        leave.status = 'approved'
        leave.reviewed_by = request.user
        leave.reviewed_at = timezone.now()
        leave.review_comment = request.data.get('comment', '')
        leave.updated_by = request.user
        leave.save()
        return Response(LeaveRequestSerializer(leave).data)

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        leave = self.get_object()
        if leave.status != 'pending':
            return Response({'error': '只能审批待审批的请假'}, status=status.HTTP_400_BAD_REQUEST)
        leave.status = 'rejected'
        leave.reviewed_by = request.user
        leave.reviewed_at = timezone.now()
        leave.review_comment = request.data.get('comment', '')
        leave.updated_by = request.user
        leave.save()
        return Response(LeaveRequestSerializer(leave).data)

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        leave = self.get_object()
        if leave.submitted_by != request.user and request.user.role not in ['teacher', 'director']:
            return Response({'error': '无权取消此请假'}, status=status.HTTP_403_FORBIDDEN)
        if leave.status not in ['pending', 'approved']:
            return Response({'error': '当前状态不能取消'}, status=status.HTTP_400_BAD_REQUEST)
        leave.status = 'cancelled'
        leave.updated_by = request.user
        leave.save()
        return Response(LeaveRequestSerializer(leave).data)

    @action(detail=False, methods=['get'])
    def pending_count(self, request):
        count = self.get_queryset().filter(status='pending').count()
        return Response({'pending_count': count})
