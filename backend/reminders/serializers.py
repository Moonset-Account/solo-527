from rest_framework import serializers
from .models import Reminder, ReminderConfig


class ReminderSerializer(serializers.ModelSerializer):
    assignee_name = serializers.SerializerMethodField()

    class Meta:
        model = Reminder
        fields = '__all__'

    def get_assignee_name(self, obj):
        return obj.assignee.get_full_name() or obj.assignee.username


class ReminderConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReminderConfig
        fields = '__all__'


class EscalationLogSerializer(serializers.ModelSerializer):
    assignee_name = serializers.SerializerMethodField()

    class Meta:
        model = Reminder
        fields = '__all__'

    def get_assignee_name(self, obj):
        return obj.assignee.get_full_name() or obj.assignee.username
