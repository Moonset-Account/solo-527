from rest_framework import serializers

from apps.inventory.models import Inventory, InventoryConflict, SpecialPricing


class InventorySerializer(serializers.ModelSerializer):
    room_name = serializers.CharField(source='room.name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Inventory
        fields = [
            'id', 'room', 'room_name', 'date', 'status', 'status_display',
            'price', 'is_locked', 'locked_by', 'created_at', 'updated_at'
        ]


class InventoryCalendarSerializer(serializers.Serializer):
    date = serializers.DateField()
    status = serializers.CharField()
    status_display = serializers.CharField()
    price = serializers.DecimalField(max_digits=10, decimal_places=2)
    is_locked = serializers.BooleanField()
    room_id = serializers.UUIDField()


class InventoryBatchUpdateSerializer(serializers.Serializer):
    room_id = serializers.UUIDField()
    start_date = serializers.DateField()
    end_date = serializers.DateField()
    status = serializers.CharField(required=False)
    price = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)
    is_locked = serializers.BooleanField(required=False)

    def validate(self, attrs):
        if attrs['start_date'] > attrs['end_date']:
            raise serializers.ValidationError('开始日期不能晚于结束日期')
        if 'status' not in attrs and 'price' not in attrs and 'is_locked' not in attrs:
            raise serializers.ValidationError('至少需要指定一个更新字段')
        return attrs


class InventoryConflictSerializer(serializers.ModelSerializer):
    severity_display = serializers.CharField(source='get_severity_display', read_only=True)
    conflict_type_display = serializers.CharField(source='get_conflict_type_display', read_only=True)
    room_name = serializers.CharField(source='room.name', read_only=True)

    class Meta:
        model = InventoryConflict
        fields = [
            'id', 'inventory', 'room', 'room_name', 'date', 'conflict_type',
            'conflict_type_display', 'severity', 'severity_display',
            'description', 'related_order_id', 'is_resolved', 'resolved_at', 'created_at'
        ]


class SpecialPricingSerializer(serializers.ModelSerializer):
    room_name = serializers.CharField(source='room.name', read_only=True)

    class Meta:
        model = SpecialPricing
        fields = [
            'id', 'room', 'room_name', 'start_date', 'end_date', 'price',
            'reason', 'is_holiday', 'is_active', 'created_at', 'updated_at'
        ]

    def validate(self, attrs):
        if attrs['start_date'] > attrs['end_date']:
            raise serializers.ValidationError('开始日期不能晚于结束日期')
        return attrs
