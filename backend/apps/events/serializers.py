from rest_framework import serializers
from .models import Event, EventType, EventRegistration, EventTicket
from apps.members.serializers import MemberBaseSerializer
from apps.books.serializers import BookListSerializer


class EventTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = EventType
        fields = ['id', 'name', 'description', 'color', 'is_active']


class EventSerializer(serializers.ModelSerializer):
    event_type = EventTypeSerializer(read_only=True)
    event_type_id = serializers.IntegerField(write_only=True, allow_null=True, required=False)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    available_slots = serializers.IntegerField(read_only=True)
    is_registration_open = serializers.BooleanField(read_only=True)
    related_books = BookListSerializer(many=True, read_only=True)
    start_date = serializers.SerializerMethodField()
    start_time_only = serializers.SerializerMethodField()
    end_time_only = serializers.SerializerMethodField()
    current_participants = serializers.IntegerField(source='registered_count', read_only=True)
    related_book_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False
    )
    
    class Meta:
        model = Event
        fields = [
            'id', 'title', 'event_type', 'event_type_id', 'description', 'cover_image',
            'start_time', 'end_time', 'start_date', 'start_time_only', 'end_time_only',
            'location', 'host', 'speaker',
            'max_participants', 'min_participants', 'registered_count', 'checked_in_count', 'current_participants',
            'fee', 'points_required', 'points_reward', 'status', 'status_display',
            'registration_deadline', 'cancellation_deadline', 'available_slots',
            'is_registration_open', 'related_books', 'related_book_ids', 'tags', 'remark', 'is_active'
        ]
        read_only_fields = ['registered_count', 'checked_in_count', 'available_slots', 'is_registration_open']
    
    def get_start_date(self, obj):
        return obj.start_time.strftime('%Y-%m-%d') if obj.start_time else None
    
    def get_start_time_only(self, obj):
        return obj.start_time.strftime('%H:%M') if obj.start_time else None
    
    def get_end_time_only(self, obj):
        return obj.end_time.strftime('%H:%M') if obj.end_time else None
    
    def create(self, validated_data):
        related_book_ids = validated_data.pop('related_book_ids', [])
        event = Event.objects.create(**validated_data)
        if related_book_ids:
            event.related_books.set(related_book_ids)
        return event
    
    def update(self, instance, validated_data):
        related_book_ids = validated_data.pop('related_book_ids', None)
        instance = super().update(instance, validated_data)
        if related_book_ids is not None:
            instance.related_books.set(related_book_ids)
        return instance


class EventListSerializer(serializers.ModelSerializer):
    event_type = EventTypeSerializer(read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    available_slots = serializers.IntegerField(read_only=True)
    start_date = serializers.SerializerMethodField()
    start_time_only = serializers.SerializerMethodField()
    end_time_only = serializers.SerializerMethodField()
    current_participants = serializers.IntegerField(source='registered_count', read_only=True)
    
    class Meta:
        model = Event
        fields = [
            'id', 'title', 'event_type', 'cover_image', 'start_time', 'end_time',
            'start_date', 'start_time_only', 'end_time_only',
            'location', 'fee', 'max_participants', 'registered_count', 'current_participants',
            'available_slots', 'status', 'status_display'
        ]
    
    def get_start_date(self, obj):
        return obj.start_time.strftime('%Y-%m-%d') if obj.start_time else None
    
    def get_start_time_only(self, obj):
        return obj.start_time.strftime('%H:%M') if obj.start_time else None
    
    def get_end_time_only(self, obj):
        return obj.end_time.strftime('%H:%M') if obj.end_time else None


class EventRegistrationSerializer(serializers.ModelSerializer):
    event = EventListSerializer(read_only=True)
    event_id = serializers.IntegerField(write_only=True)
    member = MemberBaseSerializer(read_only=True)
    member_id = serializers.IntegerField(write_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    is_checked_in = serializers.SerializerMethodField()
    checked_in_at = serializers.DateTimeField(source='check_in_time', read_only=True)
    registered_at = serializers.DateTimeField(source='registration_time', read_only=True)
    
    class Meta:
        model = EventRegistration
        fields = [
            'id', 'event', 'event_id', 'member', 'member_id', 'status', 'status_display',
            'registration_time', 'registered_at', 'check_in_time', 'checked_in_at',
            'is_checked_in', 'payment_status', 'amount_paid',
            'points_used', 'notes', 'qr_code'
        ]
        read_only_fields = ['registration_time', 'check_in_time', 'qr_code']
    
    def get_is_checked_in(self, obj):
        return obj.status == EventRegistration.STATUS_CHECKED_IN


class EventTicketSerializer(serializers.ModelSerializer):
    registration = EventRegistrationSerializer(read_only=True)
    
    class Meta:
        model = EventTicket
        fields = ['id', 'ticket_no', 'registration', 'qr_code', 'issued_at', 'used_at']


class CheckInSerializer(serializers.Serializer):
    ticket_no = serializers.CharField(required=False)
    registration_id = serializers.IntegerField(required=False)
