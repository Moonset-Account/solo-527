from rest_framework import serializers
from .models import Activity, ActivityRegistration, RegistrationStatus, ActivityStatus, ActivityWaitlistNotification
from apps.accounts.serializers import ChildSerializer, FamilySerializer, UserSerializer
from apps.books.serializers import BookSerializer, ThemeSerializer


class ActivityListSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    activity_type_display = serializers.CharField(source='get_activity_type_display', read_only=True)
    registered_count = serializers.IntegerField(read_only=True)
    waitlist_count = serializers.IntegerField(read_only=True)
    has_available_slots = serializers.BooleanField(read_only=True)
    themes = ThemeSerializer(many=True, read_only=True)
    
    class Meta:
        model = Activity
        fields = [
            'id', 'title', 'cover', 'activity_type', 'activity_type_display',
            'themes', 'age_min', 'age_max', 'max_participants', 'registered_count',
            'waitlist_count', 'has_available_slots', 'location', 'start_time',
            'end_time', 'registration_start', 'registration_end', 'status',
            'status_display', 'host', 'requires_deposit', 'deposit_amount'
        ]


class ActivityDetailSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    activity_type_display = serializers.CharField(source='get_activity_type_display', read_only=True)
    registered_count = serializers.IntegerField(read_only=True)
    waitlist_count = serializers.IntegerField(read_only=True)
    has_available_slots = serializers.BooleanField(read_only=True)
    themes = ThemeSerializer(many=True, read_only=True)
    related_books = BookSerializer(many=True, read_only=True)
    created_by_name = serializers.CharField(source='created_by.username', read_only=True)
    
    class Meta:
        model = Activity
        fields = '__all__'


class ActivityRegistrationSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    activity_title = serializers.CharField(source='activity.title', read_only=True)
    activity_cover = serializers.ImageField(source='activity.cover', read_only=True)
    activity_start_time = serializers.DateTimeField(source='activity.start_time', read_only=True)
    activity_location = serializers.CharField(source='activity.location', read_only=True)
    family_name = serializers.CharField(source='family.name', read_only=True)
    child_name = serializers.CharField(source='child.name', read_only=True)
    child_age = serializers.IntegerField(source='child.age', read_only=True)
    registered_by_name = serializers.CharField(source='registered_by.username', read_only=True)
    
    class Meta:
        model = ActivityRegistration
        fields = '__all__'
        read_only_fields = ['id', 'waitlist_position', 'registered_at']


class ActivityRegistrationCreateSerializer(serializers.Serializer):
    activity_id = serializers.IntegerField()
    child_id = serializers.IntegerField()


class ActivityWaitlistNotificationSerializer(serializers.ModelSerializer):
    notification_type_display = serializers.CharField(source='get_notification_type_display', read_only=True)
    
    class Meta:
        model = ActivityWaitlistNotification
        fields = '__all__'
