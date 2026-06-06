from django.db import models
from books.models import Book, BookStatus, DamageLevel
from members.models import Member
from borrows.models import Borrow

class RepairStatus(models.TextChoices):
    PENDING = 'pending', '待修复'
    REPAIRING = 'repairing', '修复中'
    COMPLETED = 'completed', '已修复'
    OFF_SHELF = 'off_shelf', '需下架'

class RepairRecord(models.Model):
    book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name='repair_records')
    reporter = models.ForeignKey(Member, on_delete=models.PROTECT, related_name='reported_repairs')
    borrow = models.ForeignKey(Borrow, on_delete=models.SET_NULL, null=True, blank=True, related_name='repair_records')
    damage_level = models.CharField(max_length=20, choices=DamageLevel.choices)
    description = models.TextField(blank=True)
    photo = models.ImageField(upload_to='repair_photos/', blank=True, null=True)
    status = models.CharField(max_length=20, choices=RepairStatus.choices, default=RepairStatus.PENDING)
    repair_note = models.TextField(blank=True)
    create_time = models.DateTimeField(auto_now_add=True)
    update_time = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'repair_records'
        ordering = ['-create_time']

    def __str__(self):
        return f"{self.book.title} - {self.damage_level}"

    def save(self, *args, **kwargs):
        is_new = self.pk is None
        super().save(*args, **kwargs)
        if is_new:
            self._update_book_status()

    def _update_book_status(self):
        if self.damage_level in [DamageLevel.AFFECT_READ, DamageLevel.NEED_OFF]:
            self.book.status = BookStatus.OFF_SHELF
            self.status = RepairStatus.OFF_SHELF
        elif self.damage_level == DamageLevel.LIGHT:
            self.book.status = BookStatus.DAMAGED
            self.status = RepairStatus.PENDING
        self.book.save()
        super().save(update_fields=['status'])

    def start_repair(self):
        if self.status in [RepairStatus.PENDING, RepairStatus.OFF_SHELF]:
            self.status = RepairStatus.REPAIRING
            self.book.status = BookStatus.REPAIRING
            self.book.save()
            self.save()
            return True
        return False

    def complete_repair(self):
        if self.status == RepairStatus.REPAIRING:
            self.status = RepairStatus.COMPLETED
            self.book.status = BookStatus.AVAILABLE
            self.book.save()
            self.save()
            return True
        return False
