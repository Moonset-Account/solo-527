from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import TeacherProfile, ParentProfile

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    role_display = serializers.CharField(source='get_role_display', read_only=True)

    class Meta:
        model = User
        fields = ['id', 'phone', 'name', 'role', 'role_display', 'avatar', 'is_active']
        read_only_fields = ['id']


class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ['phone', 'name', 'role', 'password', 'avatar']

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class TeacherProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    class_names = serializers.SerializerMethodField()

    class Meta:
        model = TeacherProfile
        fields = ['id', 'user', 'employee_id', 'classes', 'class_names', 'position']

    def get_class_names(self, obj):
        return [c.name for c in obj.classes.all()]


class ParentProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = ParentProfile
        fields = ['id', 'user', 'relation', 'id_card', 'address']


class LoginSerializer(serializers.Serializer):
    phone = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        from django.contrib.auth import authenticate
        user = authenticate(phone=attrs['phone'], password=attrs['password'])
        if not user:
            raise serializers.ValidationError('手机号或密码错误')
        if not user.is_active:
            raise serializers.ValidationError('账号已被禁用')
        attrs['user'] = user
        return attrs
