from django.db import models
from django.utils import timezone
from apps.common.models import BaseModel
from apps.accounts.models import Family, User
from apps.books.models import Book, BookCopy, BookStatus
from django.conf import settings


class BorrowStatus(models.TextChoices):
    RESERVED = 'reserved', '已预约'
    PICKED_UP = 'picked_up', '已取书'
    BORROWED = 'borrowed', '借阅中'
    OVERDUE = 'overdue', '已逾期'
    RETURNED = 'returned', '已归还'
    CANCELLED = 'cancelled', '已取消'
    LOST = 'lost', '已丢失'


class BorrowRecord(BaseModel):
    family = models.ForeignKey(Family, on_delete=models.CASCADE, related_name='borrow_records', verbose_name='借阅家庭')
    book_copy = models.ForeignKey(BookCopy, on_delete=models.CASCADE, related_name='borrow_records', verbose_name='绘本副本')
    book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name='borrow_records', verbose_name='绘本')
    borrower = models.ForeignKey(User, on_delete=models.CASCADE, related_name='borrow_records', verbose_name='借阅人')
    status = models.CharField(max_length=20, choices=BorrowStatus.choices, default=BorrowStatus.RESERVED, verbose_name='借阅状态')
    reserved_at = models.DateTimeField(null=True, blank=True, verbose_name='预约时间')
    picked_up_at = models.DateTimeField(null=True, blank=True, verbose_name='取书时间')
    due_date = models.DateField(null=True, blank=True, verbose_name='应还日期')
    returned_at = models.DateTimeField(null=True, blank=True, verbose_name='归还时间')
    actual_due_date = models.DateField(null=True, blank=True, verbose_name='实际到期日')
    renew_count = models.IntegerField(default=0, verbose_name='续借次数')
    max_renew_count = models.IntegerField(default=1, verbose_name='最大续借次数')
    overdue_fine = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name='逾期罚款')
    notes = models.TextField(blank=True, verbose_name='备注')
    handled_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='handled_borrows', verbose_name='处理馆员')

    class Meta:
        db_table = 'borrowing_borrow_record'
        verbose_name = '借阅记录'
        verbose_name_plural = verbose_name
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.family.name} - {self.book.title}'

    def save(self, *args, **kwargs):
        if not self.book_id and self.book_copy_id:
            self.book = self.book_copy.book
        super().save(*args, **kwargs)

    def can_transition(self, new_status):
        valid_transitions = {
            BorrowStatus.RESERVED: [BorrowStatus.PICKED_UP, BorrowStatus.CANCELLED],
            BorrowStatus.PICKED_UP: [BorrowStatus.BORROWED, BorrowStatus.CANCELLED],
            BorrowStatus.BORROWED: [BorrowStatus.RETURNED, BorrowStatus.OVERDUE, BorrowStatus.LOST],
            BorrowStatus.OVERDUE: [BorrowStatus.RETURNED, BorrowStatus.LOST],
            BorrowStatus.RETURNED: [],
            BorrowStatus.CANCELLED: [],
            BorrowStatus.LOST: [],
        }
        return new_status in valid_transitions.get(self.status, [])

    def transition(self, new_status, **kwargs):
        if not self.can_transition(new_status):
            raise ValueError(f'不能从 {self.get_status_display()} 转换到 {new_status}')
        
        old_status = self.status
        self.status = new_status
        now = timezone.now()
        
        if new_status == BorrowStatus.RESERVED:
            self.reserved_at = now
            self.book_copy.status = BookStatus.RESERVED
        elif new_status == BorrowStatus.PICKED_UP:
            self.picked_up_at = now
            family = self.family
            max_days = family.level_config.max_borrow_days if family.level_config else settings.MAX_BORROW_DAYS
            self.due_date = now.date() + timezone.timedelta(days=max_days)
            self.book_copy.status = BookStatus.BORROWED
            family.increment_borrow_count()
        elif new_status == BorrowStatus.BORROWED:
            if not self.due_date:
                family = self.family
                max_days = family.level_config.max_borrow_days if family.level_config else settings.MAX_BORROW_DAYS
                self.due_date = now.date() + timezone.timedelta(days=max_days)
            self.book_copy.status = BookStatus.BORROWED
        elif new_status == BorrowStatus.RETURNED:
            self.returned_at = now
            self.book_copy.status = BookStatus.AVAILABLE
            self._calculate_overdue_fine()
        elif new_status == BorrowStatus.OVERDUE:
            self.book_copy.status = BookStatus.BORROWED
        elif new_status == BorrowStatus.LOST:
            self.book_copy.status = BookStatus.LOST
        elif new_status == BorrowStatus.CANCELLED:
            self.book_copy.status = BookStatus.AVAILABLE
        
        self.book_copy.save()
        self.save()
        
        BorrowStatusLog.objects.create(
            borrow_record=self,
            from_status=old_status,
            to_status=new_status,
            operator=kwargs.get('operator'),
            notes=kwargs.get('notes', '')
        )
        
        return self

    def _calculate_overdue_fine(self):
        if self.due_date and self.returned_at:
            overdue_days = (self.returned_at.date() - self.due_date).days
            if overdue_days > 0:
                self.overdue_fine = overdue_days * 0.5

    def can_renew(self):
        if self.status not in [BorrowStatus.BORROWED, BorrowStatus.OVERDUE]:
            return False
        if self.renew_count >= self.max_renew_count:
            return False
        return True

    def renew(self):
        if not self.can_renew():
            raise ValueError('无法续借')
        self.renew_count += 1
        self.due_date = self.due_date + timezone.timedelta(days=settings.MAX_BORROW_DAYS)
        self.save()
        return self


