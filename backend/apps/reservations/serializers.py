from rest_framework import serializers
from .models import Reservation, ReservationItem
from apps.books.serializers import BookListSerializer
from apps.members.serializers import MemberBaseSerializer


class ReservationItemSerializer(serializers.ModelSerializer):
    book = BookListSerializer(read_only=True)
    book_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = ReservationItem
        fields = ['id', 'book', 'book_id', 'quantity', 'price', 'subtotal', 'picked_up', 'picked_up_at']


class ReservationSerializer(serializers.ModelSerializer):
    member = MemberBaseSerializer(read_only=True)
    member_id = serializers.IntegerField(write_only=True)
    items = ReservationItemSerializer(many=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    is_expired = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = Reservation
        fields = [
            'id', 'reservation_no', 'member', 'member_id', 'contact_name', 'contact_phone',
            'status', 'status_display', 'expire_at', 'is_expired', 'total_quantity',
            'total_amount', 'confirmed_at', 'completed_at', 'cancelled_at',
            'cancelled_reason', 'remark', 'items', 'created_at'
        ]
        read_only_fields = ['reservation_no', 'status', 'total_quantity', 'total_amount', 'confirmed_at', 'completed_at', 'cancelled_at']
    
    def create(self, validated_data):
        items_data = validated_data.pop('items')
        reservation = Reservation.objects.create(**validated_data)
        
        total_qty = 0
        total_amount = 0
        
        for item_data in items_data:
            book = item_data['book_id']
            from apps.books.models import Book
            book_obj = Book.objects.get(id=book)
            qty = item_data['quantity']
            price = book_obj.price
            subtotal = price * qty
            
            ReservationItem.objects.create(
                reservation=reservation,
                book=book_obj,
                quantity=qty,
                price=price,
                subtotal=subtotal
            )
            
            book_obj.reserved_quantity += qty
            book_obj.save()
            
            total_qty += qty
            total_amount += subtotal
        
        reservation.total_quantity = total_qty
        reservation.total_amount = total_amount
        reservation.save()
        
        return reservation


class ReservationCreateSerializer(serializers.Serializer):
    member_id = serializers.IntegerField(required=True)
    contact_name = serializers.CharField(required=True, max_length=100)
    contact_phone = serializers.CharField(required=True, max_length=20)
    items = serializers.ListField(
        child=serializers.DictField(
            child=serializers.IntegerField()
        ),
        required=True
    )
    remark = serializers.CharField(required=False, allow_blank=True)
    expire_hours = serializers.IntegerField(required=False, default=48)


class ReservationCancelSerializer(serializers.Serializer):
    reason = serializers.CharField(required=False, allow_blank=True)
