from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.utils import timezone
from django.db import transaction, models
from django.conf import settings

from .models import Booking, BookingReminder, TimeSlot
from .serializers import (
    BookingSerializer,
    BookingReminderSerializer,
    TimeSlotSerializer
)


class DemoFilterMixin:
    def get_queryset(self):
        queryset = super().get_queryset()
        if not getattr(settings, 'SHOW_DEMO_DATA', False):
            queryset = queryset.filter(is_demo=False)
        return queryset


class TimeSlotViewSet(DemoFilterMixin, viewsets.ModelViewSet):
    queryset = TimeSlot.objects.all()
    serializer_class = TimeSlotSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['date', 'is_available', 'is_demo']
    search_fields = ['date']
    ordering_fields = ['date', 'start_time', 'max_capacity']
    ordering = ['date', 'start_time']

    @action(detail=False, methods=['get'])
    def available(self, request):
        queryset = self.filter_queryset(self.get_queryset()).filter(
            is_available=True,
            current_bookings__lt=models.F('max_capacity')
        )
        date = request.query_params.get('date')
        if date:
            queryset = queryset.filter(date=date)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def enable(self, request, pk=None):
        slot = self.get_object()
        slot.is_available = True
        slot.save()
        serializer = self.get_serializer(slot)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def disable(self, request, pk=None):
        slot = self.get_object()
        slot.is_available = False
        slot.save()
        serializer = self.get_serializer(slot)
        return Response(serializer.data)


class BookingViewSet(DemoFilterMixin, viewsets.ModelViewSet):
    queryset = Booking.objects.all()
    serializer_class = BookingSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = [
        'booking_type', 'status', 'member', 'vehicle', 'service_item',
        'booking_date', 'assigned_staff', 'is_demo'
    ]
    search_fields = [
        'order_no', 'contact_name', 'contact_phone', 'member__username',
        'vehicle__plate_number'
    ]
    ordering_fields = ['booking_date', 'booking_time', 'created_at', 'status']
    ordering = ['-booking_date', '-booking_time']

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        if user.role == 'member':
            queryset = queryset.filter(member=user)
        return queryset

    def perform_create(self, serializer):
        user = self.request.user
        if user.role == 'member':
            serializer.save(member=user)
        else:
            serializer.save()

    @action(detail=False, methods=['get'])
    def my_bookings(self, request):
        queryset = self.filter_queryset(self.get_queryset()).filter(member=request.user)
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def today(self, request):
        today = timezone.now().date()
        queryset = self.filter_queryset(self.get_queryset()).filter(booking_date=today)
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def confirm(self, request, pk=None):
        booking = self.get_object()
        if booking.status != 'pending':
            return Response(
                {'detail': '只有待确认的预约才能确认'},
                status=status.HTTP_400_BAD_REQUEST
            )
        booking.status = 'confirmed'
        booking.save()
        serializer = self.get_serializer(booking)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        booking = self.get_object()
        if booking.status in ['completed', 'cancelled']:
            return Response(
                {'detail': '已完成或已取消的预约不能取消'},
                status=status.HTTP_400_BAD_REQUEST
            )
        booking.status = 'cancelled'
        booking.save()
        serializer = self.get_serializer(booking)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        booking = self.get_object()
        if booking.status not in ['confirmed']:
            return Response(
                {'detail': '只有已确认的预约才能完成'},
                status=status.HTTP_400_BAD_REQUEST
            )
        booking.status = 'completed'
        booking.save()
        serializer = self.get_serializer(booking)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def mark_no_show(self, request, pk=None):
        booking = self.get_object()
        if booking.status not in ['confirmed']:
            return Response(
                {'detail': '只有已确认的预约才能标记为未到店'},
                status=status.HTTP_400_BAD_REQUEST
            )
        booking.status = 'no_show'
        booking.save()
        serializer = self.get_serializer(booking)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def check_in(self, request, pk=None):
        booking = self.get_object()
        if booking.status not in ['confirmed', 'pending']:
            return Response(
                {'detail': '只有待确认或已确认的预约才能到店确认'},
                status=status.HTTP_400_BAD_REQUEST
            )
        booking.arrival_time = timezone.now()
        booking.status = 'confirmed'
        booking.save()
        serializer = self.get_serializer(booking)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def send_reminder(self, request, pk=None):
        booking = self.get_object()
        reminder_type = request.data.get('reminder_type', 'sms')
        content = request.data.get('content')

        if not content:
            content = f'【预约提醒】您的预约{booking.order_no}将于{booking.booking_date} {booking.booking_time}开始，请准时到店。'

        with transaction.atomic():
            reminder = BookingReminder.objects.create(
                booking=booking,
                reminder_type=reminder_type,
                scheduled_time=timezone.now(),
                content=content,
                status='sent',
                sent_time=timezone.now()
            )
            booking.reminder_sent = True
            booking.save()

        serializer = BookingReminderSerializer(reminder)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def assign_staff(self, request, pk=None):
        booking = self.get_object()
        staff_id = request.data.get('staff_id')
        if not staff_id:
            return Response(
                {'detail': 'staff_id 参数是必需的'},
                status=status.HTTP_400_BAD_REQUEST
            )
        try:
            from apps.accounts.models import User
            staff = User.objects.get(id=staff_id, role__in=['staff', 'manager'])
        except User.DoesNotExist:
            return Response(
                {'detail': '员工不存在或角色不正确'},
                status=status.HTTP_400_BAD_REQUEST
            )
        booking.assigned_staff = staff
        booking.save()
        serializer = self.get_serializer(booking)
        return Response(serializer.data)


