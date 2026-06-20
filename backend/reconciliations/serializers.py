from rest_framework import serializers
from .models import Reconciliation, Difference


class DifferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Difference
        fields = '__all__'


class ReconciliationSerializer(serializers.ModelSerializer):
    differences = DifferenceSerializer(many=True, read_only=True)
    uploaded_by = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Reconciliation
        fields = '__all__'


class ReconciliationUploadSerializer(serializers.Serializer):
    file = serializers.FileField()
    project_name = serializers.CharField(max_length=255)
    client_name = serializers.CharField(max_length=255)
