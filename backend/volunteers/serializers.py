from rest_framework import serializers
from .models import Volunteer, VolunteerRoute, VolunteerAssignment
from common.serializers import ProductionDataSerializerMixin
from users.serializers import UserSerializer


class VolunteerSerializer(ProductionDataSerializerMixin, serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    user_id = serializers.IntegerField(write_only=True, required=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    full_name = serializers.CharField(source='user.get_full_name', read_only=True)
    name = serializers.CharField(source='user.get_full_name', read_only=True)
    phone = serializers.CharField(source='user.phone', read_only=True)
    community = serializers.CharField(source='user.community', read_only=True)
    is_active = serializers.SerializerMethodField()
    skills_list = serializers.SerializerMethodField()

    class Meta:
        model = Volunteer
        fields = '__all__'
        read_only_fields = [
            'created_by', 'updated_by', 'total_service_hours',
            'service_count', 'rating'
        ]

    def get_is_active(self, obj):
        return obj.status == 'active'

    def get_skills_list(self, obj):
        if obj.skills:
            return [s.strip() for s in obj.skills.split(',') if s.strip()]
        return []


class VolunteerRouteSerializer(ProductionDataSerializerMixin, serializers.ModelSerializer):
    area = serializers.CharField(source='community', read_only=True)
    waypoints_list = serializers.SerializerMethodField()

    class Meta:
        model = VolunteerRoute
        fields = '__all__'
        read_only_fields = ['created_by', 'updated_by']

    def get_waypoints_list(self, obj):
        if obj.waypoints:
            import json
            try:
                return json.loads(obj.waypoints)
            except (json.JSONDecodeError, TypeError):
                return [obj.waypoints]
        return []


class VolunteerAssignmentSerializer(ProductionDataSerializerMixin, serializers.ModelSerializer):
    volunteer = VolunteerSerializer(read_only=True)
    volunteer_id = serializers.IntegerField(write_only=True, required=True)
    route = VolunteerRouteSerializer(read_only=True)
    route_id = serializers.IntegerField(write_only=True, required=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    volunteer_name = serializers.CharField(source='volunteer.user.get_full_name', read_only=True)
    route_name = serializers.CharField(source='route.name', read_only=True)
    date = serializers.DateField(source='scheduled_date', read_only=True)
    time_slot = serializers.SerializerMethodField()

    class Meta:
        model = VolunteerAssignment
        fields = '__all__'
        read_only_fields = [
            'created_by', 'updated_by', 'actual_start_time',
            'actual_end_time', 'actual_duration'
        ]

    def get_time_slot(self, obj):
        if obj.scheduled_start_time and obj.scheduled_end_time:
            return f'{obj.scheduled_start_time.strftime("%H:%M")}-{obj.scheduled_end_time.strftime("%H:%M")}'
        return ''


class VolunteerAssignmentCompleteSerializer(serializers.Serializer):
    duration = serializers.DecimalField(max_digits=5, decimal_places=2, required=True)
    issues = serializers.CharField(required=False, allow_blank=True)
    feedback = serializers.CharField(required=False, allow_blank=True)
    rating = serializers.IntegerField(required=False, min_value=1, max_value=5)
