from rest_framework import serializers
from .models import Book, BookCopy, Category, Theme, BookStatus
from apps.activities.models import Activity
from apps.repairs.models import RepairRecord


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'parent', 'sort_order']


class ThemeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Theme
        fields = ['id', 'name', 'color']


class BookSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    
    class Meta:
        model = Book
        fields = ['id', 'isbn', 'title', 'author', 'publisher', 'cover', 'age_min', 'age_max',
                  'category', 'category_name', 'status', 'status_display', 'can_borrow',
                  'total_copies', 'location']
        read_only_fields = ['id']


class BookCopySerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = BookCopy
        fields = ['id', 'book', 'barcode', 'status', 'status_display', 'purchase_date', 'price', 'condition_notes']
        read_only_fields = ['id']


class BookListSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    available_copies = serializers.IntegerField(read_only=True)
    themes = ThemeSerializer(many=True, read_only=True)
    
    class Meta:
        model = Book
        fields = [
            'id', 'isbn', 'title', 'author', 'publisher', 'cover', 'age_min', 'age_max',
            'category', 'category_name', 'themes', 'status', 'status_display', 'can_borrow',
            'available_copies', 'total_copies', 'location'
        ]


class BookDetailSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    themes = ThemeSerializer(many=True, read_only=True)
    copies = BookCopySerializer(many=True, read_only=True)
    available_copies = serializers.IntegerField(read_only=True)
    current_borrowing = serializers.SerializerMethodField()
    repair_history = serializers.SerializerMethodField()
    related_activities = serializers.SerializerMethodField()
    
    class Meta:
        model = Book
        fields = '__all__'
    
    def get_current_borrowing(self, obj):
        from apps.borrowing.models import BorrowRecord, BorrowStatus
        records = BorrowRecord.objects.filter(
            book=obj,
            status__in=[BorrowStatus.BORROWED, BorrowStatus.OVERDUE, BorrowStatus.PICKED_UP],
            is_deleted=False
        ).select_related('family', 'borrower')
        return [
            {
                'id': r.id,
                'family_name': r.family.name,
                'borrower': r.borrower.username,
                'status': r.status,
                'status_display': r.get_status_display(),
                'due_date': r.due_date,
                'picked_up_at': r.picked_up_at,
            }
            for r in records
        ]
    
    def get_repair_history(self, obj):
        records = RepairRecord.objects.filter(
            book_copy__book=obj,
            is_deleted=False
        ).order_by('-created_at').select_related('reported_by', 'assigned_to')[:10]
        return [
            {
                'id': r.id,
                'damage_type': r.damage_type,
                'damage_type_display': r.get_damage_type_display(),
                'status': r.status,
                'status_display': r.get_status_display(),
                'priority': r.priority,
                'reported_by': r.reported_by.username if r.reported_by else '',
                'created_at': r.created_at,
                'completed_at': r.completed_at,
            }
            for r in records
        ]
    
    def get_related_activities(self, obj):
        activities = Activity.objects.filter(
            related_books=obj,
            is_deleted=False
        ).order_by('-start_time')[:5]
        return [
            {
                'id': a.id,
                'title': a.title,
                'activity_type': a.activity_type,
                'activity_type_display': a.get_activity_type_display(),
                'start_time': a.start_time,
                'status': a.status,
                'status_display': a.get_status_display(),
            }
            for a in activities
        ]
