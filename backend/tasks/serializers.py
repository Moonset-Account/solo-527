from rest_framework import serializers
from .models import Task, TaskProcessRecord
from common.serializers import ProductionDataSerializerMixin
from users.serializers import UserSerializer
from residents.serializers import ResidentSerializer


class TaskProcessRecordSerializer(serializers.ModelSerializer):
    processed_by_name = serializers.CharField(source='processed_by.get_full_name', read_only=True)
    status_change_display = serializers.CharField(source='get_status_change_display', read_only=True)

    class Meta:
        model = TaskProcessRecord
        fields = '__all__'
        read_only_fields = ['processed_by', 'processed_at']


class TaskSerializer(ProductionDataSerializerMixin, serializers.ModelSerializer):
    assigned_to = UserSerializer(read_only=True)
    assigned_to_id = serializers.IntegerField(write_only=True, required=False)
    related_resident = ResidentSerializer(read_only=True)
    related_resident_id = serializers.IntegerField(write_only=True, required=False)
    process_records = TaskProcessRecordSerializer(many=True, read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    type_display = serializers.CharField(source='get_type_display', read_only=True)

    class Meta:
        model = Task
        fields = '__all__'
        read_only_fields = ['created_by', 'updated_by', 'completed_at']


class TaskDetailSerializer(TaskSerializer):
    class Meta(TaskSerializer.Meta):
        depth = 1


class TaskStatusUpdateSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=Task.STATUS_CHOICES, required=True)
    remark = serializers.CharField(required=False, allow_blank=True)
    assigned_to_id = serializers.IntegerField(required=False)


class TaskProcessCreateSerializer(serializers.Serializer):
    content = serializers.CharField(required=True)
    remark = serializers.CharField(required=False, allow_blank=True)
