from rest_framework import serializers
from .models import User, RoleConfig, RoleConfigHistory
from django.contrib.auth import get_user_model

UserModel = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    role_display = serializers.CharField(source='get_role_display', read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'real_name', 'role', 'role_display', 'phone', 'student_id',
                  'dorm_building', 'dorm_room', 'is_verified', 'avatar', 'email', 'date_joined']
        read_only_fields = ['date_joined', 'is_verified']


class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ['username', 'password', 'real_name', 'role', 'phone', 'student_id',
                  'dorm_building', 'dorm_room', 'email']

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = UserModel(**validated_data)
        user.set_password(password)
        user.save()
        return user


class UserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['real_name', 'phone', 'dorm_building', 'dorm_room', 'email', 'avatar']


class PasswordChangeSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True)

    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError('原密码错误')
        return value


class UserVerifySerializer(serializers.Serializer):
    is_verified = serializers.BooleanField(required=True)
    remark = serializers.CharField(required=False, allow_blank=True)


class RoleConfigSerializer(serializers.ModelSerializer):
    role_display = serializers.CharField(source='get_role_display', read_only=True)

    class Meta:
        model = RoleConfig
        fields = ['id', 'role', 'role_display', 'description', 'permissions', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


class RoleConfigHistorySerializer(serializers.ModelSerializer):
    changed_by_name = serializers.CharField(source='changed_by.real_name', read_only=True, default=None)
    role_display = serializers.CharField(source='role_config.get_role_display', read_only=True)

    class Meta:
        model = RoleConfigHistory
        fields = ['id', 'role_config', 'role_display', 'changed_by', 'changed_by_name',
                  'old_data', 'new_data', 'change_reason', 'changed_at']
        read_only_fields = ['changed_at']