class Reservation(BaseModel):
    family = models.ForeignKey(Family, on_delete=models.CASCADE, related_name='reservations', verbose_name='预约家庭')
    book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name='reservations', verbose_name='预约绘本')
    reserved_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reservations', verbose_name='预约人')
    queue_position = models.IntegerField(default=1, verbose_name='排队位置')
    status = models.CharField(max_length=20, choices=[
        ('waiting', '等待中'),
        ('available', '可借阅'),
        ('fulfilled', '已完成'),
        ('cancelled', '已取消'),
        ('expired', '已过期'),
    ], default='waiting', verbose_name='预约状态')
    expires_at = models.DateTimeField(null=True, blank=True, verbose_name='过期时间')
    notified_at = models.DateTimeField(null=True, blank=True, verbose_name='通知时间')

    class Meta:
        db_table = 'borrowing_reservation'
        verbose_name = '预约记录'
        verbose_name_plural = verbose_name
        ordering = ['queue_position']

    def __str__(self):
        return f'{self.family.name} - {self.book.title} (排队:{self.queue_position})'

    def cancel(self):
        self.status = 'cancelled'
        self.save()
        self._reorder_queue()

    def fulfill(self):
        self.status = 'fulfilled'
        self.save()
        self._reorder_queue()

    def _reorder_queue(self):
        waiting = Reservation.objects.filter(
            book=self.book,
            status='waiting',
            is_deleted=False
        ).order_by('queue_position', 'created_at')
        
        for idx, res in enumerate(waiting, 1):
            res.queue_position = idx
            res.save()


class BorrowStatusLog(BaseModel):
    borrow_record = models.ForeignKey(BorrowRecord, on_delete=models.CASCADE, related_name='status_logs', verbose_name='借阅记录')
    from_status = models.CharField(max_length=20, choices=BorrowStatus.choices, verbose_name='原状态')
    to_status = models.CharField(max_length=20, choices=BorrowStatus.choices, verbose_name='目标状态')
    operator = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='borrow_status_operations', verbose_name='操作人')
    notes = models.TextField(blank=True, verbose_name='备注')

    class Meta:
        db_table = 'borrowing_status_log'
        verbose_name = '借阅状态日志'
        verbose_name_plural = verbose_name
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.borrow_record}: {self.from_status} -> {self.to_status}'
