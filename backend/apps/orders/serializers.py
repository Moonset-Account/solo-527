from rest_framework import serializers

from apps.orders.models import Order, OrderTimeline, Payment
from apps.orders.services import OrderService


class OrderTimelineSerializer(serializers.ModelSerializer):
    operator_name = serializers.CharField(source='operator.real_name', read_only=True)

    class Meta:
        model = OrderTimeline
        fields = ['id', 'action', 'description', 'operator', 'operator_name', 'created_at']


class PaymentSerializer(serializers.ModelSerializer):
    method_display = serializers.CharField(source='get_method_display', read_only=True)
    operator_name = serializers.CharField(source='operator.real_name', read_only=True)

    class Meta:
        model = Payment
        fields = [
            'id', 'order', 'amount', 'method', 'method_display',
            'transaction_no', 'remarks', 'operator', 'operator_name', 'paid_at'
        ]


class OrderSerializer(serializers.ModelSerializer):
    room_name = serializers.CharField(source='room.name', read_only=True)
    property_name = serializers.CharField(source='room.property.name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    conversion_stage_display = serializers.CharField(source='get_conversion_stage_display', read_only=True)
    source_display = serializers.CharField(source='get_source_display', read_only=True)
    handled_by_name = serializers.CharField(source='handled_by.real_name', read_only=True)
    is_paid = serializers.BooleanField(read_only=True)
    remaining_amount = serializers.DecimalField(
        max_digits=10, decimal_places=2, read_only=True
    )
    timeline = OrderTimelineSerializer(many=True, read_only=True)
    payments = PaymentSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = [
            'id', 'order_no', 'room', 'room_name', 'property_name',
            'check_in_date', 'check_out_date', 'nights', 'adults', 'children',
            'guest_name', 'guest_phone', 'guest_email', 'guest_remarks',
            'base_amount', 'extra_amount', 'discount_amount', 'total_amount',
            'paid_amount', 'remaining_amount', 'is_paid',
            'status', 'status_display', 'conversion_stage', 'conversion_stage_display',
            'source', 'source_display', 'internal_remarks',
            'handled_by', 'handled_by_name',
            'checked_in_at', 'checked_out_at', 'cancelled_at', 'cancelled_reason',
            'timeline', 'payments', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'order_no', 'is_paid', 'remaining_amount',
            'checked_in_at', 'checked_out_at', 'cancelled_at',
            'created_at', 'updated_at', 'timeline', 'payments'
        ]

    def create(self, validated_data):
        return OrderService.create_order(validated_data, self.context['request'].user)


class OrderCreateSerializer(serializers.Serializer):
    room_id = serializers.UUIDField()
    check_in_date = serializers.DateField()
    check_out_date = serializers.DateField()
    adults = serializers.IntegerField(min_value=1, default=2)
    children = serializers.IntegerField(min_value=0, default=0)
    guest_name = serializers.CharField(max_length=100)
    guest_phone = serializers.CharField(max_length=20)
    guest_email = serializers.EmailField(required=False, allow_blank=True)
    guest_remarks = serializers.CharField(required=False, allow_blank=True)

    def validate(self, attrs):
        if attrs['check_in_date'] >= attrs['check_out_date']:
            raise serializers.ValidationError('入住日期必须早于退房日期')

        from apps.inventory.services import InventoryService
        availability = InventoryService.check_availability(
            attrs['room_id'],
            attrs['check_in_date'],
            attrs['check_out_date']
        )

        if not availability['available']:
            raise serializers.ValidationError(availability['reason'])

        return attrs


class OrderStatusUpdateSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=Order.STATUS_CHOICES)
    remarks = serializers.CharField(required=False, allow_blank=True)


class ConversionStageUpdateSerializer(serializers.Serializer):
    stage = serializers.ChoiceField(choices=Order.CONVERSION_STAGE_CHOICES)
    remarks = serializers.CharField(required=False, allow_blank=True)


class ConversionFunnelSerializer(serializers.Serializer):
    stage = serializers.CharField()
    stage_display = serializers.CharField()
    count = serializers.IntegerField()
    amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    conversion_rate = serializers.FloatField()
