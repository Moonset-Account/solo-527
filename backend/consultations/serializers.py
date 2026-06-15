from rest_framework import serializers
from .models import ConsultationRecord, ConsultationAttachment, TreatmentItem, ConsultationTreatmentItem


class TreatmentItemSerializer(serializers.ModelSerializer):
    category_display = serializers.CharField(source='get_category_display', read_only=True)

    class Meta:
        model = TreatmentItem
        fields = [
            'id', 'name', 'category', 'category_display', 'price',
            'description', 'duration_minutes', 'is_active', 'created_at', 'updated_at'
        ]


class ConsultationTreatmentItemSerializer(serializers.ModelSerializer):
    treatment_item_name = serializers.CharField(source='treatment_item.name', read_only=True)
    category = serializers.CharField(source='treatment_item.category', read_only=True)

    class Meta:
        model = ConsultationTreatmentItem
        fields = [
            'id', 'consultation', 'treatment_item', 'treatment_item_name', 'category',
            'quantity', 'unit_price', 'discount', 'subtotal', 'notes', 'created_at'
        ]
        read_only_fields = ['created_at']


class ConsultationAttachmentSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.CharField(source='uploaded_by.full_name', read_only=True)

    class Meta:
        model = ConsultationAttachment
        fields = [
            'id', 'consultation', 'file', 'file_name', 'file_type',
            'description', 'uploaded_by', 'uploaded_by_name', 'created_at'
        ]
        read_only_fields = ['created_at']


class ConsultationRecordSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    lead_id = serializers.IntegerField(source='lead.id', read_only=True, allow_null=True)
    consultation_type_display = serializers.CharField(source='get_consultation_type_display', read_only=True)
    intention_level_display = serializers.CharField(source='get_intention_level_display', read_only=True)
    consultation_doctor_name = serializers.CharField(source='consultation_doctor.full_name', read_only=True)
    consultant_name = serializers.CharField(source='consultant.full_name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.full_name', read_only=True)
    treatment_items = ConsultationTreatmentItemSerializer(many=True, read_only=True)
    attachments = ConsultationAttachmentSerializer(many=True, read_only=True)
    total_amount = serializers.SerializerMethodField()

    class Meta:
        model = ConsultationRecord
        fields = [
            'id', 'lead', 'lead_id', 'customer', 'customer_name',
            'consultation_type', 'consultation_type_display',
            'intention_level', 'intention_level_display',
            'chief_complaint', 'dental_history', 'oral_examination',
            'diagnosis', 'treatment_plan', 'estimated_price',
            'patient_concerns', 'next_action', 'next_consultation_at',
            'consultation_doctor', 'consultation_doctor_name',
            'consultant', 'consultant_name',
            'duration_minutes', 'notes',
            'treatment_items', 'attachments', 'total_amount',
            'created_by', 'created_by_name', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

    def get_total_amount(self, obj):
        return sum(item.subtotal for item in obj.treatment_items.all())

    def create(self, validated_data):
        consultation = ConsultationRecord(**validated_data)
        consultation.created_by = self.context['request'].user
        consultation.save()
        return consultation


class ConsultationRecordListSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    consultation_type_display = serializers.CharField(source='get_consultation_type_display', read_only=True)
    intention_level_display = serializers.CharField(source='get_intention_level_display', read_only=True)
    consultation_doctor_name = serializers.CharField(source='consultation_doctor.full_name', read_only=True)

    class Meta:
        model = ConsultationRecord
        fields = [
            'id', 'customer', 'customer_name', 'consultation_type',
            'consultation_type_display', 'intention_level', 'intention_level_display',
            'chief_complaint', 'estimated_price', 'consultation_doctor',
            'consultation_doctor_name', 'created_at'
        ]
