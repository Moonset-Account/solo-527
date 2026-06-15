from rest_framework import serializers
from .models import User, Role, Department


class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = ['id', 'name', 'display_name', 'description', 'created_at']


class DepartmentSerializer(serializers.ModelSerializer):
    manager_name = serializers.CharField(source='manager.full_name', read_only=True)

    class Meta:
        model = Department
        fields = ['id', 'name', 'description', 'manager', 'manager_name', 'created_at', 'updated_at']


class UserSerializer(serializers.ModelSerializer):
    role_name = serializers.CharField(source='role.display_name', read_only=True)
    department_name = serializers.CharField(source='department', read_only=True)

    class Meta:
        model = User
        fields = [
            'id', 'email', 'username', 'full_name', 'phone', 'avatar',
            'role', 'role_name', 'department', 'department_name', 'position',
            'is_active', 'is_staff', 'is_superuser', 'created_at', 'updated_at'
        ]
        read_only_fields = ['is_staff', 'is_superuser', 'created_at', 'updated_at']

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        if password:
            instance.set_password(password)
        return super().update(instance, validated_data)


class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['email', 'password', 'full_name', 'phone', 'role', 'department', 'position']

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user
