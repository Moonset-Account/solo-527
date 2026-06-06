from rest_framework import serializers
from .models import Activity, Registration

class ActivitySerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    is_almost_full = serializers.BooleanField(read_only=True)
    has_capacity = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = Activity
        fields = '__all__'
        read_only_fields = ['create_time', 'update_time', 'current_capacity', 'waitlist_count']

class RegistrationSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    activity_title = serializers.CharField(source='activity.title', read_only=True)
    activity_start_time = serializers.DateTimeField(source='activity.start_time', read_only=True)
    member_name = serializers.CharField(source='member.family_name', read_only=True)
    
    class Meta:
        model = Registration
        fields = '__all__'
        read_only_fields = ['create_time', 'update_time']
