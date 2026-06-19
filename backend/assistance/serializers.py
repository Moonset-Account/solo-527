from rest_framework import serializers
from .models import AssistanceDemand, AssistanceProgress, AssistanceProcessRecord
from common.serializers import ProductionDataSerializerMixin
from users.serializers import UserSerializer
from residents.serializers import ResidentSerializer


class AssistanceProgressSerializer(serializers.ModelSerializer):
    processed_by_name = serializers.CharField(source='processed_by.get_full_name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    assistance_title = serializers.CharField(source='assistance.title', read_only=True)

    class Meta:
        model = AssistanceProgress
        fields = '__all__'
        read_only_fields = ['processed_by', 'processed_at']


class AssistanceProcessRecordSerializer(serializers.ModelSerializer):
    processed_by_name = serializers.CharField(source='processed_by.get_full_name', read_only=True)
    status_change_display = serializers.CharField(source='get_status_change_display', read_only=True)

    class Meta:
        model = AssistanceProcessRecord
        fields = '__all__'
        read_only_fields = ['processed_by', 'processed_at']


class AssistanceDemandSerializer(ProductionDataSerializerMixin, serializers.ModelSerializer):
    resident = ResidentSerializer(read_only=True)
    resident_id = serializers.IntegerField(write_only=True, required=True)
    assigned_to = UserSerializer(read_only=True)
    assigned_to_id = serializers.IntegerField(write_only=True, required=False)
    process_records = AssistanceProcessRecordSerializer(many=True, read_only=True)
    progress_records = AssistanceProgressSerializer(many=True, read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    type_display = serializers.CharField(source='get_type_display', read_only=True)
    resident_name = serializers.CharField(source='resident.user.get_full_name', read_only=True)

    class Meta:
        model = AssistanceDemand
        fields = '__all__'
        read_only_fields = ['created_by', 'updated_by', 'actual_start_time', 'actual_end_time']


class AssistanceDemandDetailSerializer(AssistanceDemandSerializer):
    class Meta(AssistanceDemandSerializer.Meta):
        depth = 1


class AssistanceAssignSerializer(serializers.Serializer):
    volunteer_id = serializers.IntegerField(required=True)


class AssistanceCompleteSerializer(serializers.Serializer):
    result = serializers.CharField(required=True)
    satisfaction = serializers.IntegerField(required=False, min_value=1, max_value=5)


class AssistanceProgressCreateSerializer(serializers.Serializer):
    content = serializers.CharField(required=True)
    status = serializers.ChoiceField(choices=AssistanceDemand.STATUS_CHOICES, required=False, default='in_progress')
    remark = serializers.CharField(required=False, allow_blank=True)


class AssistanceProcessCreateSerializer(serializers.Serializer):
    content = serializers.CharField(required=True)
    remark = serializers.CharField(required=False, allow_blank=True)
