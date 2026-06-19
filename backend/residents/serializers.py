from rest_framework import serializers
from .models import Resident, HouseholdMember, ResidentProcessRecord
from common.serializers import ProductionDataSerializerMixin
from users.serializers import UserSerializer


class HouseholdMemberSerializer(ProductionDataSerializerMixin, serializers.ModelSerializer):
    class Meta:
        model = HouseholdMember
        fields = '__all__'
        read_only_fields = ['created_by', 'updated_by']


class ResidentProcessRecordSerializer(serializers.ModelSerializer):
    processed_by_name = serializers.CharField(source='processed_by.get_full_name', read_only=True)

    class Meta:
        model = ResidentProcessRecord
        fields = '__all__'
        read_only_fields = ['processed_by', 'processed_at']


class ResidentSerializer(ProductionDataSerializerMixin, serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    user_id = serializers.IntegerField(write_only=True)
    household_members = HouseholdMemberSerializer(many=True, read_only=True)
    process_records = ResidentProcessRecordSerializer(many=True, read_only=True)
    full_name = serializers.CharField(source='user.get_full_name', read_only=True)
    phone = serializers.CharField(source='user.phone', read_only=True)
    community = serializers.CharField(source='user.community', read_only=True)
    building = serializers.CharField(source='user.building', read_only=True)
    unit = serializers.CharField(source='user.unit', read_only=True)
    room_number = serializers.CharField(source='user.room_number', read_only=True)

    class Meta:
        model = Resident
        fields = '__all__'
        read_only_fields = ['created_by', 'updated_by']


class ResidentDetailSerializer(ResidentSerializer):
    class Meta(ResidentSerializer.Meta):
        depth = 1


class ResidentProcessCreateSerializer(serializers.Serializer):
    content = serializers.CharField(required=True)
    remark = serializers.CharField(required=False, allow_blank=True)
