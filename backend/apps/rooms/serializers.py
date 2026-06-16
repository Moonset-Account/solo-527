from rest_framework import serializers
from django.utils import timezone
from .models import StudyRoom, Seat, SeatReservation, CheckInRecord
from apps.users.serializers import UserSerializer


class SeatSerializer(serializers.ModelSerializer):
    is_occupied_today = serializers.SerializerMethodField()

    class Meta:
        model = Seat
        fields = ['id', 'study_room', 'seat_number', 'row', 'col',
                  'has_power', 'has_window', 'is_active', 'is_occupied_today']

    def get_is_occupied_today(self, obj):
        return obj.is_occupied(timezone.now().date())


class StudyRoomSerializer(serializers.ModelSerializer):
    seats = SeatSerializer(many=True, read_only=True)
    available_seats = serializers.SerializerMethodField()

    class Meta:
        model = StudyRoom
        fields = ['id', 'name', 'building', 'floor', 'total_seats', 'is_active',
                  'open_time', 'close_time', 'description', 'created_at', 'seats', 'available_seats']
        read_only_fields = ['created_at']

    def get_available_seats(self, obj):
        today = timezone.now().date()
        reserved_ids = SeatReservation.objects.filter(
            seat__study_room=obj, date=today, status__in=['reserved', 'checked_in']
        ).values_list('seat_id', flat=True)
        return obj.seats.filter(is_active=True).exclude(id__in=reserved_ids).count()


class SeatReservationSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    user_info = UserSerializer(source='user', read_only=True)
    seat_info = SeatSerializer(source='seat', read_only=True)

    class Meta:
        model = SeatReservation
        fields = ['id', 'user', 'user_info', 'seat', 'seat_info', 'date',
                  'start_time', 'end_time', 'status', 'status_display',
                  'reserved_at', 'checked_in_at', 'cancelled_at']
        read_only_fields = ['reserved_at', 'checked_in_at', 'cancelled_at']


class SeatReservationCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = SeatReservation
        fields = ['seat', 'date', 'start_time', 'end_time']

    def validate(self, attrs):
        seat = attrs['seat']
        date = attrs['date']
        start_time = attrs['start_time']
        end_time = attrs['end_time']
        if end_time <= start_time:
            raise serializers.ValidationError('结束时间必须晚于开始时间')
        if SeatReservation.objects.filter(
            seat=seat, date=date, status__in=['reserved', 'checked_in']
        ).filter(
            start_time__lt=end_time, end_time__gt=start_time
        ).exists():
            raise serializers.ValidationError('该时间段座位已被预约')
        return attrs


class CheckInRecordSerializer(serializers.ModelSerializer):
    checkin_type_display = serializers.CharField(source='get_checkin_type_display', read_only=True)
    user_info = UserSerializer(source='user', read_only=True)

    class Meta:
        model = CheckInRecord
        fields = ['id', 'user', 'user_info', 'checkin_type', 'checkin_type_display',
                  'reservation', 'location', 'remark', 'created_at']
        read_only_fields = ['created_at']


class CheckInCreateSerializer(serializers.Serializer):
    reservation_id = serializers.IntegerField(required=False)
    checkin_type = serializers.ChoiceField(choices=CheckInRecord.TYPE_CHOICES, default='seat')
    location = serializers.CharField(required=False, allow_blank=True)
    remark = serializers.CharField(required=False, allow_blank=True)
