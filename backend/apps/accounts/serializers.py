from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Family, Child, MemberLevelConfig, PointHistory, MemberLevel

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'role_display', 'phone', 'avatar', 'is_active', 'points']
        read_only_fields = ['id', 'points']


class PointHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = PointHistory
        fields = ['id', 'points', 'balance_after', 'description', 'created_at']
        read_only_fields = ['id', 'created_at']


class MemberLevelConfigSerializer(serializers.ModelSerializer):
    level_display = serializers.CharField(source='get_level_display', read_only=True)
    
    class Meta:
        model = MemberLevelConfig
        fields = ['id', 'level', 'level_display', 'max_borrow_count', 'max_borrow_days', 
                  'max_renew_count', 'discount_rate', 'points_per_yuan', 
                  'require_deposit', 'deposit_amount']
        read_only_fields = ['id']


class ChildSerializer(serializers.ModelSerializer):
    age = serializers.IntegerField(read_only=True)
    gender_display = serializers.CharField(source='get_gender_display', read_only=True)
    
    class Meta:
        model = Child
        fields = ['id', 'name', 'gender', 'gender_display', 'birth_date', 'age', 'avatar', 'family_id']
        read_only_fields = ['id', 'age']


class FamilySerializer(serializers.ModelSerializer):
    children = ChildSerializer(many=True, read_only=True)
    primary_contact_name = serializers.CharField(source='primary_contact.username', read_only=True)
    member_level_display = serializers.CharField(source='get_member_level_display', read_only=True)
    is_level_active = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = Family
        fields = ['id', 'name', 'address', 'primary_contact', 'primary_contact_name', 
                  'members', 'children', 'member_level', 'member_level_display', 
                  'level_expire_at', 'is_level_active', 'total_borrow_count', 'no_show_count']
        read_only_fields = ['id', 'total_borrow_count', 'no_show_count']


class FamilyDetailSerializer(FamilySerializer):
    members = UserSerializer(many=True, read_only=True)
    level_config = MemberLevelConfigSerializer(read_only=True)
