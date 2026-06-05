from rest_framework import serializers
from .models import StockIn, StockInItem, StockOut, StockOutItem, StockCheck, StockCheckItem, StockLog
from apps.books.serializers import BookListSerializer, SupplierSimpleSerializer


class StockInItemSerializer(serializers.ModelSerializer):
    book = BookListSerializer(read_only=True)
    book_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = StockInItem
        fields = ['id', 'book', 'book_id', 'quantity', 'cost_price', 'subtotal', 'batch_no', 'expire_date']


class StockInSerializer(serializers.ModelSerializer):
    supplier = SupplierSimpleSerializer(read_only=True)
    supplier_id = serializers.IntegerField(write_only=True, allow_null=True, required=False)
    items = StockInItemSerializer(many=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = StockIn
        fields = [
            'id', 'in_no', 'supplier', 'supplier_id', 'status', 'status_display',
            'total_quantity', 'total_amount', 'in_date', 'remark', 'items', 'created_at'
        ]
        read_only_fields = ['in_no', 'total_quantity', 'total_amount', 'in_date']


class StockOutItemSerializer(serializers.ModelSerializer):
    book = BookListSerializer(read_only=True)
    book_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = StockOutItem
        fields = ['id', 'book', 'book_id', 'quantity', 'price', 'subtotal', 'remark']


class StockOutSerializer(serializers.ModelSerializer):
    items = StockOutItemSerializer(many=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    type_display = serializers.CharField(source='get_type_display', read_only=True)
    
    class Meta:
        model = StockOut
        fields = [
            'id', 'out_no', 'type', 'type_display', 'status', 'status_display',
            'total_quantity', 'total_amount', 'out_date', 'remark', 'items', 'created_at'
        ]
        read_only_fields = ['out_no', 'total_quantity', 'total_amount', 'out_date']


class StockLogSerializer(serializers.ModelSerializer):
    book = BookListSerializer(read_only=True)
    type_display = serializers.CharField(source='get_type_display', read_only=True)
    
    class Meta:
        model = StockLog
        fields = [
            'id', 'book', 'type', 'type_display', 'quantity_before',
            'quantity_change', 'quantity_after', 'related_type',
            'related_id', 'remark', 'created_at'
        ]
