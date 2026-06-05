from django.db import models
from apps.core.models import BaseModel
from apps.members.models import Member
from apps.books.models import Book
from django.utils import timezone


class SaleOrder(BaseModel):
    STATUS_DRAFT = 'draft'
    STATUS_CONFIRMED = 'confirmed'
    STATUS_PAID = 'paid'
    STATUS_COMPLETED = 'completed'
    STATUS_REFUNDED = 'refunded'
    STATUS_CANCELLED = 'cancelled'
    
    STATUS_CHOICES = [
        (STATUS_DRAFT, '草稿'),
        (STATUS_CONFIRMED, '已确认'),
        (STATUS_PAID, '已支付'),
        (STATUS_COMPLETED, '已完成'),
        (STATUS_REFUNDED, '已退款'),
        (STATUS_CANCELLED, '已取消'),
    ]
    
    PAYMENT_CASH = 'cash'
    PAYMENT_WECHAT = 'wechat'
    PAYMENT_ALIPAY = 'alipay'
    PAYMENT_CARD = 'card'
    PAYMENT_POINTS = 'points'
    PAYMENT_MIXED = 'mixed'
    
    PAYMENT_CHOICES = [
        (PAYMENT_CASH, '现金'),
        (PAYMENT_WECHAT, '微信支付'),
        (PAYMENT_ALIPAY, '支付宝'),
        (PAYMENT_CARD, '银行卡'),
        (PAYMENT_POINTS, '积分抵扣'),
        (PAYMENT_MIXED, '混合支付'),
    ]
    
    order_no = models.CharField(max_length=30, unique=True, verbose_name='订单号')
    member = models.ForeignKey(Member, on_delete=models.SET_NULL, null=True, blank=True, related_name='orders', verbose_name='会员')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_DRAFT, verbose_name='状态')
    payment_method = models.CharField(max_length=20, choices=PAYMENT_CHOICES, blank=True, verbose_name='支付方式')
    total_quantity = models.IntegerField(default=0, verbose_name='商品总数')
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=0, verbose_name='商品金额')
    discount_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0, verbose_name='折扣金额')
    points_used = models.IntegerField(default=0, verbose_name='使用积分')
    points_deduction = models.DecimalField(max_digits=12, decimal_places=2, default=0, verbose_name='积分抵扣金额')
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0, verbose_name='应付金额')
    paid_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0, verbose_name='实付金额')
    points_earned = models.IntegerField(default=0, verbose_name='获得积分')
    sale_date = models.DateTimeField(default=timezone.now, verbose_name='销售时间')
    paid_at = models.DateTimeField(null=True, blank=True, verbose_name='支付时间')
    remark = models.TextField(blank=True, verbose_name='备注')

    class Meta:
        db_table = 'sale_order'
        verbose_name = '销售订单'
        verbose_name_plural = verbose_name
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['order_no']),
            models.Index(fields=['status']),
            models.Index(fields=['sale_date']),
        ]

    def __str__(self):
        return self.order_no
    
    def save(self, *args, **kwargs):
        if not self.order_no:
            from datetime import datetime
            today = datetime.now()
            prefix = f'SO{today.strftime("%Y%m%d")}'
            last = SaleOrder.objects.filter(order_no__startswith=prefix).order_by('-order_no').first()
            seq = int(last.order_no[-4:]) + 1 if last else 1
            self.order_no = f'{prefix}{seq:04d}'
        super().save(*args, **kwargs)


class SaleOrderItem(models.Model):
    order = models.ForeignKey(SaleOrder, on_delete=models.CASCADE, related_name='items', verbose_name='订单')
    book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name='order_items', verbose_name='图书')
    quantity = models.IntegerField(verbose_name='数量')
    price = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='单价')
    discount = models.DecimalField(max_digits=5, decimal_places=2, default=1.00, verbose_name='折扣率')
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, verbose_name='小计')
    points_earned = models.IntegerField(default=0, verbose_name='获得积分')

    class Meta:
        db_table = 'sale_order_item'
        verbose_name = '订单明细'
        verbose_name_plural = verbose_name

    def __str__(self):
        return f'{self.order.order_no} - {self.book.title}'


class DailySalesReport(models.Model):
    date = models.DateField(unique=True, verbose_name='日期')
    order_count = models.IntegerField(default=0, verbose_name='订单数')
    member_count = models.IntegerField(default=0, verbose_name='会员订单数')
    guest_count = models.IntegerField(default=0, verbose_name='散客订单数')
    total_quantity = models.IntegerField(default=0, verbose_name='销售册数')
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0, verbose_name='销售总额')
    total_cost = models.DecimalField(max_digits=12, decimal_places=2, default=0, verbose_name='成本总额')
    total_profit = models.DecimalField(max_digits=12, decimal_places=2, default=0, verbose_name='利润总额')
    total_points_earned = models.IntegerField(default=0, verbose_name='发放积分')
    total_points_used = models.IntegerField(default=0, verbose_name='使用积分')
    discount_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0, verbose_name='折扣总额')
    refund_count = models.IntegerField(default=0, verbose_name='退款订单数')
    refund_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0, verbose_name='退款金额')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')

    class Meta:
        db_table = 'daily_sales_report'
        verbose_name = '日销售报表'
        verbose_name_plural = verbose_name
        ordering = ['-date']

    def __str__(self):
        return str(self.date)


class BookSalesRank(models.Model):
    book = models.OneToOneField(Book, on_delete=models.CASCADE, related_name='sales_rank', verbose_name='图书')
    total_quantity = models.IntegerField(default=0, verbose_name='总销量')
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0, verbose_name='总销售额')
    rank = models.IntegerField(default=0, verbose_name='排名')
    month_quantity = models.IntegerField(default=0, verbose_name='本月销量')
    week_quantity = models.IntegerField(default=0, verbose_name='本周销量')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')

    class Meta:
        db_table = 'book_sales_rank'
        verbose_name = '图书销量排行'
        verbose_name_plural = verbose_name
        ordering = ['rank']

    def __str__(self):
        return f'{self.book.title} - {self.rank}'
