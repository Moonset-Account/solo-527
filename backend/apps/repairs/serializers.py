from rest_framework import serializers
from django.utils import timezone
from .models import RepairRequest, RepairPhoto, RepairProgress, RepairComment
from apps.users.serializers import UserSerializer


class RepairPhotoSerializer(serializers.ModelSerializer):
    class Meta:
        model = RepairPhoto
        fields = ['id', 'repair_request', 'image', 'uploaded_at']
        read_only_fields = ['uploaded_at']


class RepairProgressSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    operator_info = UserSerializer(source='operator', read_only=True)

    class Meta:
        model = RepairProgress
        fields = ['id', 'repair_request', 'status', 'status_display', 'remark', 'operator', 'operator_info', 'created_at']
        read_only_fields = ['created_at']


class RepairCommentSerializer(serializers.ModelSerializer):
    user_info = UserSerializer(source='user', read_only=True)

    class Meta:
        model = RepairComment
        fields = ['id', 'repair_request', 'user', 'user_info', 'content', 'rating', 'created_at']
        read_only_fields = ['created_at']


class RepairRequestSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    repair_type_display = serializers.CharField(source='get_repair_type_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    applicant_info = UserSerializer(source='applicant', read_only=True)
    assignee_info = UserSerializer(source='assignee', read_only=True)
    photos = RepairPhotoSerializer(many=True, read_only=True)
    progresses = RepairProgressSerializer(many=True, read_only=True)
    comments = RepairCommentSerializer(many=True, read_only=True)
    processing_time_hours = serializers.SerializerMethodField()
    last_progress = serializers.SerializerMethodField()

    class Meta:
        model = RepairRequest
        fields = ['id', 'title', 'description', 'repair_type', 'repair_type_display',
                  'priority', 'priority_display', 'status', 'status_display',
                  'dorm_building', 'dorm_room', 'contact_name', 'contact_phone',
                  'applicant', 'applicant_info', 'assignee', 'assignee_info',
                  'created_at', 'updated_at', 'completed_at', 'expected_date',
                  'photos', 'progresses', 'comments', 'processing_time_hours', 'last_progress']
        read_only_fields = ['created_at', 'updated_at', 'completed_at']

    def get_processing_time_hours(self, obj):
        if obj.completed_at:
            return round((obj.completed_at - obj.created_at).total_seconds() / 3600, 2)
        return None

    def get_last_progress(self, obj):
        last = obj.progresses.first()
        if last:
            return RepairProgressSerializer(last).data
        return None


class RepairRequestCreateSerializer(serializers.ModelSerializer):
    photos = serializers.ListField(
        child=serializers.ImageField(), required=False, write_only=True
    )

    class Meta:
        model = RepairRequest
        fields = ['title', 'description', 'repair_type', 'priority', 'dorm_building',
                  'dorm_room', 'contact_name', 'contact_phone', 'expected_date', 'photos']

    def create(self, validated_data):
        photos = validated_data.pop('photos', [])
        applicant = self.context['request'].user
        validated_data['applicant'] = applicant
        if not validated_data.get('dorm_building'):
            validated_data['dorm_building'] = applicant.dorm_building
        if not validated_data.get('dorm_room'):
            validated_data['dorm_room'] = applicant.dorm_room
        if not validated_data.get('contact_name'):
            validated_data['contact_name'] = applicant.real_name or applicant.username
        if not validated_data.get('contact_phone'):
            validated_data['contact_phone'] = applicant.phone

        repair = super().create(validated_data)

        RepairProgress.objects.create(
            repair_request=repair,
            status=repair.status,
            remark='报修申请已提交',
            operator=applicant
        )

        for photo in photos:
            RepairPhoto.objects.create(repair_request=repair, image=photo)

        return repair


class RepairAssignSerializer(serializers.Serializer):
    assignee_id = serializers.IntegerField(required=True)
    remark = serializers.CharField(required=False, allow_blank=True)


class RepairStatusUpdateSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=RepairRequest.StatusChoices())
    remark = serializers.CharField(required=False, allow_blank=True)
