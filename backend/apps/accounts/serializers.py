from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import Organization, User


class OrganizationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Organization
        fields = ['id', 'name', 'code', 'description', 'is_active', 'created_at']
        read_only_fields = ['created_at']


class UserSerializer(serializers.ModelSerializer):
    organization_name = serializers.CharField(source='organization.name', read_only=True)
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    created_at = serializers.DateTimeField(format='%Y-%m-%d %H:%M:%S', read_only=True)
    real_name = serializers.CharField(source='name', read_only=True)

    class Meta:
        model = User
        fields = [
            'id', 'username', 'name', 'real_name', 'email', 'phone', 'organization',
            'organization_name', 'role', 'role_display', 'is_admin', 'is_active',
            'date_joined', 'last_login', 'created_at'
        ]
        read_only_fields = ['created_at', 'date_joined', 'last_login']


class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    real_name = serializers.CharField(source='name', required=False)

    class Meta:
        model = User
        fields = ['username', 'name', 'real_name', 'email', 'phone', 'organization', 'role', 'is_admin', 'password']

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class UserUpdateSerializer(serializers.ModelSerializer):
    real_name = serializers.CharField(source='name', required=False)

    class Meta:
        model = User
        fields = ['name', 'real_name', 'email', 'phone', 'organization', 'role', 'is_admin', 'is_active']


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        user = authenticate(**attrs)
        if not user:
            raise serializers.ValidationError('用户名或密码错误')
        if not user.is_active:
            raise serializers.ValidationError('账号已被禁用')
        attrs['user'] = user
        return attrs


class PasswordChangeSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True)

    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError('原密码错误')
        return value
