from rest_framework import serializers
from .models import SaleOrder, SaleOrderItem, DailySalesReport, BookSalesRank
from apps.members.serializers import MemberBaseSerializer
from apps.books.serializers import BookListSerializer


class SaleOrderItemSerializer(serializers.ModelSerializer):
    book = BookListSerializer(read_only=True)
    book_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = SaleOrderItem
        fields = ['id', 'book', 'book_id', 'quantity', 'price', 'discount', 'subtotal', 'points_earned']


class SaleOrderSerializer(serializers.ModelSerializer):
    member = MemberBaseSerializer(read_only=True)
    member_id = serializers.IntegerField(write_only=True, allow_null=True, required=False)
    items = SaleOrderItemSerializer(many=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    payment_method_display = serializers.CharField(source='get_payment_method_display', read_only=True)
    
    class Meta:
        model = SaleOrder
        fields = [
            'id', 'order_no', 'member', 'member_id', 'status', 'status_display',
            'payment_method', 'payment_method_display', 'total_quantity', 'subtotal',
            'discount_amount', 'points_used', 'points_deduction', 'total_amount',
            'paid_amount', 'points_earned', 'sale_date', 'paid_at', 'remark', 'items', 'created_at'
        ]
        read_only_fields = ['order_no', 'total_quantity', 'subtotal', 'discount_amount', 'points_deduction', 'total_amount', 'points_earned', 'paid_at']
    
    def create(self, validated_data):
        items_data = validated_data.pop('items')
        order = SaleOrder.objects.create(**validated_data)
        
        subtotal = 0
        total_qty = 0
        total_points = 0
        
        for item_data in items_data:
            from apps.books.models import Book
            book = Book.objects.get(id=item_data['book_id'])
            qty = item_data['quantity']
            discount = item_data.get('discount', 1.00)
            price = book.price * discount
            item_subtotal = price * qty
            points_earned = int(item_subtotal * getattr(self.context.get('request').settings, 'POINTS_PER_YUAN', 1))
            
            SaleOrderItem.objects.create(
                order=order,
                book=book,
                quantity=qty,
                price=price,
                discount=discount,
                subtotal=item_subtotal,
                points_earned=points_earned
            )
            
            book.stock_quantity = max(0, book.stock_quantity - qty)
            book.save()
            
            subtotal += item_subtotal
            total_qty += qty
            total_points += points_earned
        
        order.subtotal = subtotal
        order.total_quantity = total_qty
        order.discount_amount = subtotal * (1 - order.discount_amount / subtotal) if subtotal > 0 else 0
        order.total_amount = subtotal - order.discount_amount - order.points_deduction
        order.points_earned = total_points
        order.save()
        
        return order


class DailySalesReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = DailySalesReport
        fields = '__all__'


class BookSalesRankSerializer(serializers.ModelSerializer):
    book = BookListSerializer(read_only=True)
    
    class Meta:
        model = BookSalesRank
        fields = ['id', 'book', 'total_quantity', 'total_amount', 'rank', 'month_quantity', 'week_quantity']


class SalesSummarySerializer(serializers.Serializer):
    today_sales = serializers.DecimalField(max_digits=12, decimal_places=2)
    today_orders = serializers.IntegerField()
    week_sales = serializers.DecimalField(max_digits=12, decimal_places=2)
    month_sales = serializers.DecimalField(max_digits=12, decimal_places=2)
    total_members = serializers.IntegerField()
    active_members = serializers.IntegerField()
