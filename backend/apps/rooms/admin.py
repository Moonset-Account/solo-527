from django.contrib import admin
from .models import StudyRoom, Seat, SeatReservation, CheckInRecord
from import_export.admin import ImportExportModelAdmin


class SeatInline(admin.TabularInline):
    model = Seat
    extra = 0


@admin.register(StudyRoom)
class StudyRoomAdmin(ImportExportModelAdmin):
    list_display = ['name', 'building', 'floor', 'total_seats', 'is_active', 'open_time', 'close_time']
    list_filter = ['building', 'floor', 'is_active']
    search_fields = ['name', 'building']
    inlines = [SeatInline]


@admin.register(Seat)
class SeatAdmin(admin.ModelAdmin):
    list_display = ['study_room', 'seat_number', 'row', 'col', 'has_power', 'has_window', 'is_active']
    list_filter = ['study_room__building', 'has_power', 'has_window', 'is_active']
    search_fields = ['seat_number']


@admin.register(SeatReservation)
class SeatReservationAdmin(admin.ModelAdmin):
    list_display = ['user', 'seat', 'date', 'start_time', 'end_time', 'status', 'reserved_at']
    list_filter = ['status', 'date']
    search_fields = ['user__username', 'user__real_name']
    date_hierarchy = 'date'


@admin.register(CheckInRecord)
class CheckInRecordAdmin(ImportExportModelAdmin):
    list_display = ['user', 'checkin_type', 'location', 'created_at']
    list_filter = ['checkin_type', 'created_at']
    search_fields = ['user__username', 'user__real_name']
    date_hierarchy = 'created_at'
