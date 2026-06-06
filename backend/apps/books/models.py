from django.db import models
from apps.common.models import BaseModel


class BookStatus(models.TextChoices):
    AVAILABLE = 'available', '可外借'
    BORROWED = 'borrowed', '已借出'
    REPAIRING = 'repairing', '修复中'
    RESERVED = 'reserved', '已预约'
    OFF_SHELF = 'off_shelf', '已下架'
    LOST = 'lost', '已丢失'


class Category(BaseModel):
    name = models.CharField(max_length=50, verbose_name='分类名称')
    parent = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='children', verbose_name='父分类')
    sort_order = models.IntegerField(default=0, verbose_name='排序')

    class Meta:
        db_table = 'books_category'
        verbose_name = '绘本分类'
        verbose_name_plural = verbose_name

    def __str__(self):
        return self.name


class Theme(BaseModel):
    name = models.CharField(max_length=50, verbose_name='主题名称')
    color = models.CharField(max_length=20, default='#1890ff', verbose_name='主题颜色')

    class Meta:
        db_table = 'books_theme'
        verbose_name = '绘本主题'
        verbose_name_plural = verbose_name

    def __str__(self):
        return self.name


class Book(BaseModel):
    isbn = models.CharField(max_length=20, unique=True, verbose_name='ISBN')
    title = models.CharField(max_length=200, verbose_name='书名')
    author = models.CharField(max_length=100, verbose_name='作者')
    publisher = models.CharField(max_length=100, verbose_name='出版社')
    publish_date = models.DateField(null=True, blank=True, verbose_name='出版日期')
    cover = models.ImageField(upload_to='books/covers/', verbose_name='封面')
    description = models.TextField(blank=True, verbose_name='简介')
    age_min = models.IntegerField(default=0, verbose_name='适合最小年龄')
    age_max = models.IntegerField(default=12, verbose_name='适合最大年龄')
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, related_name='books', verbose_name='分类')
    themes = models.ManyToManyField(Theme, related_name='books', blank=True, verbose_name='主题标签')
    total_copies = models.IntegerField(default=1, verbose_name='馆藏总数')
    status = models.CharField(max_length=20, choices=BookStatus.choices, default=BookStatus.AVAILABLE, verbose_name='状态')
    can_borrow = models.BooleanField(default=True, verbose_name='是否可外借')
    location = models.CharField(max_length=50, blank=True, verbose_name='馆藏位置')

    class Meta:
        db_table = 'books_book'
        verbose_name = '绘本'
        verbose_name_plural = verbose_name
        ordering = ['-created_at']

    def __str__(self):
        return self.title

    @property
    def available_copies(self):
        return self.copies.filter(status=BookStatus.AVAILABLE, is_deleted=False).count()

    @property
    def current_borrowing_families(self):
        from apps.borrowing.models import BorrowRecord
        return BorrowRecord.objects.filter(
            book_copy__book=self,
            status__in=['borrowed', 'overdue'],
            is_deleted=False
        ).select_related('family')


class BookCopy(BaseModel):
    book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name='copies', verbose_name='所属绘本')
    barcode = models.CharField(max_length=50, unique=True, verbose_name='条码号')
    status = models.CharField(max_length=20, choices=BookStatus.choices, default=BookStatus.AVAILABLE, verbose_name='状态')
    purchase_date = models.DateField(null=True, blank=True, verbose_name='采购日期')
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name='价格')
    condition_notes = models.TextField(blank=True, verbose_name='品相备注')

    class Meta:
        db_table = 'books_book_copy'
        verbose_name = '绘本副本'
        verbose_name_plural = verbose_name

    def __str__(self):
        return f'{self.book.title} - {self.barcode}'
