from django.db import models
from apps.core.models import BaseModel


class Supplier(BaseModel):
    name = models.CharField(max_length=200, verbose_name='供应商名称')
    contact_person = models.CharField(max_length=100, blank=True, verbose_name='联系人')
    phone = models.CharField(max_length=50, blank=True, verbose_name='联系电话')
    email = models.EmailField(blank=True, verbose_name='邮箱')
    address = models.CharField(max_length=500, blank=True, verbose_name='地址')
    remark = models.TextField(blank=True, verbose_name='备注')

    class Meta:
        db_table = 'book_supplier'
        verbose_name = '供应商'
        verbose_name_plural = verbose_name
        ordering = ['-created_at']

    def __str__(self):
        return self.name


class Category(BaseModel):
    name = models.CharField(max_length=100, verbose_name='分类名称')
    parent = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='children', verbose_name='上级分类')
    sort_order = models.IntegerField(default=0, verbose_name='排序')
    description = models.TextField(blank=True, verbose_name='描述')

    class Meta:
        db_table = 'book_category'
        verbose_name = '图书分类'
        verbose_name_plural = verbose_name
        ordering = ['sort_order', 'name']

    def __str__(self):
        return self.name


class Book(BaseModel):
    STATUS_IN_STOCK = 'in_stock'
    STATUS_LOW_STOCK = 'low_stock'
    STATUS_OUT_OF_STOCK = 'out_of_stock'
    
    STATUS_CHOICES = [
        (STATUS_IN_STOCK, '有库存'),
        (STATUS_LOW_STOCK, '库存不足'),
        (STATUS_OUT_OF_STOCK, '缺货'),
    ]
    
    isbn = models.CharField(max_length=13, unique=True, verbose_name='ISBN')
    title = models.CharField(max_length=300, verbose_name='书名')
    author = models.CharField(max_length=200, verbose_name='作者')
    translator = models.CharField(max_length=200, blank=True, verbose_name='译者')
    publisher = models.CharField(max_length=200, verbose_name='出版社')
    publish_date = models.DateField(null=True, blank=True, verbose_name='出版日期')
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True, related_name='books', verbose_name='分类')
    supplier = models.ForeignKey(Supplier, on_delete=models.SET_NULL, null=True, blank=True, related_name='books', verbose_name='供应商')
    price = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='定价')
    cost_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name='进货价')
    pages = models.IntegerField(null=True, blank=True, verbose_name='页数')
    binding = models.CharField(max_length=50, blank=True, verbose_name='装帧')
    language = models.CharField(max_length=50, default='中文', verbose_name='语言')
    summary = models.TextField(blank=True, verbose_name='内容简介')
    cover_image = models.ImageField(upload_to='book_covers/', blank=True, null=True, verbose_name='封面图片')
    stock_quantity = models.IntegerField(default=0, verbose_name='库存数量')
    reserved_quantity = models.IntegerField(default=0, verbose_name='预留数量')
    low_stock_threshold = models.IntegerField(default=5, verbose_name='低库存阈值')
    location = models.CharField(max_length=100, blank=True, verbose_name='书架位置')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_IN_STOCK, verbose_name='状态')
    allow_reservation = models.BooleanField(default=True, verbose_name='是否允许预留')
    
    class Meta:
        db_table = 'book'
        verbose_name = '图书'
        verbose_name_plural = verbose_name
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['isbn']),
            models.Index(fields=['title']),
            models.Index(fields=['author']),
            models.Index(fields=['status']),
        ]

    def __str__(self):
        return f'{self.title} ({self.isbn})'
    
    @property
    def available_quantity(self):
        return self.stock_quantity - self.reserved_quantity
    
    def save(self, *args, **kwargs):
        if self.stock_quantity <= 0:
            self.status = self.STATUS_OUT_OF_STOCK
        elif self.stock_quantity <= self.low_stock_threshold:
            self.status = self.STATUS_LOW_STOCK
        else:
            self.status = self.STATUS_IN_STOCK
        super().save(*args, **kwargs)


class BookImage(BaseModel):
    book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name='images', verbose_name='图书')
    image = models.ImageField(upload_to='book_images/', verbose_name='图片')
    sort_order = models.IntegerField(default=0, verbose_name='排序')
    is_primary = models.BooleanField(default=False, verbose_name='是否主图')

    class Meta:
        db_table = 'book_image'
        verbose_name = '图书图片'
        verbose_name_plural = verbose_name
        ordering = ['sort_order']

    def __str__(self):
        return f'{self.book.title} - 图片{self.id}'
