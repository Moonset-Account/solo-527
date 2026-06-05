from rest_framework import serializers
from .models import ClassGroup, Child, ParentChildRelation, AuthorizedPickupPerson


class ClassGroupSerializer(serializers.ModelSerializer):
    teacher_name = serializers.CharField(source='teacher.username', read_only=True, default='')
    children_count = serializers.SerializerMethodField()

    class Meta:
        model = ClassGroup
        fields = '__all__'
        read_only_fields = ['id', 'created_at']

    def get_children_count(self, obj):
        return obj.children.filter(is_active=True).count()


class AuthorizedPickupPersonSerializer(serializers.ModelSerializer):
    class Meta:
        model = AuthorizedPickupPerson
        fields = '__all__'
        read_only_fields = ['id', 'added_by', 'created_at']


class ChildSerializer(serializers.ModelSerializer):
    class_group_name = serializers.CharField(source='class_group.name', read_only=True, default='')
    parents = serializers.SerializerMethodField()
    authorized_pickups = AuthorizedPickupPersonSerializer(many=True, read_only=True)

    class Meta:
        model = Child
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_parents(self, obj):
        relations = obj.parent_relations.select_related('parent')
        return [
            {
                'id': r.parent.id,
                'username': r.parent.username,
                'relation': r.get_relation_display(),
                'is_primary': r.is_primary,
            }
            for r in relations
        ]


class ChildListSerializer(serializers.ModelSerializer):
    class_group_name = serializers.CharField(source='class_group.name', read_only=True, default='')

    class Meta:
        model = Child
        fields = ['id', 'name', 'gender', 'birth_date', 'class_group', 'class_group_name', 'is_active']


class ParentChildRelationSerializer(serializers.ModelSerializer):
    class Meta:
        model = ParentChildRelation
        fields = '__all__'
        read_only_fields = ['id']
