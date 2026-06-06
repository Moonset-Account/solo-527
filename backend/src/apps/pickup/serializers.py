from rest_framework import serializers
from .models import PickupRecord, PickupTask
from apps.children.serializers import ChildSerializer


class PickupRecordSerializer(serializers.ModelSerializer):
    child_name = serializers.CharField(source='child.name', read_only=True)
    pickup_type_display = serializers.CharField(source='get_pickup_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    verified_by_name = serializers.CharField(source='verified_by.name', read_only=True)

    class Meta:
        model = PickupRecord
        fields = ['id', 'child', 'child_name', 'pickup_type', 'pickup_type_display',
                  'pickup_time', 'pickup_person_name', 'pickup_person_phone',
                  'pickup_person_relation', 'authorized_person', 'status', 'status_display',
                  'verified_by', 'verified_by_name', 'verified_at', 'reject_reason',
                  'notes', 'temperature', 'photos']
        read_only_fields = ['verified_by', 'verified_at']


class PickupTaskSerializer(serializers.ModelSerializer):
    child_name = serializers.CharField(source='child.name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    pickup_type_display = serializers.CharField(source='get_pickup_type_display', read_only=True)
    assigned_teacher_name = serializers.CharField(source='assigned_teacher.name', read_only=True)

    class Meta:
        model = PickupTask
        fields = ['id', 'child', 'child_name', 'scheduled_time', 'pickup_type',
                  'pickup_type_display', 'assigned_teacher', 'assigned_teacher_name',
                  'status', 'status_display', 'pickup_record', 'remarks']


class PickupVerifySerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=['verified', 'rejected'])
    reject_reason = serializers.CharField(required=False, allow_blank=True)
    temperature = serializers.DecimalField(max_digits=3, decimal_places=1, required=False, allow_null=True)
