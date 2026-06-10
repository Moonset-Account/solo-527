from rest_framework import serializers

from apps.reminders.models import Reminder, ReminderRule


class ReminderRuleSerializer(serializers.ModelSerializer):
    level_display = serializers.CharField(source='level_display', read_only=True)
    trigger_type_display = serializers.CharField(source='get_trigger_type_display', read_only=True)
    created_by_name = serializers.CharField(source='created_by.real_name', read_only=True)

    class Meta:
        model = ReminderRule
        fields = [
            'id', 'name', 'trigger_type', 'trigger_type_display',
            'level', 'level_display', 'color', 'time_limit_minutes',
            'conditions', 'actions', 'is_active', 'description',
            'created_by', 'created_by_name', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate(self, attrs):
        if 'level' in attrs:
            level = attrs['level']
            colors = ReminderRule.LEVEL_COLORS
            if not attrs.get('color') or attrs['color'] == '#FDD835':
                attrs['color'] = colors.get(level, '#FDD835')
        return attrs


class ReminderSerializer(serializers.ModelSerializer):
    level_display = serializers.CharField(source='level_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    related_type_display = serializers.CharField(source='get_related_type_display', read_only=True)
    handled_by_name = serializers.CharField(source='handled_by.real_name', read_only=True)
    is_overdue = serializers.BooleanField(read_only=True)
    remaining_minutes = serializers.IntegerField(read_only=True)

    class Meta:
        model = Reminder
        fields = [
            'id', 'rule', 'rule_name', 'level', 'level_display',
            'color', 'title', 'content', 'related_type', 'related_type_display',
            'related_id', 'status', 'status_display', 'time_limit',
            'is_overdue', 'remaining_minutes', 'escalated', 'original_level',
            'created_at', 'handled_by', 'handled_by_name', 'handled_at', 'handle_notes'
        ]
        read_only_fields = ['id', 'created_at', 'is_overdue', 'remaining_minutes']


class ReminderHandleSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=['processing', 'resolved', 'ignored'])
    notes = serializers.CharField(required=False, allow_blank=True)
