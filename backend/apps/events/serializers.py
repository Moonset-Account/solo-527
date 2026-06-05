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
    related_book_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False
    )
    
    class Meta:
        model = Event
        fields = [
            'id', 'title', 'event_type', 'event_type_id', 'description', 'cover_image',
            'start_time', 'end_time', 'location', 'host', 'speaker',
            'max_participants', 'min_participants', 'registered_count', 'checked_in_count',
            'fee', 'points_required', 'points_reward', 'status', 'status_display',
            'registration_deadline', 'cancellation_deadline', 'available_slots',
            'is_registration_open', 'related_books', 'related_book_ids', 'tags', 'remark', 'is_active'
        ]
        read_only_fields = ['registered_count', 'checked_in_count', 'available_slots', 'is_registration_open']
    
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
    
    class Meta:
        model = Event
        fields = [
            'id', 'title', 'event_type', 'cover_image', 'start_time', 'end_time',
            'location', 'fee', 'max_participants', 'registered_count',
            'available_slots', 'status', 'status_display'
        ]


class EventRegistrationSerializer(serializers.ModelSerializer):
    event = EventListSerializer(read_only=True)
    event_id = serializers.IntegerField(write_only=True)
    member = MemberBaseSerializer(read_only=True)
    member_id = serializers.IntegerField(write_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = EventRegistration
        fields = [
            'id', 'event', 'event_id', 'member', 'member_id', 'status', 'status_display',
            'registration_time', 'check_in_time', 'payment_status', 'amount_paid',
            'points_used', 'notes', 'qr_code'
        ]
        read_only_fields = ['registration_time', 'check_in_time', 'qr_code']


class EventTicketSerializer(serializers.ModelSerializer):
    registration = EventRegistrationSerializer(read_only=True)
    
    class Meta:
        model = EventTicket
        fields = ['id', 'ticket_no', 'registration', 'qr_code', 'issued_at', 'used_at']


class CheckInSerializer(serializers.Serializer):
    ticket_no = serializers.CharField(required=False)
    registration_id = serializers.IntegerField(required=False)
