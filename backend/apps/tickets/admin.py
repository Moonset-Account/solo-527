from django.contrib import admin
from .models import Ticket, TicketNote, TicketHistory


@admin.register(Ticket)
class TicketAdmin(admin.ModelAdmin):
    list_display = ['ticket_no', 'title', 'status', 'priority', 'type', 'customer_name',
                    'assignee', 'creator', 'created_at', 'sla_deadline', 'is_overdue_display']
    list_filter = ['status', 'priority', 'type', 'created_at', 'sla_deadline']
    search_fields = ['ticket_no', 'title', 'description', 'customer_name',
                     'customer_phone', 'order_no', 'product_name']
    date_hierarchy = 'created_at'
    readonly_fields = ['ticket_no', 'created_at', 'updated_at', 'resolved_at',
                       'closed_at', 'escalated_at', 'first_response_at']

    def is_overdue_display(self, obj):
        return obj.is_overdue
    is_overdue_display.short_description = '是否逾期'
    is_overdue_display.boolean = True


@admin.register(TicketNote)
class TicketNoteAdmin(admin.ModelAdmin):
    list_display = ['ticket', 'created_by', 'is_internal', 'created_at']
    list_filter = ['is_internal', 'created_at']
    search_fields = ['ticket__title', 'ticket__ticket_no', 'content']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(TicketHistory)
class TicketHistoryAdmin(admin.ModelAdmin):
    list_display = ['ticket', 'actor', 'action', 'field_name', 'created_at']
    list_filter = ['action', 'created_at']
    search_fields = ['ticket__title', 'ticket__ticket_no', 'action', 'description']
    readonly_fields = ['created_at', 'updated_at']
