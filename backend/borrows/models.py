from django.db import models
from books.models import Book, BookStatus
from members.models import Member
from datetime import timedelta

class BorrowStatus(models.TextChoices):
    BORROWED = 'borrowed', '借阅中'
    RETURNED = 'returned', '已归还'
    OVERDUE = 'overdue', '已逾期'
    LOST = 'lost', '已丢失'

class Borrow(models.Model):
    book = models.ForeignKey(Book, on_delete=models.PROTECT, related_name='borrows')
    member = models.ForeignKey(Member, on_delete=models.PROTECT, related_name='borrows')
    borrow_date = models.DateField(auto_now_add=True)
    due_date = models.DateField()
    return_date = models.DateField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=BorrowStatus.choices, default=BorrowStatus.BORROWED)
    renew_count = models.IntegerField(default=0)
    max_renew = models.IntegerField(default=2)
    create_time = models.DateTimeField(auto_now_add=True)
    update_time = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'borrows'

    def __str__(self):
        return f"{self.member.family_name} - {self.book.title}"

    def is_overdue(self):
        from django.utils import timezone
        if self.status == BorrowStatus.BORROWED:
            return timezone.now().date() > self.due_date
        return False

    def return_book(self):
        from django.utils import timezone
        self.return_date = timezone.now().date()
        self.status = BorrowStatus.RETURNED
        self.book.status = BookStatus.AVAILABLE
        self.book.save()
        self.save()
        return True

    def renew(self):
        if self.renew_count < self.max_renew and not self.is_overdue():
            self.due_date += timedelta(days=14)
            self.renew_count += 1
            self.save()
            return True
        return False
