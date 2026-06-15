from rest_framework import serializers
from .models import Benefit, MembershipPackage, PackageBenefit, MemberMembership, BenefitUsageRecord


class BenefitSerializer(serializers.ModelSerializer):
    benefit_type_display = serializers.CharField(source='get_benefit_type_display', read_only=True)

    class Meta:
        model = Benefit
        fields = [
            'id', 'name', 'description', 'benefit_type', 'benefit_type_display',
            'value', 'unit', 'is_active', 'is_demo', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class PackageBenefitSerializer(serializers.ModelSerializer):
    benefit = BenefitSerializer(read_only=True)
    benefit_id = serializers.PrimaryKeyRelatedField(
        queryset=Benefit.objects.all(), source='benefit', write_only=True
    )

    class Meta:
        model = PackageBenefit
        fields = ['id', 'benefit', 'benefit_id', 'quantity', 'created_at']
        read_only_fields = ['created_at']


class MembershipPackageSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    duration_unit_display = serializers.CharField(source='get_duration_unit_display', read_only=True)
    package_benefits = PackageBenefitSerializer(many=True, read_only=True)
    benefit_ids = serializers.ListField(
        child=serializers.IntegerField(), write_only=True, required=False
    )

    class Meta:
        model = MembershipPackage
        fields = [
            'id', 'name', 'description', 'short_description', 'price', 'original_price',
            'duration_value', 'duration_unit', 'duration_unit_display', 'benefit_ids',
            'package_benefits', 'service_count', 'status', 'status_display',
            'sort_order', 'is_popular', 'is_demo', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

    def create(self, validated_data):
        benefit_ids = validated_data.pop('benefit_ids', [])
        package = MembershipPackage.objects.create(**validated_data)
        for benefit_id in benefit_ids:
            PackageBenefit.objects.create(package=package, benefit_id=benefit_id)
        return package

    def update(self, instance, validated_data):
        benefit_ids = validated_data.pop('benefit_ids', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if benefit_ids is not None:
            instance.package_benefits.all().delete()
            for benefit_id in benefit_ids:
                PackageBenefit.objects.create(package=instance, benefit_id=benefit_id)
        return instance


class MemberMembershipSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    member_username = serializers.CharField(source='member.username', read_only=True)
    package_name = serializers.CharField(source='package.name', read_only=True)
    package = MembershipPackageSerializer(read_only=True)
    package_id = serializers.PrimaryKeyRelatedField(
        queryset=MembershipPackage.objects.all(), source='package', write_only=True
    )

    class Meta:
        model = MemberMembership
        fields = [
            'id', 'member', 'member_username', 'package', 'package_id', 'package_name',
            'start_date', 'end_date', 'remaining_services', 'total_services',
            'status', 'status_display', 'is_auto_renew', 'is_demo',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class BenefitUsageRecordSerializer(serializers.ModelSerializer):
    membership_info = serializers.SerializerMethodField(read_only=True)
    benefit_name = serializers.CharField(source='benefit.name', read_only=True)
    benefit_type_display = serializers.CharField(source='benefit.get_benefit_type_display', read_only=True)
    operator_username = serializers.CharField(source='operator.username', read_only=True)

    class Meta:
        model = BenefitUsageRecord
        fields = [
            'id', 'membership', 'membership_info', 'benefit', 'benefit_name',
            'benefit_type_display', 'quantity_used', 'used_at', 'operator',
            'operator_username', 'remark'
        ]
        read_only_fields = ['used_at']

    def get_membership_info(self, obj):
        return {
            'id': obj.membership.id,
            'member_username': obj.membership.member.username,
            'package_name': obj.membership.package.name
        }
