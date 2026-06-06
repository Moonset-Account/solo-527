from rest_framework import serializers
from .models import LeaveRequest


class LeaveRequestSerializer(serializers.ModelSerializer):
    child_name = serializers.CharField(source='child.name', read_only=True)
    leave_type_display = serializers.CharField(source='get_leave_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    submitted_by_name = serializers.CharField(source='submitted_by.name', read_only=True)
    reviewed_by_name = serializers.CharField(source='reviewed_by.name', read_only=True)
    total_days = serializers.FloatField(read_only=True)
    start_session_display = serializers.CharField(source='get_start_session_display', read_only=True)
    end_session_display = serializers.CharField(source='get_end_session_display', read_only=True)

    class Meta:
        model = LeaveRequest
        fields = ['id', 'child', 'child_name', 'leave_type', 'leave_type_display',
                  'start_date', 'end_date', 'start_session', 'start_session_display',
                  'end_session', 'end_session_display', 'total_days', 'reason',
                  'attachments', 'status', 'status_display', 'submitted_by',
                  'submitted_by_name', 'reviewed_by', 'reviewed_by_name',
                  'reviewed_at', 'review_comment']
        read_only_fields = ['submitted_by', 'reviewed_by', 'reviewed_at', 'status']
