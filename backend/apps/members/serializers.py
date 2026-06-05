from rest_framework import serializers
from .models import Member, MemberLevel, PointsRecord, ArrivalNotification
from apps.books.serializers import BookListSerializer


class MemberLevelSerializer(serializers.ModelSerializer):
    class Meta:
        model = MemberLevel
        fields = ['id', 'name', 'level', 'min_points', 'discount', 'points_multiplier', 'benefits', 'color', 'is_active']


class MemberBaseSerializer(serializers.ModelSerializer):
    level = MemberLevelSerializer(read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    gender_display = serializers.CharField(source='get_gender_display', read_only=True)
    
    class Meta:
        model = Member
        fields = [
            'id', 'member_no', 'name', 'gender', 'gender_display',
            'level', 'status', 'status_display', 'available_points',
            'total_points', 'register_date', 'expire_date'
        ]


class MemberSerializer(serializers.ModelSerializer):
    level = MemberLevelSerializer(read_only=True)
    level_id = serializers.IntegerField(write_only=True, allow_null=True, required=False)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    gender_display = serializers.CharField(source='get_gender_display', read_only=True)
    
    class Meta:
        model = Member
        fields = [
            'id', 'member_no', 'name', 'gender', 'gender_display', 'birthday',
            'phone', 'email', 'address', 'avatar', 'level', 'level_id',
            'total_points', 'available_points', 'status', 'status_display',
            'register_date', 'expire_date', 'remark', 'is_active'
        ]
        read_only_fields = ['member_no', 'total_points', 'available_points', 'register_date']
    
    def to_representation(self, instance):
        request = self.context.get('request')
        data = super().to_representation(instance)
        
        if request and not request.user.is_manager:
            sensitive_fields = ['phone', 'email', 'address', 'birthday', 'remark']
            for field in sensitive_fields:
                if field in data and data[field]:
                    if field == 'phone':
                        data[field] = data[field][:3] + '****' + data[field][-4:] if len(data[field]) > 7 else '****'
                    elif field == 'email' and '@' in data[field]:
                        name, domain = data[field].split('@', 1)
                        data[field] = name[:2] + '****@' + domain
                    else:
                        data[field] = '***'
        
        return data


class MemberCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Member
        fields = ['name', 'gender', 'birthday', 'phone', 'email', 'address', 'remark']
    
    def validate_phone(self, value):
        if Member.objects.filter(phone=value, is_active=True).exists():
            raise serializers.ValidationError('该手机号已注册')
        return value


class PointsRecordSerializer(serializers.ModelSerializer):
    type_display = serializers.CharField(source='get_type_display', read_only=True)
    
    class Meta:
        model = PointsRecord
        fields = ['id', 'type', 'type_display', 'points', 'balance_after', 'source', 'expire_date', 'remark', 'created_at']


class PointsAdjustSerializer(serializers.Serializer):
    points = serializers.IntegerField(required=True)
    type = serializers.ChoiceField(choices=[('earn', '增加'), ('consume', '扣除')], required=True)
    source = serializers.CharField(required=False, max_length=200)
    remark = serializers.CharField(required=False, allow_blank=True)


class ArrivalNotificationSerializer(serializers.ModelSerializer):
    book = BookListSerializer(read_only=True)
    book_id = serializers.IntegerField(write_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = ArrivalNotification
        fields = ['id', 'book', 'book_id', 'status', 'status_display', 'notified_at', 'notify_method', 'remark', 'created_at']
        read_only_fields = ['status', 'notified_at']


class MemberSearchSerializer(serializers.Serializer):
    keyword = serializers.CharField(required=True, max_length=100)
