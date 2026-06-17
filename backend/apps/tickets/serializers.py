from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Ticket, TicketNote, TicketHistory
from apps.core.serializers import BaseSerializer

User = get_user_model()


class UserSerializer(BaseSerializer):
    role_display = serializers.CharField(source='get_role_display', read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role', 'role_display', 'phone',
                  'department', 'is_active', 'date_joined']
        read_only_fields = ['date_joined']


class TicketSerializer(BaseSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    type_display = serializers.CharField(source='get_type_display', read_only=True)
    assignee_name = serializers.CharField(source='assignee.username', read_only=True)
    creator_name = serializers.CharField(source='creator.username', read_only=True)
    escalated_to_name = serializers.CharField(source='escalated_to.username', read_only=True, default=None)
    is_overdue = serializers.BooleanField(read_only=True)
    first_response_duration = serializers.FloatField(read_only=True, default=None)
    total_duration = serializers.FloatField(read_only=True, default=None)
    notes_count = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = Ticket
        fields = [
            'id', 'ticket_no', 'title', 'description', 'status', 'status_display',
            'priority', 'priority_display', 'type', 'type_display', 'order_no',
            'product_name', 'customer_name', 'customer_phone', 'customer_email',
            'assignee', 'assignee_name', 'creator', 'creator_name', 'escalated_to',
            'escalated_to_name', 'escalated_at', 'escalation_reason',
            'first_response_at', 'first_response_duration', 'resolution',
            'sla_deadline', 'is_overdue', 'total_duration', 'resolved_at',
            'closed_at', 'satisfaction_score', 'tags', 'notes_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'ticket_no', 'created_at', 'updated_at', 'resolved_at', 'closed_at',
            'escalated_at', 'first_response_at', 'is_overdue',
            'first_response_duration', 'total_duration', 'notes_count'
        ]

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if hasattr(instance, 'notes_count'):
            data['notes_count'] = instance.notes_count
        return data


class TicketDetailSerializer(TicketSerializer):
    notes = serializers.SerializerMethodField()
    history = serializers.SerializerMethodField()

    class Meta(TicketSerializer.Meta):
        fields = TicketSerializer.Meta.fields + ['notes', 'history']

    def get_notes(self, obj):
        notes = obj.notes.all()[:50]
        return TicketNoteSerializer(notes, many=True, context=self.context).data

    def get_history(self, obj):
        history = obj.history.all()[:50]
        return TicketHistorySerializer(history, many=True, context=self.context).data


class TicketNoteSerializer(BaseSerializer):
    author_name = serializers.CharField(source='created_by.username', read_only=True)

    class Meta:
        model = TicketNote
        fields = ['id', 'ticket', 'content', 'is_internal', 'attachment',
                  'author_name', 'created_at']
        read_only_fields = ['created_at']


class TicketHistorySerializer(BaseSerializer):
    actor_name = serializers.CharField(source='actor.username', read_only=True)

    class Meta:
        model = TicketHistory
        fields = ['id', 'ticket', 'actor', 'actor_name', 'action', 'description',
                  'old_value', 'new_value', 'field_name', 'created_at']
        read_only_fields = ['created_at']


class TicketAssignSerializer(serializers.Serializer):
    assignee_id = serializers.IntegerField(required=True)


class TicketEscalateSerializer(serializers.Serializer):
    escalated_to_id = serializers.IntegerField(required=True)
    escalation_reason = serializers.CharField(required=True)


class TicketResolveSerializer(serializers.Serializer):
    resolution = serializers.CharField(required=True)
    status = serializers.ChoiceField(
        choices=[('resolved', '已解决'), ('closed', '已关闭')],
        default='resolved'
    )


class TicketNoteCreateSerializer(serializers.Serializer):
    content = serializers.CharField(required=True)
    is_internal = serializers.BooleanField(default=False)


class TodoStatsSerializer(serializers.Serializer):
    total = serializers.IntegerField()
    urgent = serializers.IntegerField()
    due_soon = serializers.IntegerField()

class ExceptionStatsSerializer(serializers.Serializer):
    overdue = serializers.IntegerField()
    escalated_no_response = serializers.IntegerField()
    repeated_complaints = serializers.IntegerField()

class ReportStatsSerializer(serializers.Serializer):
    today_tickets = serializers.IntegerField()
    today_resolved = serializers.IntegerField()
    avg_response_time = serializers.FloatField()
    resolution_rate = serializers.FloatField()

class DashboardStatsSerializer(serializers.Serializer):
    todo = TodoStatsSerializer()
    exceptions = ExceptionStatsSerializer()
    reports = ReportStatsSerializer()
