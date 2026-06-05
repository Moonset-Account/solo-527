from rest_framework import serializers
from .models import FeeItem, Payment, LeaveRequest


class FeeItemSerializer(serializers.ModelSerializer):
    class_group_name = serializers.CharField(source='class_group.name', read_only=True, default='')

    class Meta:
        model = FeeItem
        fields = '__all__'
        read_only_fields = ['id', 'created_by', 'created_at']


class PaymentSerializer(serializers.ModelSerializer):
    child_name = serializers.CharField(source='child.name', read_only=True)
    fee_item_name = serializers.CharField(source='fee_item.name', read_only=True)

    class Meta:
        model = Payment
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class LeaveRequestSerializer(serializers.ModelSerializer):
    child_name = serializers.CharField(source='child.name', read_only=True)
    requester_name = serializers.CharField(source='requester.username', read_only=True)
    reviewed_by_name = serializers.CharField(source='reviewed_by.username', read_only=True, default='')

    class Meta:
        model = LeaveRequest
        fields = '__all__'
        read_only_fields = ['id', 'requester', 'status', 'reviewed_by', 'reviewed_at', 'created_at']


class LeaveRequestCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = LeaveRequest
        fields = ['child', 'start_date', 'end_date', 'reason']
        read_only_fields = []


class LeaveReviewSerializer(serializers.Serializer):
    action = serializers.ChoiceField(choices=['approved', 'rejected'])
    review_remark = serializers.CharField(required=False, default='')
