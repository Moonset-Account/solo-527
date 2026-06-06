from rest_framework import serializers
from .models import ChildClass, Child, ParentChildRelation, AuthorizedPickupPerson
from apps.accounts.serializers import UserSerializer


class ChildClassSerializer(serializers.ModelSerializer):
    student_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = ChildClass
        fields = ['id', 'name', 'capacity', 'description', 'student_count']


class ChildListSerializer(serializers.ModelSerializer):
    class_name = serializers.CharField(source='child_class.name', read_only=True)
    age = serializers.IntegerField(read_only=True)
    gender_display = serializers.CharField(source='get_gender_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Child
        fields = ['id', 'name', 'gender', 'gender_display', 'birth_date', 'age', 'avatar',
                  'child_class', 'class_name', 'enrollment_date', 'status', 'status_display']


class ChildSerializer(ChildListSerializer):
    class Meta(ChildListSerializer.Meta):
        fields = ChildListSerializer.Meta.fields + [
            'id_card', 'allergies', 'medical_notes', 'emergency_contact', 'emergency_phone'
        ]


class ParentChildRelationSerializer(serializers.ModelSerializer):
    parent = UserSerializer(read_only=True)
    parent_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = ParentChildRelation
        fields = ['id', 'parent', 'parent_id', 'relation', 'is_primary']


class AuthorizedPickupPersonSerializer(serializers.ModelSerializer):
    child_name = serializers.CharField(source='child.name', read_only=True)
    is_active_display = serializers.CharField(source='get_is_active_display', read_only=True)

    class Meta:
        model = AuthorizedPickupPerson
        fields = ['id', 'child', 'child_name', 'name', 'phone', 'id_card', 'relation',
                  'photo', 'is_active', 'is_active_display', 'expires_at']
