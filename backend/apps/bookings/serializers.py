from rest_framework import serializers
from django.utils import timezone
from .models import Booking, BookingReminder, TimeSlot
from apps.accounts.models import User, Vehicle
from apps.services.models import ServiceItem, TestDriveSlot


class TimeSlotSerializer(serializers.ModelSerializer):
    class Meta:
        model = TimeSlot
        fields = [
            'id', 'date', 'start_time', 'end_time', 'max_capacity',
            'current_bookings', 'is_available', 'is_demo', 'created_at'
        ]
        read_only_fields = ['created_at', 'current_bookings']


class BookingReminderSerializer(serializers.ModelSerializer):
    reminder_type_display = serializers.CharField(source='get_reminder_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    booking_order_no = serializers.CharField(source='booking.order_no', read_only=True)

    class Meta:
        model = BookingReminder
        fields = [
            'id', 'booking', 'booking_order_no', 'reminder_type', 'reminder_type_display',
            'scheduled_time', 'sent_time', 'status', 'status_display',
            'content', 'error_message', 'created_at'
        ]
        read_only_fields = ['created_at', 'sent_time', 'status']


class BookingSerializer(serializers.ModelSerializer):
    booking_type_display = serializers.CharField(source='get_booking_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    member_username = serializers.CharField(source='member.username', read_only=True)
    member_phone = serializers.CharField(source='member.phone', read_only=True)
    vehicle_plate = serializers.CharField(source='vehicle.plate_number', read_only=True, allow_null=True)
    service_item_name = serializers.CharField(source='service_item.name', read_only=True, allow_null=True)
    assigned_staff_username = serializers.CharField(source='assigned_staff.username', read_only=True, allow_null=True)
    test_drive_slot_info = serializers.SerializerMethodField(read_only=True)
    reminders = BookingReminderSerializer(many=True, read_only=True)

    member_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), source='member', write_only=True, required=False
    )
    vehicle_id = serializers.PrimaryKeyRelatedField(
        queryset=Vehicle.objects.all(), source='vehicle', write_only=True, required=False, allow_null=True
    )
    service_item_id = serializers.PrimaryKeyRelatedField(
        queryset=ServiceItem.objects.all(), source='service_item', write_only=True, required=False, allow_null=True
    )
    test_drive_slot_id = serializers.PrimaryKeyRelatedField(
        queryset=TestDriveSlot.objects.all(), source='test_drive_slot', write_only=True, required=False, allow_null=True
    )
    assigned_staff_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.filter(role__in=['staff', 'manager']), source='assigned_staff',
        write_only=True, required=False, allow_null=True
    )

    class Meta:
        model = Booking
        fields = [
            'id', 'booking_type', 'booking_type_display', 'order_no',
            'member', 'member_id', 'member_username', 'member_phone',
            'vehicle', 'vehicle_id', 'vehicle_plate',
            'service_item', 'service_item_id', 'service_item_name',
            'test_drive_slot', 'test_drive_slot_id', 'test_drive_slot_info',
            'booking_date', 'booking_time', 'contact_name', 'contact_phone',
            'status', 'status_display', 'source', 'notes',
            'assigned_staff', 'assigned_staff_id', 'assigned_staff_username',
            'reminder_sent', 'arrival_time', 'is_demo',
            'reminders', 'created_at', 'updated_at'
        ]
        read_only_fields = ['order_no', 'created_at', 'updated_at', 'reminder_sent', 'arrival_time']

    def get_test_drive_slot_info(self, obj):
        if obj.test_drive_slot:
            return {
                'id': obj.test_drive_slot.id,
                'date': obj.test_drive_slot.date,
                'start_time': obj.test_drive_slot.start_time,
                'end_time': obj.test_drive_slot.end_time,
                'vehicle_model': obj.test_drive_slot.vehicle_model,
                'location': obj.test_drive_slot.location
            }
        return None

    def generate_order_no(self):
        date_str = timezone.now().strftime('%Y%m%d')
        last_booking = Booking.objects.filter(
            order_no__startswith=f'BK{date_str}'
        ).order_by('-order_no').first()
        if last_booking:
            seq = int(last_booking.order_no[-4:]) + 1
        else:
            seq = 1
        return f'BK{date_str}{seq:04d}'

    def create(self, validated_data):
        validated_data['order_no'] = self.generate_order_no()
        booking = Booking.objects.create(**validated_data)
        return booking

    def validate(self, attrs):
        booking_type = attrs.get('booking_type')
        if booking_type == 'test_drive' and not attrs.get('test_drive_slot'):
            raise serializers.ValidationError('试驾预约必须选择试驾时段')
        if booking_type == 'service' and not attrs.get('service_item'):
            raise serializers.ValidationError('服务预约必须选择服务项目')
        return attrs