class BookingReminderViewSet(viewsets.ModelViewSet):
    queryset = BookingReminder.objects.all()
    serializer_class = BookingReminderSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['booking', 'reminder_type', 'status']
    search_fields = ['content', 'booking__order_no']
    ordering_fields = ['scheduled_time', 'sent_time', 'created_at']
    ordering = ['-scheduled_time']

    def get_queryset(self):
        queryset = super().get_queryset()
        if not getattr(settings, 'SHOW_DEMO_DATA', False):
            queryset = queryset.filter(booking__is_demo=False)
        user = self.request.user
        if user.role == 'member':
            queryset = queryset.filter(booking__member=user)
        return queryset

    @action(detail=False, methods=['post'])
    def batch_send(self, request):
        reminder_ids = request.data.get('reminder_ids', [])
        if not reminder_ids:
            return Response(
                {'detail': 'reminder_ids 参数是必需的'},
                status=status.HTTP_400_BAD_REQUEST
            )

        reminders = self.get_queryset().filter(
            id__in=reminder_ids,
            status='pending'
        )
        sent_count = 0
        failed_count = 0

        with transaction.atomic():
            for reminder in reminders:
                try:
                    reminder.status = 'sent'
                    reminder.sent_time = timezone.now()
                    reminder.save()
                    reminder.booking.reminder_sent = True
                    reminder.booking.save()
                    sent_count += 1
                except Exception as e:
                    reminder.status = 'failed'
                    reminder.error_message = str(e)
                    reminder.save()
                    failed_count += 1

        return Response({
            'detail': f'批量发送完成，成功{sent_count}条，失败{failed_count}条',
            'sent_count': sent_count,
            'failed_count': failed_count
        })

    @action(detail=False, methods=['post'])
    def batch_send_by_booking(self, request):
        booking_ids = request.data.get('booking_ids', [])
        reminder_type = request.data.get('reminder_type', 'sms')
        content_template = request.data.get(
            'content_template',
            '【预约提醒】您的预约{order_no}将于{date} {time}开始，请准时到店。'
        )

        if not booking_ids:
            return Response(
                {'detail': 'booking_ids 参数是必需的'},
                status=status.HTTP_400_BAD_REQUEST
            )

        bookings = Booking.objects.filter(id__in=booking_ids)
        if not getattr(settings, 'SHOW_DEMO_DATA', False):
            bookings = bookings.filter(is_demo=False)

        created_count = 0
        with transaction.atomic():
            for booking in bookings:
                content = content_template.format(
                    order_no=booking.order_no,
                    date=booking.booking_date,
                    time=booking.booking_time
                )
                BookingReminder.objects.create(
                    booking=booking,
                    reminder_type=reminder_type,
                    scheduled_time=timezone.now(),
                    content=content,
                    status='sent',
                    sent_time=timezone.now()
                )
                booking.reminder_sent = True
                booking.save()
                created_count += 1

        return Response({
            'detail': f'批量创建并发送提醒完成，共{created_count}条',
            'created_count': created_count
        })

    @action(detail=True, methods=['post'])
    def send(self, request, pk=None):
        reminder = self.get_object()
        if reminder.status != 'pending':
            return Response(
                {'detail': '只有待发送的提醒才能发送'},
                status=status.HTTP_400_BAD_REQUEST
            )
        try:
            reminder.status = 'sent'
            reminder.sent_time = timezone.now()
            reminder.save()
            reminder.booking.reminder_sent = True
            reminder.booking.save()
        except Exception as e:
            reminder.status = 'failed'
            reminder.error_message = str(e)
            reminder.save()
            return Response(
                {'detail': f'发送失败: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        serializer = self.get_serializer(reminder)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def pending(self, request):
        queryset = self.filter_queryset(self.get_queryset()).filter(status='pending')
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
