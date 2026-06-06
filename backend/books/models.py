from django.db import models

class BookStatus(models.TextChoices):
    AVAILABLE = 'available', '可借阅'
    BORROWED = 'borrowed', '已借出'
    DAMAGED = 'damaged', '破损待修'
    REPAIRING = 'repairing', '修复中'
    OFF_SHELF = 'off_shelf', '已下架'
    RESERVED = 'reserved', '已预约'

class DamageLevel(models.TextChoices):
    LIGHT = 'light', '轻微磨损'
    AFFECT_READ = 'affect_read', '影响阅读'
    NEED_OFF = 'need_off', '需下架'

class Book(models.Model):
    isbn = models.CharField(max_length=20, db_index=True)
    title = models.CharField(max_length=200)
    author = models.CharField(max_length=100)
    publisher = models.CharField(max_length=100, blank=True)
    cover_image = models.ImageField(upload_to='book_covers/', blank=True, null=True)
    status = models.CharField(max_length=20, choices=BookStatus.choices, default=BookStatus.AVAILABLE)
    location = models.CharField(max_length=50, blank=True)
    create_time = models.DateTimeField(auto_now_add=True)
    update_time = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'books'

    def __str__(self):
        return f"{self.title} ({self.isbn})"

    def can_borrow(self):
        return self.status == BookStatus.AVAILABLE

    def mark_damaged(self, damage_level):
        if damage_level in [DamageLevel.AFFECT_READ, DamageLevel.NEED_OFF]:
            self.status = BookStatus.OFF_SHELF
        else:
            self.status = BookStatus.DAMAGED
        self.save()
        return self.status
