from rest_framework import serializers
from .models import PickupRecord


class PickupRecordSerializer(serializers.ModelSerializer):
    child_name = serializers.CharField(source='child.name', read_only=True)
    verified_by_name = serializers.CharField(source='verified_by.username', read_only=True, default='')
    authorized_person_name = serializers.CharField(source='authorized_person.name', read_only=True, default='')

    class Meta:
        model = PickupRecord
        fields = '__all__'
        read_only_fields = ['id', 'verified_by', 'created_at']


class PickupVerifySerializer(serializers.Serializer):
    action = serializers.ChoiceField(choices=['verified', 'rejected'])
    remark = serializers.CharField(required=False, default='')
