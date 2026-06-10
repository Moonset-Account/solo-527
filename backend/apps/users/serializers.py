from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from apps.users.models import User


class UserSerializer(serializers.ModelSerializer):
    role_display = serializers.CharField(source='role_display', read_only=True)

    class Meta:
        model = User
        fields = ['id', 'email', 'role', 'role_display', 'phone', 'real_name', 'avatar']
        read_only_fields = ['id', 'email']


class LoginSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['email'] = user.email
        token['role'] = user.role
        token['real_name'] = user.real_name
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        data['user'] = UserSerializer(self.user).data
        return data


class UserProfileSerializer(serializers.ModelSerializer):
    role_display = serializers.CharField(source='role_display', read_only=True)
    permissions = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'email', 'role', 'role_display', 'phone', 'real_name', 'avatar', 'permissions']
        read_only_fields = ['id', 'email']

    def get_permissions(self, obj):
        role_permissions = {
            'super_admin': ['all'],
            'host': ['inventory:manage', 'orders:manage', 'configuration:manage', 'reminders:view'],
            'operator': ['inventory:edit', 'orders:manage', 'reminders:manage'],
            'receptionist': ['inventory:view', 'orders:view', 'reminders:manage'],
        }
        return role_permissions.get(obj.role, [])
