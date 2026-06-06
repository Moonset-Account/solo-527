from rest_framework import serializers
from .models import BorrowRecord, BorrowStatus, Reservation, BorrowStatusLog
from apps.accounts.serializers import FamilySerializer, UserSerializer
from apps.books.serializers import BookSerializer, BookCopySerializer


class BorrowStatusLogSerializer(serializers.ModelSerializer):
    from_status_display = serializers.CharField(source='get_from_status_display', read_only=True)
    to_status_display = serializers.CharField(source='get_to_status_display', read_only=True)
    operator_name = serializers.CharField(source='operator.username', read_only=True)
    
    class Meta:
        model = BorrowStatusLog
        fields = '__all__'


class BorrowRecordSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    family_name = serializers.CharField(source='family.name', read_only=True)
    book_title = serializers.CharField(source='book.title', read_only=True)
    book_cover = serializers.ImageField(source='book.cover', read_only=True)
    book_copy_barcode = serializers.CharField(source='book_copy.barcode', read_only=True)
    borrower_name = serializers.CharField(source='borrower.username', read_only=True)
    can_renew = serializers.BooleanField(read_only=True)
    status_logs = BorrowStatusLogSerializer(many=True, read_only=True)
    
    class Meta:
        model = BorrowRecord
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class BorrowRecordCreateSerializer(serializers.Serializer):
    family_id = serializers.IntegerField()
    book_copy_id = serializers.IntegerField()


class BorrowTransitionSerializer(serializers.Serializer):
    new_status = serializers.ChoiceField(choices=BorrowStatus.choices)
    notes = serializers.CharField(required=False, allow_blank=True)


class ReservationSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    family_name = serializers.CharField(source='family.name', read_only=True)
    book_title = serializers.CharField(source='book.title', read_only=True)
    book_cover = serializers.ImageField(source='book.cover', read_only=True)
    reserved_by_name = serializers.CharField(source='reserved_by.username', read_only=True)
    
    class Meta:
        model = Reservation
        fields = '__all__'
        read_only_fields = ['id', 'queue_position']


class ReservationCreateSerializer(serializers.Serializer):
    book_id = serializers.IntegerField()
