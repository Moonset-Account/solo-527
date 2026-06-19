from rest_framework import serializers
from .models import PatrolRoute, PatrolTask, PatrolCheckIn, PatrolProcessRecord
from common.serializers import ProductionDataSerializerMixin
from users.serializers import UserSerializer


class PatrolRouteSerializer(ProductionDataSerializerMixin, serializers.ModelSerializer):
    class Meta:
        model = PatrolRoute
        fields = '__all__'
        read_only_fields = ['created_by', 'updated_by']


class PatrolProcessRecordSerializer(serializers.ModelSerializer):
    processed_by_name = serializers.CharField(source='processed_by.get_full_name', read_only=True)
    status_change_display = serializers.CharField(source='get_status_change_display', read_only=True)

    class Meta:
        model = PatrolProcessRecord
        fields = '__all__'
        read_only_fields = ['processed_by', 'processed_at']


class PatrolTaskSerializer(ProductionDataSerializerMixin, serializers.ModelSerializer):
    route = PatrolRouteSerializer(read_only=True)
    route_id = serializers.IntegerField(write_only=True, required=False)
    assigned_to = UserSerializer(read_only=True)
    assigned_to_id = serializers.IntegerField(write_only=True, required=False)
    process_records = PatrolProcessRecordSerializer(many=True, read_only=True)
    check_ins = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)

    class Meta:
        model = PatrolTask
        fields = '__all__'
        read_only_fields = ['created_by', 'updated_by', 'actual_start_time', 'actual_end_time']

    def get_check_ins(self, obj):
        check_ins = obj.check_ins.all()[:10]
        return PatrolCheckInSerializer(check_ins, many=True).data


class PatrolTaskDetailSerializer(PatrolTaskSerializer):
    class Meta(PatrolTaskSerializer.Meta):
        depth = 1


class PatrolCheckInSerializer(ProductionDataSerializerMixin, serializers.ModelSerializer):
    volunteer = UserSerializer(read_only=True)
    task_title = serializers.CharField(source='task.title', read_only=True)

    class Meta:
        model = PatrolCheckIn
        fields = '__all__'
        read_only_fields = ['created_by', 'updated_by', 'volunteer', 'check_in_time']


class PatrolTaskStatusUpdateSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=PatrolTask.STATUS_CHOICES, required=True)
    remark = serializers.CharField(required=False, allow_blank=True)
    assigned_to_id = serializers.IntegerField(required=False)


class PatrolProcessCreateSerializer(serializers.Serializer):
    content = serializers.CharField(required=True)
    remark = serializers.CharField(required=False, allow_blank=True)
