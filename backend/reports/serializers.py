from rest_framework import serializers


class OverdueDetailSerializer(serializers.Serializer):
    reminder_id = serializers.IntegerField()
    reconciliation_id = serializers.IntegerField()
    project_name = serializers.CharField()
    client_name = serializers.CharField()
    total_amount = serializers.DecimalField(max_digits=15, decimal_places=2)
    difference_amount = serializers.DecimalField(max_digits=15, decimal_places=2)
    overdue_days = serializers.IntegerField()
    assignee_id = serializers.IntegerField()
    assignee_name = serializers.CharField()
    priority = serializers.CharField()
    status = serializers.CharField()
    escalation_level = serializers.IntegerField()
    due_date = serializers.DateField()


class MismatchRecordSerializer(serializers.Serializer):
    difference_id = serializers.IntegerField()
    reconciliation_id = serializers.IntegerField()
    project_name = serializers.CharField()
    client_name = serializers.CharField()
    item_type = serializers.CharField()
    system_value = serializers.CharField()
    uploaded_value = serializers.CharField()
    is_confirmed = serializers.BooleanField()


class LastActionSerializer(serializers.Serializer):
    reminder_id = serializers.IntegerField()
    reconciliation_id = serializers.IntegerField()
    project_name = serializers.CharField()
    assignee_name = serializers.CharField()
    status = serializers.CharField()
    handled_at = serializers.DateTimeField(allow_null=True)
    escalation_level = serializers.IntegerField()
