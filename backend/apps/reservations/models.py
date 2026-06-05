from django.db import models
from django.conf import settings
from apps.core.models import BaseModel
from apps.members.models import Member
from apps.books.models import Book
from django.utils import timezone
from datetime import timedelta


class Reservation(BaseModel):
    STATUS_PENDING = 'pending'
    STATUS_CONFIRMED = 'confirmed'
    STATUS_COMPLETED = 'completed'
    STATUS_EXPIRED = 'expired'
    STATUS_CANCELLED = 'cancelled'
    
    STATUS_CHOICES = [
        (STATUS_PENDING, '待确认'),
        (STATUS_CONFIRMED, '已确认'),
        (STATUS_COMPLETED, '已完成'),
        (STATUS_EXPIRED, '已过期'),
        (STATUS_CANCELLED, '已取消'),
    ]
    
    reservation_no = models.CharField(max_length=30, unique=True, verbose_name='预留单号')
    member = models.ForeignKey(Member, on_delete=models.CASCADE, related_name='reservations', null=True, blank=True, verbose_name='会员')
    contact_name = models.CharField(max_length=100, verbose_name='联系人姓名')
    contact_phone = models.CharField(max_length=20, verbose_name='联系电话')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING, verbose_name='状态')
    expire_at = models.DateTimeField(verbose_name='过期时间')
    total_quantity = models.IntegerField(default=0, verbose_name='总数量')
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0, verbose_name='总金额')
    confirmed_at = models.DateTimeField(null=True, blank=True, verbose_name='确认时间')
    completed_at = models.DateTimeField(null=True, blank=True, verbose_name='完成时间')
    cancelled_at = models.DateTimeField(null=True, blank=True, verbose_name='取消时间')
    cancelled_reason = models.TextField(blank=True, verbose_name='取消原因')
    remark = models.TextField(blank=True, verbose_name='备注')

    class Meta:
        db_table = 'reservation'
        verbose_name = '预留单'
        verbose_name_plural = verbose_name
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['expire_at']),
        ]

    def __str__(self):
        return self.reservation_no
    
    def save(self, *args, **kwargs):
        if not self.reservation_no:
            from datetime import datetime
            today = datetime.now()
            prefix = f'RE{today.strftime("%Y%m%d")}'
            last = Reservation.objects.filter(reservation_no__startswith=prefix).order_by('-reservation_no').first()
            seq = int(last.reservation_no[-4:]) + 1 if last else 1
            self.reservation_no = f'{prefix}{seq:04d}'
        
        if not self.expire_at:
            expire_hours = getattr(settings, 'RESERVATION_EXPIRE_HOURS', 48)
            self.expire_at = timezone.now() + timedelta(hours=expire_hours)
        
        super().save(*args, **kwargs)
    
    @property
    def is_expired(self):
        if self.status in [self.STATUS_COMPLETED, self.STATUS_CANCELLED, self.STATUS_EXPIRED]:
            return self.status == self.STATUS_EXPIRED
        return timezone.now() > self.expire_at


class ReservationItem(models.Model):
    reservation = models.ForeignKey(Reservation, on_delete=models.CASCADE, related_name='items', verbose_name='预留单')
    book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name='reservation_items', verbose_name='图书')
    quantity = models.IntegerField(verbose_name='数量')
    price = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='单价')
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, verbose_name='小计')
    picked_up = models.BooleanField(default=False, verbose_name='是否已取')
    picked_up_at = models.DateTimeField(null=True, blank=True, verbose_name='取书时间')

    class Meta:
        db_table = 'reservation_item'
        verbose_name = '预留明细'
        verbose_name_plural = verbose_name

    def __str__(self):
        return f'{self.reservation.reservation_no} - {self.book.title}'
