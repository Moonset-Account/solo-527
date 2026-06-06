from rest_framework import serializers
from .models import DepositAccount, DepositTransaction

class DepositAccountSerializer(serializers.ModelSerializer):
    member_name = serializers.CharField(source='member.family_name', read_only=True)
    
    class Meta:
        model = DepositAccount
        fields = '__all__'
        read_only_fields = ['create_time', 'update_time', 'balance', 'is_abnormal']

class DepositTransactionSerializer(serializers.ModelSerializer):
    trans_type_display = serializers.CharField(source='get_trans_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    member_name = serializers.CharField(source='account.member.family_name', read_only=True)
    
    class Meta:
        model = DepositTransaction
        fields = '__all__'
        read_only_fields = ['create_time', 'confirm_time']
