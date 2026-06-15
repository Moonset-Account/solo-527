from rest_framework import serializers
from .models import ServiceCategory, ServiceItem, TestDriveSlot, ServiceRecord


class ServiceCategorySerializer(serializers.ModelSerializer):
    parent_name = serializers.CharField(source='parent.name', read_only=True)

    class Meta:
        model = ServiceCategory
        fields = [
            'id', 'name', 'description', 'parent', 'parent_name',
            'sort_order', 'is_active', 'is_demo', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class ServiceItemSerializer(serializers.ModelSerializer):
    service_type_display = serializers.CharField(source='get_service_type_display', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    category = ServiceCategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=ServiceCategory.objects.all(), source='category', write_only=True
    )

    class Meta:
        model = ServiceItem
        fields = [
            'id', 'name', 'description', 'short_description', 'category', 'category_id',
            'category_name', 'service_type', 'service_type_display', 'price', 'member_price',
            'duration_minutes', 'images', 'is_available', 'is_demo', 'sort_order',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class TestDriveSlotSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    service_item_name = serializers.CharField(source='service_item.name', read_only=True)
    service_item = ServiceItemSerializer(read_only=True)
    service_item_id = serializers.PrimaryKeyRelatedField(
        queryset=ServiceItem.objects.filter(service_type='test_drive'),
        source='service_item', write_only=True
    )

    class Meta:
        model = TestDriveSlot
        fields = [
            'id', 'service_item', 'service_item_id', 'service_item_name',
            'date', 'start_time', 'end_time', 'vehicle_model', 'location',
            'max_bookings', 'current_bookings', 'status', 'status_display',
            'is_demo', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'current_bookings']


class ServiceRecordSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    member_username = serializers.CharField(source='member.username', read_only=True)
    staff_username = serializers.CharField(source='staff.username', read_only=True, allow_null=True)
    vehicle_info = serializers.SerializerMethodField(read_only=True)
    service_item_name = serializers.CharField(source='service_item.name', read_only=True)
    service_item = ServiceItemSerializer(read_only=True)
    service_item_id = serializers.PrimaryKeyRelatedField(
        queryset=ServiceItem.objects.all(), source='service_item', write_only=True
    )

    class Meta:
        model = ServiceRecord
        fields = [
            'id', 'member', 'member_username', 'vehicle', 'vehicle_info',
            'service_item', 'service_item_id', 'service_item_name', 'booking',
            'status', 'status_display', 'staff', 'staff_username', 'start_time',
            'end_time', 'actual_duration', 'amount', 'discount_amount',
            'final_amount', 'remarks', 'check_items', 'is_demo',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

    def get_vehicle_info(self, obj):
        return {
            'id': obj.vehicle.id,
            'plate_number': obj.vehicle.plate_number,
            'brand': obj.vehicle.brand,
            'model': obj.vehicle.model,
            'color': obj.vehicle.color
        }
