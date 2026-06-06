from django.contrib import admin
from .models import BorrowRecord, Reservation


@admin.register(BorrowRecord)
class BorrowRecordAdmin(admin.ModelAdmin):
    list_display = ['id', 'family', 'book', 'book_copy', 'status', 'borrower', 'reserved_at', 'due_date', 'returned_at']
    list_filter = ['status']
    search_fields = ['family__name', 'book__title', 'book_copy__barcode']


@admin.register(Reservation)
class ReservationAdmin(admin.ModelAdmin):
    list_display = ['id', 'family', 'book', 'queue_position', 'status', 'reserved_by', 'expires_at']
    list_filter = ['status']
    search_fields = ['family__name', 'book__title']
