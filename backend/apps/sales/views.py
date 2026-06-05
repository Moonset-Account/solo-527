from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction, models
from django.db.models import Sum, Count
from django.utils import timezone
from datetime import timedelta
from .models import SaleOrder, SaleOrderItem, DailySalesReport, BookSalesRank
from .serializers import (
    SaleOrderSerializer, DailySalesReportSerializer,
    BookSalesRankSerializer, SalesSummarySerializer
)
from apps.core.permissions import IsAdminOrManager
from apps.books.models import Book
from apps.members.models import Member, PointsRecord


class SaleOrderViewSet(viewsets.ModelViewSet):
    queryset = SaleOrder.objects.all()
    serializer_class = SaleOrderSerializer
    filterset_fields = ['status', 'payment_method', 'member']
    search_fields = ['order_no']
    ordering_fields = ['sale_date', 'total_amount', 'created_at']
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.IsAuthenticated()]
        return [IsAdminOrManager()]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        
        if start_date:
            queryset = queryset.filter(sale_date__date__gte=start_date)
        if end_date:
            queryset = queryset.filter(sale_date__date__lte=end_date)
        
        return queryset
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        
        with transaction.atomic():
            validated_data = serializer.validated_data
            items_data = validated_data.pop('items')
            order = SaleOrder.objects.create(**validated_data)
            
            subtotal = 0
            total_qty = 0
            total_points = 0
            
            for item_data in items_data:
                book = Book.objects.get(id=item_data['book_id'])
                qty = item_data['quantity']
                
                if book.stock_quantity < qty:
                    return Response({
                        'error': f'图书《{book.title}》库存不足，当前库存：{book.stock_quantity}'
                    }, status=400)
                
                discount = item_data.get('discount', 1.00)
                price = float(book.price) * float(discount)
                item_subtotal = price * qty
                points_earned = int(item_subtotal * 1)
                
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
            order.discount_amount = subtotal - subtotal  # 简化处理
            order.total_amount = subtotal - order.points_deduction
            order.points_earned = total_points
            order.status = SaleOrder.STATUS_PAID
            order.paid_amount = order.total_amount
            order.paid_at = timezone.now()
            order.save()
            
            if order.member and order.points_earned > 0:
                member = order.member
                new_balance = member.available_points + order.points_earned
                PointsRecord.objects.create(
                    member=member,
                    type='earn',
                    points=order.points_earned,
                    balance_after=new_balance,
                    source='消费获得',
                    related_id=order.id
                )
                member.available_points = new_balance
                member.total_points += order.points_earned
                member.save()
        
        return Response(SaleOrderSerializer(order).data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def refund(self, request, pk=None):
        order = self.get_object()
        if order.status in [SaleOrder.STATUS_REFUNDED, SaleOrder.STATUS_CANCELLED]:
            return Response({'error': '订单已退款或取消'}, status=400)
        
        with transaction.atomic():
            for item in order.items.all():
                book = item.book
                book.stock_quantity += item.quantity
                book.save()
            
            order.status = SaleOrder.STATUS_REFUNDED
            order.save()
        
        return Response({'message': '退款成功'})


class DailySalesReportViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = DailySalesReport.objects.all()
    serializer_class = DailySalesReportSerializer
    permission_classes = [IsAdminOrManager]
    ordering_fields = ['date']


class BookSalesRankViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = BookSalesRank.objects.all()
    serializer_class = BookSalesRankSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return super().get_queryset().order_by('rank')[:20]


class SalesDashboardViewSet(viewsets.GenericViewSet):
    permission_classes = [IsAdminOrManager]
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        today = timezone.now().date()
        week_ago = today - timedelta(days=7)
        month_ago = today - timedelta(days=30)
        
        today_orders = SaleOrder.objects.filter(
            status__in=[SaleOrder.STATUS_PAID, SaleOrder.STATUS_COMPLETED],
            sale_date__date=today
        )
        today_sales = today_orders.aggregate(total=Sum('total_amount'))['total'] or 0
        today_count = today_orders.count()
        
        week_sales = SaleOrder.objects.filter(
            status__in=[SaleOrder.STATUS_PAID, SaleOrder.STATUS_COMPLETED],
            sale_date__date__gte=week_ago
        ).aggregate(total=Sum('total_amount'))['total'] or 0
        
        month_sales = SaleOrder.objects.filter(
            status__in=[SaleOrder.STATUS_PAID, SaleOrder.STATUS_COMPLETED],
            sale_date__date__gte=month_ago
        ).aggregate(total=Sum('total_amount'))['total'] or 0
        
        total_members = Member.objects.filter(is_active=True).count()
        active_members = Member.objects.filter(
            is_active=True,
            orders__sale_date__date__gte=month_ago
        ).distinct().count()
        
        data = {
            'today_sales': today_sales,
            'today_orders': today_count,
            'week_sales': week_sales,
            'month_sales': month_sales,
            'total_members': total_members,
            'active_members': active_members,
        }
        return Response(SalesSummarySerializer(data).data)
    
    @action(detail=False, methods=['get'])
    def recent_orders(self, request):
        orders = SaleOrder.objects.all().order_by('-created_at')[:10]
        return Response(SaleOrderSerializer(orders, many=True).data)
    
    @action(detail=False, methods=['get'])
    def top_books(self, request):
        from django.db.models import Sum as S
        items = SaleOrderItem.objects.values('book').annotate(
            total_qty=S('quantity'),
            total_amount=S('subtotal')
        ).order_by('-total_qty')[:10]
        
        result = []
        for item in items:
            try:
                book = Book.objects.get(id=item['book'])
                result.append({
                    'book': BookListSerializer(book).data,
                    'total_quantity': item['total_qty'],
                    'total_amount': item['total_amount']
                })
            except Book.DoesNotExist:
                continue
        return Response(result)
    
    @action(detail=False, methods=['get'])
    def alerts(self, request):
        from apps.books.models import Book
        from apps.reservations.models import Reservation
        
        low_stock_books = Book.objects.filter(
            is_active=True,
            stock_quantity__lte=models.F('low_stock_threshold')
        ).count()
        
        expired_reservations = Reservation.objects.filter(
            status__in=[Reservation.STATUS_PENDING, Reservation.STATUS_CONFIRMED],
            expire_at__lte=timezone.now()
        ).count()
        
        upcoming_events = []
        from apps.events.models import Event
        events = Event.objects.filter(
            is_active=True,
            start_time__gte=timezone.now(),
            start_time__lte=timezone.now() + timedelta(days=7)
        )[:5]
        for event in events:
            upcoming_events.append({
                'id': event.id,
                'title': event.title,
                'start_time': event.start_time,
                'available_slots': event.available_slots
            })
        
        return Response({
            'low_stock_count': low_stock_books,
            'expired_reservations_count': expired_reservations,
            'upcoming_events': upcoming_events,
        })
