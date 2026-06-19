from rest_framework import serializers
from .models import Volunteer, VolunteerRoute, VolunteerAssignment
from common.serializers import ProductionDataSerializerMixin
from users.serializers import UserSerializer


class VolunteerSerializer(ProductionDataSerializerMixin, serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    user_id = serializers.IntegerField(write_only=True, required=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    full_name = serializers.CharField(source='user.get_full_name', read_only=True)
    phone = serializers.CharField(source='user.phone', read_only=True)
    community = serializers.CharField(source='user.community', read_only=True)

    class Meta:
        model = Volunteer
        fields = '__all__'
        read_only_fields = [
            'created_by', 'updated_by', 'total_service_hours',
            'service_count', 'rating'
        ]


class VolunteerRouteSerializer(ProductionDataSerializerMixin, serializers.ModelSerializer):
    class Meta:
        model = VolunteerRoute
        fields = '__all__'
        read_only_fields = ['created_by', 'updated_by']


class VolunteerAssignmentSerializer(ProductionDataSerializerMixin, serializers.ModelSerializer):
    volunteer = VolunteerSerializer(read_only=True)
    volunteer_id = serializers.IntegerField(write_only=True, required=True)
    route = VolunteerRouteSerializer(read_only=True)
    route_id = serializers.IntegerField(write_only=True, required=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    volunteer_name = serializers.CharField(source='volunteer.user.get_full_name', read_only=True)
    route_name = serializers.CharField(source='route.name', read_only=True)

    class Meta:
        model = VolunteerAssignment
        fields = '__all__'
        read_only_fields = [
            'created_by', 'updated_by', 'actual_start_time',
            'actual_end_time', 'actual_duration'
        ]


class VolunteerAssignmentCompleteSerializer(serializers.Serializer):
    duration = serializers.DecimalField(max_digits=5, decimal_places=2, required=True)
    issues = serializers.CharField(required=False, allow_blank=True)
    feedback = serializers.CharField(required=False, allow_blank=True)
    rating = serializers.IntegerField(required=False, min_value=1, max_value=5)
