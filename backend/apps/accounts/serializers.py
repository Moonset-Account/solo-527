from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import StaffProfile, MemberProfile, Vehicle

User = get_user_model()


class StaffProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = StaffProfile
        fields = ['id', 'employee_id', 'department', 'position', 'hire_date']


class MemberProfileSerializer(serializers.ModelSerializer):
    referrer_username = serializers.CharField(source='referrer.user.username', read_only=True)

    class Meta:
        model = MemberProfile
        fields = [
            'id', 'gender', 'birthday', 'address', 'total_consumption',
            'total_points', 'current_points', 'level', 'referrer', 'referrer_username'
        ]


class VehicleSerializer(serializers.ModelSerializer):
    member_username = serializers.CharField(source='member.username', read_only=True)

    class Meta:
        model = Vehicle
        fields = [
            'id', 'member', 'member_username', 'plate_number', 'brand',
            'model', 'color', 'vin', 'is_default', 'created_at'
        ]
        read_only_fields = ['created_at']


class UserSerializer(serializers.ModelSerializer):
    staff_profile = StaffProfileSerializer(required=False, allow_null=True)
    member_profile = MemberProfileSerializer(required=False, allow_null=True)
    vehicles = VehicleSerializer(many=True, read_only=True)

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'phone', 'role', 'avatar',
            'is_demo', 'created_at', 'updated_at', 'staff_profile',
            'member_profile', 'vehicles'
        ]
        read_only_fields = ['created_at', 'updated_at']
        extra_kwargs = {
            'password': {'write_only': True, 'required': False},
            'is_demo': {'read_only': True}
        }

    def create(self, validated_data):
        staff_data = validated_data.pop('staff_profile', None)
        member_data = validated_data.pop('member_profile', None)
        password = validated_data.pop('password', None)

        user = User.objects.create(**validated_data)
        if password:
            user.set_password(password)
            user.save()

        if staff_data and user.role in ['admin', 'manager', 'cashier', 'staff']:
            StaffProfile.objects.create(user=user, **staff_data)

        if member_data and user.role == 'member':
            MemberProfile.objects.create(user=user, **member_data)

        return user

    def update(self, instance, validated_data):
        staff_data = validated_data.pop('staff_profile', None)
        member_data = validated_data.pop('member_profile', None)
        password = validated_data.pop('password', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if password:
            instance.set_password(password)
        instance.save()

        if staff_data is not None and instance.role in ['admin', 'manager', 'cashier', 'staff']:
            staff_profile, created = StaffProfile.objects.get_or_create(user=instance)
            for attr, value in staff_data.items():
                setattr(staff_profile, attr, value)
            staff_profile.save()

        if member_data is not None and instance.role == 'member':
            member_profile, created = MemberProfile.objects.get_or_create(user=instance)
            for attr, value in member_data.items():
                setattr(member_profile, attr, value)
            member_profile.save()

        return instance


class UserListSerializer(serializers.ModelSerializer):
    role_display = serializers.CharField(source='get_role_display', read_only=True)

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'phone', 'role', 'role_display',
            'avatar', 'is_demo', 'created_at'
        ]


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField(required=True)
    password = serializers.CharField(required=True, write_only=True)

    def validate(self, attrs):
        from django.contrib.auth import authenticate
        user = authenticate(username=attrs['username'], password=attrs['password'])
        if not user:
            raise serializers.ValidationError('用户名或密码错误')
        if not user.is_active:
            raise serializers.ValidationError('用户已被禁用')
        attrs['user'] = user
        return attrs
