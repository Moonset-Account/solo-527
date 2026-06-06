from django.contrib import admin
from .models import Book, BookCopy, Category, Theme


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'parent', 'sort_order']
    list_filter = ['parent']


@admin.register(Theme)
class ThemeAdmin(admin.ModelAdmin):
    list_display = ['name', 'color']


@admin.register(Book)
class BookAdmin(admin.ModelAdmin):
    list_display = ['title', 'isbn', 'author', 'publisher', 'category', 'status', 'can_borrow', 'total_copies', 'available_copies']
    list_filter = ['status', 'can_borrow', 'category', 'themes']
    search_fields = ['title', 'isbn', 'author']


@admin.register(BookCopy)
class BookCopyAdmin(admin.ModelAdmin):
    list_display = ['book', 'barcode', 'status', 'purchase_date', 'price']
    list_filter = ['status']
    search_fields = ['barcode', 'book__title']
